const fs = require('fs').promises;
const axios = require('axios');
const { PROGRAMS_FILE } = require('../config/paths');

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

module.exports = {
  readProgramsCache,
  writeProgramsCache,
  fetchEnergyPrograms,
  getDummyPrograms
};

