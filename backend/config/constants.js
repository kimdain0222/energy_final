// 한전 공개 통계 기반 지역별 평균 데이터
const kepcoRegionData = {
  "서울_아파트": { avgUsage: 350, avgCost: 70000 },
  "서울_단독주택": { avgUsage: 480, avgCost: 95000 },
  "서울_오피스텔": { avgUsage: 280, avgCost: 56000 },
  "경기_아파트": { avgUsage: 380, avgCost: 75000 },
  "경기_단독주택": { avgUsage: 520, avgCost: 105000 },
  "경기_오피스텔": { avgUsage: 300, avgCost: 60000 },
  "인천_아파트": { avgUsage: 360, avgCost: 72000 },
  "인천_단독주택": { avgUsage: 500, avgCost: 100000 },
  "부산_아파트": { avgUsage: 340, avgCost: 68000 },
  "부산_단독주택": { avgUsage: 470, avgCost: 94000 },
  "대구_아파트": { avgUsage: 330, avgCost: 66000 },
  "대구_단독주택": { avgUsage: 460, avgCost: 92000 },
  "대전_아파트": { avgUsage: 350, avgCost: 70000 },
  "광주_아파트": { avgUsage: 340, avgCost: 68000 },
  "울산_아파트": { avgUsage: 360, avgCost: 72000 },
  "세종_아파트": { avgUsage: 370, avgCost: 74000 },
  "경북_아파트": { avgUsage: 320, avgCost: 64000 },
  "경북_단독주택": { avgUsage: 450, avgCost: 90000 },
  "경남_아파트": { avgUsage: 330, avgCost: 66000 },
  "경남_단독주택": { avgUsage: 460, avgCost: 92000 },
  "충북_아파트": { avgUsage: 310, avgCost: 62000 },
  "충북_단독주택": { avgUsage: 440, avgCost: 88000 },
  "충남_아파트": { avgUsage: 320, avgCost: 64000 },
  "충남_단독주택": { avgUsage: 450, avgCost: 90000 },
  "전북_아파트": { avgUsage: 310, avgCost: 62000 },
  "전북_단독주택": { avgUsage: 440, avgCost: 88000 },
  "전남_아파트": { avgUsage: 320, avgCost: 64000 },
  "전남_단독주택": { avgUsage: 450, avgCost: 90000 },
  "강원_아파트": { avgUsage: 340, avgCost: 68000 },
  "강원_단독주택": { avgUsage: 480, avgCost: 96000 },
  "제주_아파트": { avgUsage: 380, avgCost: 76000 },
  "제주_단독주택": { avgUsage: 520, avgCost: 104000 }
};

// 계절별 가중치
const seasonalWeights = {
  "겨울": 1.2,  // 난방 수요 증가
  "여름": 1.15, // 냉방 수요 증가  
  "봄/가을": 0.9 // 중간기 낮은 수요
};

// 에너지 사용 습관 설문 영향도
const surveyImpact = {
  "에어컨": {
    "거의 사용안함": 0.9,
    "가끔 사용": 1.0,
    "자주 사용": 1.2,
    "거의 항상": 1.5
  },
  "난방": {
    "도시가스": 1.0,
    "전기히터": 1.3,
    "지역난방": 1.1,
    "기름보일러": 1.2
  },
  "조명": {
    "형광등 위주": 1.1,
    "LED 일부": 1.0,
    "LED 대부분": 0.95,
    "LED 전부": 0.9
  },
  "가전사용": {
    "적음": 0.95,
    "보통": 1.0,
    "많음": 1.15
  },
  "가족수": {
    1: 0.6,
    2: 0.75,
    3: 0.9,
    4: 1.0,
    5: 1.1,
    6: 1.2
  }
};

// 검증된 절약 시나리오
const verifiedSavingScenarios = {
  "에어컨_1시간_절약": {
    savingKwh: 1.2,
    savingCost: 240,
    source: "에너지공단 에어컨 사용효율 개선사례"
  },
  "대기전력_차단": {
    savingKwh: 0.8,
    savingCost: 160,
    source: "한전 대기전력 관리 가이드"
  },
  "LED_조명_교체": {
    savingKwh: 1.5,
    savingCost: 300,
    source: "산업통상자원부 에너지효율등급 자료"
  },
  "냉장고_설정_조절": {
    savingKwh: 0.5,
    savingCost: 100,
    source: "에너지공단 가정용 가전제품 절약 가이드"
  },
  "세탁기_빨래_모아서": {
    savingKwh: 0.3,
    savingCost: 60,
    source: "한전 에너지절약 프로그램"
  }
};

module.exports = {
  kepcoRegionData,
  seasonalWeights,
  surveyImpact,
  verifiedSavingScenarios
};

