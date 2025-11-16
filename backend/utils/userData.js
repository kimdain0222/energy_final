const fs = require('fs').promises;
const { USERS_FILE } = require('../config/paths');

// 사용자 데이터 읽기
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('readUsers 오류:', error.message);
    console.error('파일 경로:', USERS_FILE);
    return [];
  }
}

// 사용자 데이터 쓰기
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// 데모용 가상 사용자 생성
async function generateDemoUsers() {
  const names = [
    '김에너지', '이절약', '박그린', '최환경', '정지구', '강친환경', '조에코', '윤스마트',
    '장효율', '임태양', '한바람', '오지열', '서수력', '신재생', '유저원', '류환경',
    '마절전', '백효율', '송그린', '양지구', '배친환경', '전에코', '정스마트', '최효율',
    '강태양', '김바람', '이지열', '박수력', '조재생', '윤저원'
  ];

  const regions = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', 
                   '경북', '경남', '충북', '충남', '전북', '전남', '강원', '제주'];
  const housingTypes = ['아파트', '단독주택', '오피스텔'];
  const airconOptions = ['거의 사용안함', '가끔 사용', '자주 사용', '거의 항상'];
  const heatingOptions = ['도시가스', '전기히터', '지역난방', '기름보일러'];
  const lightingOptions = ['형광등 위주', 'LED 일부', 'LED 대부분', 'LED 전부'];
  const applianceOptions = ['적음', '보통', '많음'];

  const users = await readUsers();
  const baseTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30일 전부터 시작

  for (let i = 0; i < 30; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const housingType = housingTypes[Math.floor(Math.random() * housingTypes.length)];
    const area = Math.floor(Math.random() * 31) + 20; // 20~50평
    const householdSize = Math.floor(Math.random() * 6) + 1; // 1~6명
    
    // 절약량 레벨별 분포 (상위권, 중위권, 하위권)
    let savedKwh, targetKwh, achievementRate;
    if (i < 5) {
      // 상위권 (120~200kWh)
      savedKwh = Math.floor(Math.random() * 81) + 120;
      targetKwh = Math.floor(Math.random() * 50) + 100;
    } else if (i < 15) {
      // 중위권 (50~120kWh)
      savedKwh = Math.floor(Math.random() * 71) + 50;
      targetKwh = Math.floor(Math.random() * 40) + 60;
    } else {
      // 하위권 (10~50kWh)
      savedKwh = Math.floor(Math.random() * 41) + 10;
      targetKwh = Math.floor(Math.random() * 30) + 40;
    }
    
    achievementRate = Math.min(150, Math.round((savedKwh / targetKwh) * 100));
    
    // 챌린지 시작일과 종료일
    const daysAgo = Math.floor(Math.random() * 30); // 0~30일 전 시작
    const startDate = new Date(baseTime + daysAgo * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30일 챌린지

    // 포인트 계산 (1kWh당 10포인트 + 달성 보너스)
    let points = savedKwh * 10;
    if (achievementRate >= 100) points += 500;
    if (savedKwh >= 50) points += 100;
    if (savedKwh >= 100) points += 100;

    // 배지 획득 (절약량 기반)
    const badges = ['badge000', 'badge001']; // 회원가입 뱃지 + 첫 절약은 모두
    if (savedKwh >= 10) badges.push('badge008'); // 새싹 절약
    if (savedKwh >= 50) badges.push('badge006'); // 50kWh 클럽
    if (savedKwh >= 100) badges.push('badge002'); // 에너지 마스터
    if (savedKwh >= 200) badges.push('badge009'); // 200kWh 클럽
    if (achievementRate >= 100 && achievementRate < 120) badges.push('badge012'); // 완벽 달성
    if (achievementRate >= 120 && achievementRate < 150) badges.push('badge013'); // 우수 달성
    if (achievementRate >= 150 && achievementRate < 200) badges.push('badge007'); // 목표 달성왕
    if (achievementRate >= 200) badges.push('badge014'); // 초월 달성

    // 에너지 티어 (절약량에 따라 역산)
    let energyTier;
    if (savedKwh < 30) {
      energyTier = Math.floor(Math.random() * 2) + 2; // 2~3구간
    } else if (savedKwh < 80) {
      energyTier = 2;
    } else {
      energyTier = Math.floor(Math.random() * 2) + 1; // 1~2구간
    }

    const user = {
      id: `demo_user_${i + 1}`,
      email: `demo${i + 1}@energy.com`,
      password: 'demo123', // 데모용 통일 비밀번호
      name: names[i] || `데모사용자${i + 1}`,
      phone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      region: region,
      housingType: housingType,
      area: area,
      householdSize: householdSize,
      energyTier: energyTier,
      surveyAnswers: {
        aircon: airconOptions[Math.floor(Math.random() * airconOptions.length)],
        heating: heatingOptions[Math.floor(Math.random() * heatingOptions.length)],
        lighting: lightingOptions[Math.floor(Math.random() * lightingOptions.length)],
        appliances: applianceOptions[Math.floor(Math.random() * applianceOptions.length)]
      },
      currentChallenge: {
        id: `challenge_demo_${i + 1}`,
        userId: `demo_user_${i + 1}`,
        type: 'monthly',
        targetKwh: targetKwh,
        savedKwh: savedKwh,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        achievementRate: achievementRate,
        status: achievementRate >= 100 ? 'completed' : 'active',
        createdAt: startDate.toISOString()
      },
      totalSaved: savedKwh + Math.floor(Math.random() * 50), // 누적 절약량
      points: points,
      badges: badges,
      createdAt: new Date(baseTime + daysAgo * 24 * 60 * 60 * 1000).toISOString()
    };

    users.push(user);
  }

  await writeUsers(users);
  return users;
}

module.exports = {
  readUsers,
  writeUsers,
  generateDemoUsers
};

