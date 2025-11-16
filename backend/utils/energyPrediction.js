const { kepcoRegionData, seasonalWeights, surveyImpact } = require('../config/constants');

// 현재 계절 계산
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return "겨울";
  if (month >= 6 && month <= 8) return "여름";
  return "봄/가을";
}

// 에너지 사용량 예측 함수
function calculateEnergyPrediction(userProfile, surveyAnswers = {}) {
  const region = userProfile.region || "서울";
  const housingType = userProfile.housingType || "아파트";
  const key = `${region}_${housingType}`;
  
  const baseData = kepcoRegionData[key] || kepcoRegionData["서울_아파트"];
  let adjustedUsage = baseData.avgUsage;
  
  // 평수 조정 (30평 기준)
  const area = userProfile.area || 30;
  adjustedUsage = adjustedUsage * (area / 30);
  
  // 가족수 조정
  const familySize = userProfile.householdSize || 4;
  const familyImpact = surveyImpact["가족수"][familySize] || 1.0;
  adjustedUsage = adjustedUsage * familyImpact;
  
  // 설문 응답에 따른 조정
  if (surveyAnswers.aircon) {
    adjustedUsage *= surveyImpact["에어컨"][surveyAnswers.aircon] || 1.0;
  }
  if (surveyAnswers.heating) {
    adjustedUsage *= surveyImpact["난방"][surveyAnswers.heating] || 1.0;
  }
  if (surveyAnswers.lighting) {
    adjustedUsage *= surveyImpact["조명"][surveyAnswers.lighting] || 1.0;
  }
  if (surveyAnswers.appliances) {
    adjustedUsage *= surveyImpact["가전사용"][surveyAnswers.appliances] || 1.0;
  }
  
  // 계절별 조정
  const currentSeason = getCurrentSeason();
  adjustedUsage *= seasonalWeights[currentSeason];
  
  const avgRate = 200; // kWh당 평균 단가
  const predictedCost = Math.round(adjustedUsage * avgRate);
  
  return {
    predictedUsage: Math.round(adjustedUsage),
    predictedCost: predictedCost,
    confidence: "85%",
    dataSource: "한국전력공사 2023년 통계",
    assumptions: [
      "지역별 평균 데이터 기반",
      "설문 응답 반영",
      "계절별 변동 고려",
      "평수 및 가족수 반영"
    ],
    disclaimer: "실제 사용량은 생활패턴에 따라 차이가 있을 수 있습니다",
    season: currentSeason
  };
}

// 주간별 예상 절약량 계산 (목표 기반)
function calculateWeeklyProjection(challenge, userProfile, surveyAnswers) {
  if (!challenge || !challenge.targetKwh) {
    return null;
  }
  
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1);
  
  const daysPerWeek = 7;
  const weeks = Math.ceil(totalDays / daysPerWeek);
  const dailySavingTarget = challenge.targetKwh / totalDays;
  const weeklyTarget = dailySavingTarget * daysPerWeek;
  
    const actualSaved = challenge.savedKwh || 0;
    const currentWeekNumber = Math.min(Math.ceil(daysElapsed / daysPerWeek), weeks);
    
    // 주간별 데이터 생성
    const weeklyData = [];
    let cumulativeSavedForPastWeeks = 0;
    
    for (let week = 1; week <= weeks; week++) {
      const weekStartDay = (week - 1) * daysPerWeek;
      const weekEndDay = Math.min(week * daysPerWeek, totalDays);
      const daysInWeek = weekEndDay - weekStartDay;
      const weekTarget = dailySavingTarget * daysInWeek;
      
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + weekStartDay);
      const weekEndDate = new Date(startDate);
      weekEndDate.setDate(weekEndDate.getDate() + weekEndDay - 1);
      
      const isCurrentWeek = week === currentWeekNumber;
      const isCompleted = week < currentWeekNumber;
      const isFuture = week > currentWeekNumber;
      
      // 주간 절약량 계산
      let weekSaved = 0;
      
      if (isCompleted && currentWeekNumber > 1) {
        // 지난 주: 실제 절약량을 균등 분배 (완료된 주 수 기준)
        weekSaved = (actualSaved / currentWeekNumber) || (weekTarget * 0.7);
        cumulativeSavedForPastWeeks += weekSaved;
      } else if (isCurrentWeek) {
        // 현재 주: 실제 절약량에서 지난 주 제외
        const remainingSaved = Math.max(0, actualSaved - cumulativeSavedForPastWeeks);
        
        const daysInCurrentWeek = Math.min(daysElapsed - weekStartDay, daysInWeek);
        if (daysInCurrentWeek > 0) {
          // 주간 진행률 기반 계산
          const weekProgress = daysInCurrentWeek / daysInWeek;
          const expectedForCurrentWeek = weekTarget * weekProgress;
          
          // 실제 절약량이 있으면 사용, 없으면 예측값 사용
          weekSaved = remainingSaved > 0 ? remainingSaved : expectedForCurrentWeek * 0.8;
        } else {
          weekSaved = weekTarget * 0.8; // 최소 예측값
        }
      } else if (isFuture) {
        // 미래 주: 예측값 (목표의 85% 달성 가정)
        weekSaved = weekTarget * 0.85;
      }
      
      const weekAchievement = weekTarget > 0 ? Math.min(150, Math.round((weekSaved / weekTarget) * 100)) : 0;
    
    weeklyData.push({
      week: week,
      weekLabel: `${week}주차`,
      weekStart: weekStartDate.toISOString().split('T')[0],
      weekEnd: weekEndDate.toISOString().split('T')[0],
      target: Math.round(weekTarget * 10) / 10,
      saved: Math.round(weekSaved * 10) / 10,
      achievementRate: weekAchievement,
      isCurrent: isCurrentWeek,
      isCompleted: isCompleted,
      isFuture: isFuture,
      daysInWeek: daysInWeek
    });
  }
  
  return weeklyData;
}

module.exports = {
  calculateEnergyPrediction,
  calculateWeeklyProjection,
  getCurrentSeason
};

