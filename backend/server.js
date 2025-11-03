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
const PORT = 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

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
  } catch {
    return [];
  }
}

// 사용자 데이터 쓰기
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
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
      createdAt: new Date().toISOString()
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
    const { email, password } = req.body;
    
    const users = await readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      message: '로그인 성공'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
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

    res.json({
      success: true,
      analysis: {
        monthlyBill: Math.round(totalBill),
        tier: monthlyUsage <= 200 ? 1 : monthlyUsage <= 400 ? 2 : 3,
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
    const { userId, type, targetKwh, targetAmount, startDate } = req.body;

    if (!userId || !type || (!targetKwh && !targetAmount)) {
      return res.status(400).json({ success: false, message: '필수 정보를 입력해주세요.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
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

    // 목표 달성 시 보너스
    if (challenge.achievementRate >= 100 && challenge.status === 'active') {
      user.points += 500;
      challenge.status = 'completed';
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

  availableBadges.forEach(badge => {
    if (user.badges.includes(badge.id)) return;

    let shouldAward = false;

    switch (badge.id) {
      case 'badge002': // 100kWh 절약
        shouldAward = (user.totalSaved || 0) >= 100;
        break;
      case 'badge006': // 50kWh 절약
        shouldAward = (user.totalSaved || 0) >= 50;
        break;
      case 'badge007': // 목표 150% 초과
        shouldAward = user.currentChallenge?.achievementRate >= 150;
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

    res.json({
      success: true,
      challenge: user.currentChallenge || null,
      totalSaved: user.totalSaved || 0,
      points: user.points || 0,
      badges: user.badges || [],
      energyTier: user.energyTier || 2 // 기본값 2구간
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 랭킹 조회
app.get('/api/ranking', async (req, res) => {
  try {
    const { type, region, housingType, period } = req.query;
    const users = await readUsers();

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
  await initializeData();
  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('에너지공단 API 연동 준비 완료');
  });
}

startServer();

