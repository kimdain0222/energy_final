// 배지 체크 함수
function checkAndAwardBadges(user, availableBadges) {
  if (!user.badges) user.badges = [];
  
  const totalSaved = user.totalSaved || 0;
  const achievementRate = user.currentChallenge?.achievementRate || 0;
  const challenge = user.currentChallenge || {};
  const completedChallenges = user.completedChallenges || [];
  const analysisCount = (user.analysisHistory || []).length;
  const viewedProgramsCount = (user.viewedPrograms || []).length;
  const rankingVisits = user.rankingVisits || 0;

  availableBadges.forEach(badge => {
    if (user.badges.includes(badge.id)) return;

    let shouldAward = false;

    switch (badge.id) {
      // 절약량 기반
      case 'badge008': // 새싹 절약 - 10kWh
        shouldAward = totalSaved >= 10;
        break;
      case 'badge006': // 50kWh 클럽
        shouldAward = totalSaved >= 50;
        break;
      case 'badge002': // 에너지 마스터 - 100kWh
        shouldAward = totalSaved >= 100;
        break;
      case 'badge009': // 200kWh 클럽
        shouldAward = totalSaved >= 200;
        break;
      case 'badge010': // 탄소 제로 히어로 - 500kWh
        shouldAward = totalSaved >= 500;
        break;
      case 'badge011': // 절약 레전드 - 1000kWh
        shouldAward = totalSaved >= 1000;
        break;
      
      // 달성률 기반
      case 'badge012': // 완벽 달성 - 100%
        shouldAward = achievementRate >= 100 && achievementRate < 120;
        break;
      case 'badge013': // 우수 달성 - 120%
        shouldAward = achievementRate >= 120 && achievementRate < 150;
        break;
      case 'badge007': // 목표 달성왕 - 150%
        shouldAward = achievementRate >= 150 && achievementRate < 200;
        break;
      case 'badge014': // 초월 달성 - 200%
        shouldAward = achievementRate >= 200;
        break;
      
      // 지속성 기반 (완료된 챌린지 수로 추정)
      case 'badge015': // 주간 참여자 - 1주
        shouldAward = completedChallenges.length >= 1;
        break;
      case 'badge004': // 지속의 달인 - 4주
        shouldAward = completedChallenges.length >= 4;
        break;
      case 'badge016': // 장기 파이터 - 8주
        shouldAward = completedChallenges.length >= 8;
        break;
      case 'badge017': // 연속 챔피언 - 12주
        shouldAward = completedChallenges.length >= 12;
        break;
      
      // 참여 활동 기반
      case 'badge022': // 맞춤형 설문 완료
        shouldAward = user.surveyAnswers && Object.keys(user.surveyAnswers).length > 0;
        break;
      case 'badge023': // 분석 마스터 - 5회 이상
        shouldAward = analysisCount >= 5;
        break;
      case 'badge024': // 지원사업 탐험가 - 10개 이상
        shouldAward = viewedProgramsCount >= 10;
        break;
      case 'badge025': // 커뮤니티 참여자 - 10회 이상
        shouldAward = rankingVisits >= 10;
        break;
      
      // 특별 이벤트 기반
      case 'badge027': // 보너스 퀘스트 - 월간 챌린지 완료
        shouldAward = challenge.type === 'monthly' && challenge.status === 'completed';
        break;
      case 'badge028': // 레인보우 - 모든 기본 배지 획득 (나중에 계산)
        // 기본 배지: badge000, badge001, badge008, badge006, badge002, badge012, badge015, badge022
        const basicBadges = ['badge000', 'badge001', 'badge008', 'badge006', 'badge002', 'badge012', 'badge015', 'badge022'];
        shouldAward = basicBadges.every(id => user.badges.includes(id));
        break;
    }

    if (shouldAward) {
      user.badges.push(badge.id);
      user.points = (user.points || 0) + 100; // 배지 보너스
    }
  });
}

module.exports = {
  checkAndAwardBadges
};

