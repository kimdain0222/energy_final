// 환경 변수 로드 (선택사항)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv가 설치되지 않은 경우 무시
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
// CORS 설정 - Netlify 프론트엔드 허용
const allowedOrigins = [
    'https://ecosync2025.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// FRONTEND_URL 환경 변수 처리 (슬래시 제거 및 정규화)
if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, ''); // 끝의 슬래시 제거
    if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
        allowedOrigins.push(frontendUrl);
        // Netlify 프리뷰 URL 패턴도 허용
        if (frontendUrl.includes('netlify.app')) {
            const baseUrl = frontendUrl.split('--')[1] || frontendUrl;
            if (baseUrl && baseUrl !== frontendUrl && !allowedOrigins.includes(baseUrl)) {
                allowedOrigins.push(baseUrl);
            }
        }
    }
}

console.log('=== CORS 설정 초기화 ===');
console.log('허용된 CORS 도메인:', allowedOrigins);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '설정되지 않음');

// OPTIONS 요청을 가장 먼저 처리 (preflight 요청) - 모든 경로에 대해
app.use((req, res, next) => {
    // OPTIONS 요청인 경우 즉시 처리
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        console.log('=== OPTIONS 요청 수신 ===');
        console.log('Origin:', origin);
        console.log('Path:', req.path);
        console.log('허용된 도메인 목록:', allowedOrigins);
        
        // origin이 netlify.app으로 끝나는지 확인 (유연한 매칭)
        const isNetlifyOrigin = origin && origin.includes('netlify.app');
        const isExactMatch = origin && allowedOrigins.includes(origin);
        const isAllowed = !origin || isExactMatch || isNetlifyOrigin || process.env.NODE_ENV !== 'production';
        
        console.log('isNetlifyOrigin:', isNetlifyOrigin);
        console.log('isExactMatch:', isExactMatch);
        console.log('isAllowed:', isAllowed);
        
        if (isAllowed) {
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                console.log('✅ CORS 헤더 설정:', origin);
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');
            console.log('✅ OPTIONS 요청 허용됨');
            return res.status(200).end();
        }
        
        // 허용되지 않은 origin
        console.log('❌ OPTIONS 요청 차단:', origin);
        res.status(403).end();
        return;
    }
    
    // OPTIONS가 아닌 요청은 다음 미들웨어로
    next();
});

// 요청 로깅 미들웨어 (OPTIONS 제외하고 모든 요청 기록)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method !== 'OPTIONS') {
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
});

// CORS 설정
const corsOptions = {
    origin: function (origin, callback) {
        console.log('🔍 CORS origin 체크:', origin);
        
        // origin이 없으면 (Postman, curl 등 직접 요청)
        if (!origin) {
            console.log('✅ Origin 없음 - 허용');
            return callback(null, true);
        }
        
        // 허용된 도메인 목록에 있으면 허용
        if (allowedOrigins.includes(origin)) {
            console.log('✅ 허용된 origin:', origin);
            return callback(null, true);
        }
        
        // netlify.app으로 끝나는 모든 도메인 허용 (프리뷰 URL 포함)
        if (origin.includes('netlify.app')) {
            console.log('✅ Netlify 도메인 허용:', origin);
            return callback(null, true);
        }
        
        // 개발 환경에서는 모든 도메인 허용
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ 개발 환경 - 모든 origin 허용');
            return callback(null, true);
        }
        
        console.log('❌ CORS 차단된 origin:', origin);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400
};

// CORS 미들웨어 적용
app.use(cors(corsOptions));

// 모든 응답에 CORS 헤더 명시적 추가 (이중 안전장치)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // 허용된 origin인지 확인 (Netlify 도메인 포함)
    const isNetlifyOrigin = origin && origin.includes('netlify.app');
    const isAllowed = !origin || 
                     allowedOrigins.includes(origin) || 
                     isNetlifyOrigin || 
                     process.env.NODE_ENV !== 'production';
    
    if (isAllowed) {
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }
    next();
});
app.use(bodyParser.json());
// 배포 환경에서는 프론트엔드가 Netlify에 있으므로 정적 파일 제공은 선택사항
// 로컬 개발 시에만 사용
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static('frontend'));
}

// 데이터 파일 경로
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRAMS_FILE = path.join(DATA_DIR, 'programs.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');

// 데이터 파일 초기화
async function initializeData() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // users.json 초기화
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
  }

  // programs.json 초기화 (캐시용)
  try {
    await fs.access(PROGRAMS_FILE);
  } catch {
    await fs.writeFile(PROGRAMS_FILE, JSON.stringify([], null, 2));
  }

  // challenges.json 초기화
  try {
    await fs.access(CHALLENGES_FILE);
  } catch {
    const defaultChallenges = {
      activeChallenges: [],
      completedChallenges: [],
      badges: [
        { id: 'badge000', name: '시작의 발걸음', description: '에너지 절약 플랫폼에 가입하셨습니다!', icon: '👋', condition: '회원가입 완료' },
        { id: 'badge001', name: '첫 절약', description: '첫 번째 목표 설정', icon: '🌱', condition: '첫 목표 설정' },
        { id: 'badge002', name: '에너지 마스터', description: '100kWh 절약 달성', icon: '⚡', condition: '100kWh 절약' },
        { id: 'badge003', name: '주간 챔피언', description: '주간 1위 달성', icon: '🥇', condition: '주간 1위' },
        { id: 'badge004', name: '지속의 달인', description: '4주 연속 참여', icon: '🔥', condition: '4주 연속 참여' },
        { id: 'badge005', name: '지역 히어로', description: '지역별 1위 달성', icon: '🏆', condition: '지역별 1위' },
        { id: 'badge006', name: '50kWh 클럽', description: '50kWh 절약 달성', icon: '💚', condition: '50kWh 절약' },
        { id: 'badge007', name: '목표 달성왕', description: '목표 150% 초과 달성', icon: '🎯', condition: '목표 150% 초과' }
      ]
    };
    await fs.writeFile(CHALLENGES_FILE, JSON.stringify(defaultChallenges, null, 2));
  }

  // 데모용 가상 사용자 생성 (기존 사용자가 5명 미만일 때만)
  try {
    const existingUsers = await readUsers();
    if (existingUsers.length < 5) {
      await generateDemoUsers();
      console.log('데모용 가상 사용자 30명이 생성되었습니다.');
    }
  } catch (error) {
    console.error('데모 사용자 생성 중 오류:', error);
  }
}

// 에너지공단 API 연동 함수
async function fetchEnergyPrograms() {
  try {
    // 실제 에너지공단 OPEN API URL로 교체 필요
    // 예시: https://openapi.kemco.or.kr/openapi/service/rest/...
    const API_URL = process.env.ENERGY_API_URL || 'https://openapi.kemco.or.kr/openapi/service/rest/energyProgram/getEnergyProgramList';
    const API_KEY = process.env.ENERGY_API_KEY || 'YOUR_API_KEY_HERE';

    const response = await axios.get(API_URL, {
      params: {
        serviceKey: API_KEY,
        numOfRows: 100,
        pageNo: 1
      },
      timeout: 5000
    });

    // API 응답 파싱 (XML 또는 JSON 형식에 따라)
    return parseAPIResponse(response.data);
  } catch (error) {
    console.error('에너지공단 API 연동 실패:', error.message);
    // API 실패 시 더미 데이터 반환 (데모용)
    return getDummyPrograms();
  }
}

// API 응답 파싱 함수
function parseAPIResponse(data) {
  // 실제 API 응답 형식에 맞게 수정 필요
  if (typeof data === 'string') {
    // XML 응답 처리 (필요시 xml2js 라이브러리 사용)
    return getDummyPrograms();
  }
  return data.body?.items || data.items || getDummyPrograms();
}

// 데모용 더미 데이터 (실제 API 실패 시 사용)
function getDummyPrograms() {
  return [
    {
      id: 'prog001',
      title: '주택용 태양광 보급사업',
      description: '주택에 태양광 패널 설치 시 설치비용의 50% 지원',
      target: '주택',
      region: '전국',
      supportAmount: '설치비용의 50%',
      isActive: true,
      applyUrl: 'https://www.kemco.or.kr/apply/solar',
      deadline: '2024-12-31'
    },
    {
      id: 'prog002',
      title: '에너지 효율등급 향상 지원',
      description: '에너지 효율등급 개선 시 최대 200만원 지원',
      target: '주택/아파트',
      region: '전국',
      supportAmount: '최대 200만원',
      isActive: true,
      applyUrl: 'https://www.kemco.or.kr/apply/efficiency',
      deadline: '2024-12-31'
    },
    {
      id: 'prog003',
      title: '고효율 가전제품 교체 지원',
      description: '에너지 효율 1등급 가전제품 구매 시 지원금 지급',
      target: '전체',
      region: '전국',
      supportAmount: '제품당 최대 30만원',
      isActive: true,
      applyUrl: 'https://www.kemco.or.kr/apply/appliance',
      deadline: '2024-11-30'
    },
    {
      id: 'prog004',
      title: '단열보강 지원사업',
      description: '벽체 및 창호 단열보강 시 공사비 지원',
      target: '주택/아파트',
      region: '전국',
      supportAmount: '공사비의 30%',
      isActive: true,
      applyUrl: 'https://www.kemco.or.kr/apply/insulation',
      deadline: '2024-12-31'
    },
    {
      id: 'prog005',
      title: 'LED 조명 교체 지원',
      description: '기존 형광등을 LED로 교체 시 설치비 지원',
      target: '전체',
      region: '전국',
      supportAmount: '설치비 전액',
      isActive: true,
      applyUrl: 'https://www.kemco.or.kr/apply/led',
      deadline: '2024-12-31'
    },
    {
      id: 'prog006',
      title: '서울시 태양광 미니발전소 설치 지원',
      description: '서울시 거주 주민 대상 태양광 미니발전소 설치비 지원',
      target: '주택/아파트',
      region: '서울',
      supportAmount: '설치비용의 60% (최대 300만원)',
      isActive: true,
      applyUrl: 'https://www.seoul.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog007',
      title: '경기도 스마트홈 에너지관리 시스템 구축',
      description: '스마트 미터 및 에너지 관리 시스템 설치 지원',
      target: '주택',
      region: '경기',
      supportAmount: '설치비용의 40%',
      isActive: true,
      applyUrl: 'https://www.gg.go.kr/energy',
      deadline: '2024-12-15'
    },
    {
      id: 'prog008',
      title: '부산시 에너지 절감 설비 교체 지원',
      description: '노후 에너지 설비를 고효율 설비로 교체 시 지원',
      target: '주택/상업시설',
      region: '부산',
      supportAmount: '교체비용의 50% (최대 500만원)',
      isActive: true,
      applyUrl: 'https://www.busan.go.kr/energy',
      deadline: '2024-12-20'
    },
    {
      id: 'prog009',
      title: '인천시 건물 에너지 진단 및 개선',
      description: '건물 에너지 진단 후 개선사업 추진 시 지원',
      target: '아파트/상업건물',
      region: '인천',
      supportAmount: '개선비용의 30%',
      isActive: true,
      applyUrl: 'https://www.incheon.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog010',
      title: '대전시 신재생에너지 보급 확대',
      description: '태양광, 풍력 등 신재생에너지 설비 설치 지원',
      target: '전체',
      region: '대전',
      supportAmount: '설치비용의 55%',
      isActive: true,
      applyUrl: 'https://www.daejeon.go.kr/energy',
      deadline: '2024-12-25'
    },
    {
      id: 'prog011',
      title: '대구시 창호 교체 지원사업',
      description: '단열성능 향상을 위한 창호 교체 시 지원',
      target: '주택/아파트',
      region: '대구',
      supportAmount: '교체비용의 40% (최대 200만원)',
      isActive: true,
      applyUrl: 'https://www.daegu.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog012',
      title: '광주시 에너지 자립마을 조성',
      description: '마을단위 에너지 자립 시설 구축 지원',
      target: '주택단지',
      region: '광주',
      supportAmount: '시설비용의 50%',
      isActive: true,
      applyUrl: 'https://www.gwangju.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog013',
      title: '울산시 산업단지 에너지 효율화',
      description: '산업시설 에너지 효율 개선 사업 지원',
      target: '산업시설',
      region: '울산',
      supportAmount: '개선비용의 35%',
      isActive: true,
      applyUrl: 'https://www.ulsan.go.kr/energy',
      deadline: '2024-12-20'
    },
    {
      id: 'prog014',
      title: '경남 도민 에너지 절약 실천 지원',
      description: '가정용 에너지 절약 기기 구매 지원',
      target: '전체',
      region: '경남',
      supportAmount: '구매비용의 30% (최대 50만원)',
      isActive: true,
      applyUrl: 'https://www.gyeongnam.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog015',
      title: '경북 친환경 에너지 보급',
      description: '태양광, 지열 등 친환경 에너지 설비 설치 지원',
      target: '주택/농가',
      region: '경북',
      supportAmount: '설치비용의 45%',
      isActive: true,
      applyUrl: 'https://www.gb.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog016',
      title: '전북 농어촌 태양광 확대',
      description: '농어촌 지역 태양광 발전소 설치 지원',
      target: '농가/어촌',
      region: '전북',
      supportAmount: '설치비용의 60%',
      isActive: true,
      applyUrl: 'https://www.jeonbuk.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog017',
      title: '전남 에너지 자립도시 구축',
      description: '도시 단위 신재생에너지 보급 확대 지원',
      target: '전체',
      region: '전남',
      supportAmount: '보급비용의 40%',
      isActive: true,
      applyUrl: 'https://www.jeonnam.go.kr/energy',
      deadline: '2024-12-25'
    },
    {
      id: 'prog018',
      title: '충북 주택 에너지 성능 개선',
      description: '주택의 에너지 성능 개선 공사 지원',
      target: '주택',
      region: '충북',
      supportAmount: '공사비의 35% (최대 300만원)',
      isActive: true,
      applyUrl: 'https://www.cb21.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog019',
      title: '충남 스마트 그리드 구축 지원',
      description: '스마트 그리드 인프라 구축 사업 지원',
      target: '단지/지역',
      region: '충남',
      supportAmount: '구축비용의 50%',
      isActive: true,
      applyUrl: 'https://www.chungnam.go.kr/energy',
      deadline: '2024-12-20'
    },
    {
      id: 'prog020',
      title: '강원도 산간지역 에너지 보급',
      description: '산간지역 신재생에너지 설비 설치 지원',
      target: '주택/농가',
      region: '강원',
      supportAmount: '설치비용의 55%',
      isActive: true,
      applyUrl: 'https://www.gangwon.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog021',
      title: '제주도 탄소중립 에너지 전환',
      description: '제주도 탄소중립 실현을 위한 에너지 전환 지원',
      target: '전체',
      region: '제주',
      supportAmount: '전환비용의 60%',
      isActive: true,
      applyUrl: 'https://www.jeju.go.kr/energy',
      deadline: '2024-12-31'
    },
    {
      id: 'prog022',
      title: '세종시 스마트시티 에너지관리',
      description: '스마트시티 에너지 관리 시스템 구축 지원',
      target: '주택/상업시설',
      region: '세종',
      supportAmount: '구축비용의 45%',
      isActive: true,
      applyUrl: 'https://www.sejong.go.kr/energy',
      deadline: '2024-12-31'
    }
  ];
}

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

// 프로그램 캐시 읽기
async function readProgramsCache() {
  try {
    const data = await fs.readFile(PROGRAMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 프로그램 캐시 쓰기
async function writeProgramsCache(programs) {
  await fs.writeFile(PROGRAMS_FILE, JSON.stringify(programs, null, 2));
}

// ============ 한전 데이터 기반 예측 시스템 ============

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

// 현재 계절 계산
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return "겨울";
  if (month >= 6 && month <= 8) return "여름";
  return "봄/가을";
}

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

// 챌린지 데이터 읽기
async function readChallenges() {
  try {
    const data = await fs.readFile(CHALLENGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { activeChallenges: [], completedChallenges: [], badges: [] };
  }
}

// 챌린지 데이터 쓰기
async function writeChallenges(challenges) {
  await fs.writeFile(CHALLENGES_FILE, JSON.stringify(challenges, null, 2));
}

// ============ API 라우트 ============

// 루트 경로 (Railway 헬스 체크용)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '에너지 절약 플랫폼 API 서버',
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 회원가입
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    const users = await readUsers();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: '이미 등록된 이메일입니다.' });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // 실제로는 해시화 필요
      name,
      phone,
      createdAt: new Date().toISOString(),
      badges: ['badge000'], // 회원가입 시 기본 뱃지 부여
      points: 0
    };

    users.push(newUser);
    await writeUsers(users);

    res.json({ success: true, message: '회원가입 성공', user: { id: newUser.id, email, name } });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  try {
    console.log('=== 로그인 요청 수신 ===');
    console.log('Body:', JSON.stringify(req.body));
    console.log('Origin:', req.headers.origin);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ 이메일 또는 비밀번호 누락');
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }
    
    console.log('사용자 목록 읽기 시도...');
    const users = await readUsers();
    console.log(`사용자 ${users.length}명 발견`);
    
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      console.log('❌ 사용자 인증 실패:', email);
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    console.log('✅ 로그인 성공:', user.id, user.email);
    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      message: '로그인 성공'
    });
  } catch (error) {
    console.error('❌ 로그인 API 오류:', error);
    console.error('스택 트레이스:', error.stack);
    res.status(500).json({ success: false, message: '서버 오류', error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
});

// 에너지공단 지원사업 조회
app.get('/api/programs', async (req, res) => {
  try {
    // 캐시 확인 (5분 이내 데이터면 재사용)
    let programs = await readProgramsCache();
    const cacheTime = await fs.stat(PROGRAMS_FILE).then(stats => stats.mtime.getTime()).catch(() => 0);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (programs.length === 0 || (now - cacheTime > fiveMinutes)) {
      // API에서 새로 가져오기
      programs = await fetchEnergyPrograms();
      await writeProgramsCache(programs);
    }

    // 필터링 (query params)
    const { houseType, minSupport, region } = req.query;
    let filtered = programs.filter(p => p.isActive);

    if (houseType) {
      filtered = filtered.filter(p => 
        p.target.includes(houseType) || p.target === '전체'
      );
    }

    if (region) {
      filtered = filtered.filter(p => 
        p.region === region || p.region === '전국'
      );
    }

    res.json({ 
      success: true, 
      programs: filtered,
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '프로그램 조회 실패' });
  }
});

// 에너지 분석 (누진세 계산)
app.post('/api/analyze', async (req, res) => {
  try {
    const { houseType, area, monthlyUsage } = req.body;

    // 누진세 계산 로직
    const tierRates = [
      { min: 0, max: 200, rate: 93.3 },
      { min: 201, max: 400, rate: 187.9 },
      { min: 401, max: Infinity, rate: 280.6 }
    ];

    let totalBill = 0;
    let remainingUsage = monthlyUsage;

    for (const tier of tierRates) {
      if (remainingUsage <= 0) break;
      
      const tierUsage = Math.min(remainingUsage, tier.max - tier.min);
      totalBill += tierUsage * tier.rate;
      remainingUsage -= tierUsage;
    }

    // 기본 요금 추가
    const baseRate = 1600;
    totalBill += baseRate;

    // 추천 프로그램 찾기
    const programs = await readProgramsCache();
    const recommended = programs
      .filter(p => p.isActive && (p.target.includes(houseType) || p.target === '전체'))
      .slice(0, 3);

    // 사용자 정보에 티어 저장 (향후 환산에 사용)
    const tier = monthlyUsage <= 200 ? 1 : monthlyUsage <= 400 ? 2 : 3;
    
    // 사용자 정보 업데이트 (티어 저장 및 분석 기록 저장)
    if (req.body.userId) {
      const users = await readUsers();
      const user = users.find(u => u.id === req.body.userId);
      if (user) {
        user.energyTier = tier;
        if (req.body.houseType) user.housingType = req.body.houseType;
        if (req.body.area) user.area = req.body.area;
        
        // 분석 기록 저장
        if (!user.analysisHistory) user.analysisHistory = [];
        user.analysisHistory.unshift({
          date: new Date().toISOString(),
          houseType: houseType,
          area: area,
          monthlyUsage: monthlyUsage,
          monthlyBill: Math.round(totalBill),
          tier: tier,
          estimatedSavings: Math.round(totalBill * 0.2)
        });
        
        // 최근 10개만 유지
        if (user.analysisHistory.length > 10) {
          user.analysisHistory = user.analysisHistory.slice(0, 10);
        }
        
        // 분석 횟수 업데이트
        user.analysisCount = user.analysisHistory.length;
        
        // 배지 체크 (분석 마스터 등)
        const challengesData = await readChallenges();
        checkAndAwardBadges(user, challengesData.badges);
        
        await writeUsers(users);
      }
    }

    res.json({
      success: true,
      analysis: {
        monthlyBill: Math.round(totalBill),
        tier: tier,
        estimatedSavings: Math.round(totalBill * 0.2), // 추정 절감액
        recommendedPrograms: recommended
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '분석 실패' });
  }
});

// 프로그램 새로고침 (API 강제 호출)
app.post('/api/programs/refresh', async (req, res) => {
  try {
    const programs = await fetchEnergyPrograms();
    await writeProgramsCache(programs);
    res.json({ success: true, programs, total: programs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: '새로고침 실패' });
  }
});

// ============ 챌린지 API ============

// 챌린지 생성
app.post('/api/challenge/create', async (req, res) => {
  try {
    const { userId, type, targetKwh, targetAmount, startDate, userProfile } = req.body;

    if (!userId || !type || (!targetKwh && !targetAmount)) {
      return res.status(400).json({ success: false, message: '필수 정보를 입력해주세요.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 업데이트 (챌린지 생성 시 함께 저장)
    if (userProfile) {
      user.region = userProfile.region || user.region;
      user.housingType = userProfile.housingType || user.housingType;
      user.area = userProfile.area || user.area;
      user.householdSize = userProfile.householdSize || user.householdSize;
    }

    // 기간 계산
    const days = type === 'weekly' ? 7 : 30;
    const endDate = new Date(startDate || new Date());
    endDate.setDate(endDate.getDate() + days);

    const challenge = {
      id: `challenge_${Date.now()}`,
      userId,
      type,
      targetKwh: targetKwh || 0,
      targetAmount: targetAmount || 0,
      savedKwh: 0,
      savedAmount: 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      achievementRate: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // 사용자 정보 업데이트
    if (!user.currentChallenge) {
      user.currentChallenge = challenge;
      user.totalSaved = user.totalSaved || 0;
      user.points = user.points || 0;
      user.badges = user.badges || [];
      
      // 회원가입 뱃지 (badge000) 체크 - 없으면 추가
      if (!user.badges.includes('badge000')) {
        user.badges.push('badge000');
      }
      
      // 첫 절약 배지 체크
      if (!user.badges.includes('badge001')) {
        user.badges.push('badge001');
        user.points += 50; // 첫 절약 보너스
      }
    }

    await writeUsers(users);

    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ success: false, message: '챌린지 생성 실패' });
  }
});

// 절약량 업데이트
app.post('/api/challenge/update', async (req, res) => {
  try {
    const { userId, savedKwh, savedAmount } = req.body;

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.currentChallenge) {
      return res.status(404).json({ success: false, message: '진행 중인 챌린지가 없습니다.' });
    }

    const challenge = user.currentChallenge;
    challenge.savedKwh = savedKwh || challenge.savedKwh;
    challenge.savedAmount = savedAmount || challenge.savedAmount;
    
    const target = challenge.targetKwh || challenge.targetAmount;
    const saved = challenge.savedKwh || challenge.savedAmount;
    challenge.achievementRate = Math.round((saved / target) * 100);

    // 총 절약량 업데이트
    user.totalSaved = (user.totalSaved || 0) + (savedKwh || 0);
    
    // 포인트 계산 (1kWh당 10포인트)
    const newPoints = (savedKwh || 0) * 10;
    user.points = (user.points || 0) + newPoints;

    // 목표 달성 시 보너스 및 완료 처리
    if (challenge.achievementRate >= 100 && challenge.status === 'active') {
      user.points += 500;
      challenge.status = 'completed';
      
      // 완료된 챌린지를 completedChallenges에 추가
      if (!user.completedChallenges) user.completedChallenges = [];
      user.completedChallenges.push({
        id: challenge.id,
        type: challenge.type,
        targetKwh: challenge.targetKwh,
        savedKwh: challenge.savedKwh,
        achievementRate: challenge.achievementRate,
        completedAt: new Date().toISOString()
      });
      
      // 현재 챌린지 초기화
      user.currentChallenge = null;
    }

    // 배지 체크
    const challengesData = await readChallenges();
    checkAndAwardBadges(user, challengesData.badges);

    await writeUsers(users);

    res.json({ success: true, challenge, user: { points: user.points, badges: user.badges } });
  } catch (error) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
});

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

// 사용자 챌린지 조회
app.get('/api/challenge/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 정보
    const userProfile = {
      region: user.region || '서울',
      housingType: user.housingType || '아파트',
      area: user.area || 30,
      householdSize: user.householdSize || 4
    };

    // 설문 답변
    const surveyAnswers = user.surveyAnswers || {};

    // 에너지 예측
    const prediction = calculateEnergyPrediction(userProfile, surveyAnswers);

    // 주간별 진행률 계산
    let weeklyProgress = null;
    if (user.currentChallenge) {
      weeklyProgress = calculateWeeklyProjection(user.currentChallenge, userProfile, surveyAnswers);
    }

    // 기존 사용자도 badge000 (시작의 발걸음)이 없으면 부여
    if (!user.badges) {
      user.badges = [];
    }
    if (!user.badges.includes('badge000')) {
      user.badges.push('badge000');
      await writeUsers(users); // 저장
    }

    res.json({
      success: true,
      challenge: user.currentChallenge || null,
      totalSaved: user.totalSaved || 0,
      points: user.points || 0,
      badges: user.badges || ['badge000'],
      energyTier: user.energyTier || 2,
      weeklyProgress: weeklyProgress,
      prediction: prediction,
      userProfile: userProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 랭킹 조회
app.get('/api/ranking', async (req, res) => {
  try {
    const { type, region, housingType, period, userId } = req.query;
    const users = await readUsers();
    
    // 랭킹 방문 추적 (userId가 있을 때만)
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.rankingVisits = (user.rankingVisits || 0) + 1;
        // 배지 체크 (커뮤니티 참여자 등)
        const challengesData = await readChallenges();
        checkAndAwardBadges(user, challengesData.badges);
        await writeUsers(users);
      }
    }

    let filtered = users.filter(u => u.currentChallenge && u.currentChallenge.status === 'active');

    // 지역 필터
    if (region && region !== '전체') {
      filtered = filtered.filter(u => {
        const userRegion = u.region || '';
        return userRegion.includes(region) || userRegion === '전국';
      });
    }

    // 주택 유형 필터
    if (housingType && housingType !== '전체') {
      filtered = filtered.filter(u => {
        const userHousing = u.housingType || '';
        return userHousing.includes(housingType);
      });
    }

    // 정렬 및 랭킹 계산
    filtered = filtered.map((u, index) => ({
      ...u,
      rank: index + 1,
      savedKwh: u.currentChallenge?.savedKwh || 0,
      achievementRate: u.currentChallenge?.achievementRate || 0
    })).sort((a, b) => {
      // 절약량 우선
      if (b.savedKwh !== a.savedKwh) {
        return b.savedKwh - a.savedKwh;
      }
      // 동점시 달성률
      return b.achievementRate - a.achievementRate;
    });

    // 랭킹 재계산
    filtered = filtered.map((u, index) => ({
      ...u,
      rank: index + 1
    }));

    res.json({
      success: true,
      rankings: filtered.slice(0, 100), // 상위 100명
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '랭킹 조회 실패' });
  }
});

// 배지 목록 조회
app.get('/api/badges', async (req, res) => {
  try {
    const challengesData = await readChallenges();
    res.json({ success: true, badges: challengesData.badges || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '배지 조회 실패' });
  }
});

// 사용자 설문 저장
app.post('/api/user/survey', async (req, res) => {
  try {
    const { userId, surveyAnswers, userProfile } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 업데이트
    if (userProfile) {
      user.region = userProfile.region || user.region;
      user.housingType = userProfile.housingType || user.housingType;
      user.area = userProfile.area || user.area;
      user.householdSize = userProfile.householdSize || user.householdSize;
    }

    // 설문 답변 저장
    if (surveyAnswers) {
      user.surveyAnswers = surveyAnswers;
    }

    await writeUsers(users);

    // 예측 결과 계산
    const profile = {
      region: user.region || '서울',
      housingType: user.housingType || '아파트',
      area: user.area || 30,
      householdSize: user.householdSize || 4
    };
    const prediction = calculateEnergyPrediction(profile, surveyAnswers || {});

    // 배지 체크 (맞춤형 설문 완료 등)
    const challengesData = await readChallenges();
    checkAndAwardBadges(user, challengesData.badges);
    
    await writeUsers(users);

    res.json({
      success: true,
      message: '설문이 저장되었습니다.',
      prediction: prediction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '설문 저장 실패' });
  }
});

// 지원사업 조회 기록 저장
app.post('/api/programs/view', async (req, res) => {
  try {
    const { userId, programId } = req.body;

    if (!userId || !programId) {
      return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 프로그램 정보 조회
    const programs = await readProgramsCache();
    const program = programs.find(p => p.id === programId);

    if (program) {
      // 조회 기록 저장
      if (!user.viewedPrograms) user.viewedPrograms = [];
      
      // 중복 체크 (같은 프로그램이 이미 있으면 제거)
      user.viewedPrograms = user.viewedPrograms.filter(p => p.id !== programId);
      
      // 최신순으로 앞에 추가
      user.viewedPrograms.unshift({
        id: program.id,
        title: program.title,
        description: program.description,
        region: program.region,
        target: program.target,
        supportAmount: program.supportAmount,
        applyUrl: program.applyUrl,
        viewedAt: new Date().toISOString()
      });

      // 최근 20개만 유지
      if (user.viewedPrograms.length > 20) {
        user.viewedPrograms = user.viewedPrograms.slice(0, 20);
      }
      
      // 배지 체크 (지원사업 탐험가 등)
      const challengesData = await readChallenges();
      checkAndAwardBadges(user, challengesData.badges);
      
      await writeUsers(users);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 기록 저장 실패' });
  }
});

// 사용자 정보 조회 (마이페이지용)
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // badge000 (시작의 발걸음)이 없으면 부여
    if (!user.badges) {
      user.badges = [];
    }
    if (!user.badges.includes('badge000')) {
      user.badges.push('badge000');
      await writeUsers(users); // 저장
    }

    // 비밀번호 제외한 사용자 정보 반환
    const { password, ...userInfo } = user;
    
    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '사용자 정보 조회 실패' });
  }
});

// 검증된 절약 시나리오 조회
app.get('/api/saving-scenarios', async (req, res) => {
  try {
    res.json({
      success: true,
      scenarios: verifiedSavingScenarios
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 데모 사용자 초기화 (수동 생성용)
app.post('/api/demo/users/generate', async (req, res) => {
  try {
    const users = await readUsers();
    // 기존 사용자 중 데모 사용자가 아닌 것만 필터링
    const realUsers = users.filter(u => !u.id.startsWith('demo_user_'));
    
    // 기존 데모 사용자 제거
    await writeUsers(realUsers);
    
    // 새 데모 사용자 생성
    await generateDemoUsers();
    
    res.json({ 
      success: true, 
      message: '데모 사용자 30명이 생성되었습니다.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '데모 사용자 생성 실패' });
  }
});

// 통계 데이터
app.get('/api/challenge/stats', async (req, res) => {
  try {
    const users = await readUsers();
    const activeUsers = users.filter(u => u.currentChallenge && u.currentChallenge.status === 'active');
    
    const totalSaved = activeUsers.reduce((sum, u) => sum + (u.currentChallenge?.savedKwh || 0), 0);
    const avgSaved = activeUsers.length > 0 ? Math.round(totalSaved / activeUsers.length) : 0;
    const topSaver = activeUsers.length > 0 
      ? activeUsers.reduce((top, u) => {
          const saved = u.currentChallenge?.savedKwh || 0;
          return saved > (top.savedKwh || 0) ? { name: u.name, savedKwh: saved } : top;
        }, { name: '', savedKwh: 0 })
      : { name: '없음', savedKwh: 0 };

    res.json({
      success: true,
      stats: {
        totalParticipants: activeUsers.length,
        totalSaved,
        averageSaved: avgSaved,
        topSaver
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '통계 조회 실패' });
  }
});

// 서버 시작
async function startServer() {
  try {
    console.log('=== 서버 초기화 시작 ===');
    console.log('PORT:', process.env.PORT || '설정되지 않음 (기본값 3000)');
    
    // 데이터 초기화 (실패해도 서버는 시작)
    try {
      await initializeData();
      console.log('✅ 데이터 초기화 완료');
    } catch (initError) {
      console.error('⚠️ 데이터 초기화 실패 (서버는 계속 시작됨):', initError.message);
    }
    
    // 서버 시작
    app.listen(PORT, '0.0.0.0', () => {
      console.log('=== 서버 시작 완료 ===');
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`바인딩 주소: 0.0.0.0:${PORT}`);
      console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`프론트엔드 URL: ${process.env.FRONTEND_URL || '설정되지 않음'}`);
      console.log('에너지공단 API 연동 준비 완료');
      console.log(`헬스 체크: http://0.0.0.0:${PORT}/health`);
    });
    
    // 에러 처리
    app.on('error', (error) => {
      console.error('❌ 서버 에러:', error);
      process.exit(1);
    });
    
    process.on('SIGTERM', () => {
      console.log('SIGTERM 신호 수신, 서버 종료 중...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT 신호 수신, 서버 종료 중...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    console.error('스택 트레이스:', error.stack);
    process.exit(1);
  }
}

startServer();

