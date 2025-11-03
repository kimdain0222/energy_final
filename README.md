# 에너지 절약 플랫폼

실제 에너지공단 지원사업과 연동하는 에너지 절약 플랫폼입니다.

## 🚀 빠른 시작

### 설치
```bash
npm install
```

### 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 📋 주요 기능

1. **실제 지원사업 연동**: 에너지공단 OPEN API를 통한 실시간 지원사업 조회
2. **에너지 분석**: 전기 사용량 기반 누진세 계산 및 절감액 추정
3. **맞춤형 추천**: 사용자 조건에 맞는 지원사업 자동 추천

## 🔌 API 연동 설정

### 에너지공단 OPEN API 연동

1. **API 키 발급**
   - 에너지공단 OPEN API 사이트에서 회원가입 및 API 키 발급
   - https://www.data.go.kr (공공데이터포털) 또는 에너지공단 직접 문의

2. **환경 변수 설정** (선택사항)
   - `.env` 파일 생성:
   ```
   ENERGY_API_URL=https://openapi.kemco.or.kr/openapi/service/rest/energyProgram/getEnergyProgramList
   ENERGY_API_KEY=your_api_key_here
   ```

3. **데모 모드**
   - API 키가 없어도 데모용 더미 데이터로 동작합니다
   - 실제 API 연동은 `backend/server.js`의 `fetchEnergyPrograms()` 함수에서 처리됩니다

### API 응답 형식 커스터마이징

실제 API 응답 형식에 맞게 `backend/server.js`의 `parseAPIResponse()` 함수를 수정하세요.

## 📱 주요 페이지

- `/` - 메인 랜딩페이지
- `/register.html` - 회원가입
- `/login.html` - 로그인
- `/dashboard.html` - 대시보드
- `/analyze.html` - 에너지 분석
- `/results.html` - 분석 결과
- `/programs.html` - 지원사업 전체 목록
- `/mypage.html` - 마이페이지

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Storage**: JSON 파일 기반
- **API**: 에너지공단 OPEN API

## 🎯 데모 시연 시나리오 (3분)

### 1분: 회원가입 & 로그인
- 간단한 4가지 정보만으로 1분 안에 가입 완료
- 이메일, 비밀번호, 이름, 휴대전화만 입력

### 1분: 에너지 분석
- 데모 샘플 선택으로 즉시 분석 (아파트/주택/오피스텔)
- 누진세 계산 결과 확인
- 추정 절감액 확인

### 1분: 실제 지원사업 연동
- 에너지공단에서 실시간으로 불러온 지원사업 목록 확인
- 사용자 조건에 맞는 3-5개 사업 추천
- 실제 신청페이지로 바로 연결

## 📊 프로젝트 구조

```
energy_final/
├── backend/
│   └── server.js          # Express 서버 및 API 연동
├── frontend/
│   ├── index.html         # 메인 랜딩페이지
│   ├── register.html      # 회원가입
│   ├── login.html         # 로그인
│   ├── dashboard.html     # 대시보드
│   ├── analyze.html       # 에너지 분석
│   ├── results.html       # 분석 결과
│   ├── programs.html      # 지원사업 목록
│   ├── mypage.html        # 마이페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   └── js/
│       └── common.js      # 공통 JavaScript
├── data/
│   ├── users.json         # 사용자 데이터 (자동 생성)
│   └── programs.json      # 프로그램 캐시 (자동 생성)
├── package.json
└── README.md
```

## ⚡ 핵심 기능 상세

### 에너지 분석 (누진세 계산)
- 주택 유형, 면적, 월 전기 사용량 입력
- 3단계 누진세 계산 (200kWh 이하: 93.3원/kWh, 201-400kWh: 187.9원/kWh, 401kWh 이상: 280.6원/kWh)
- 추정 절감액 자동 계산
- kWh → 금액 환산 (누진세 구간별)

### 지원사업 필터링
- 주택 유형별 필터링
- 지역별 필터링 (전국 17개 시도)
- 접수중인 사업만 표시
- 실시간 API 새로고침 지원

### 에너지 절약 챌린지 & 경쟁 시스템
- **챌린지 생성**: 주간/월간 절약 목표 설정
- **주간별 달성률 시각화**: 한전 통계 기반 주간별 진행률 표시
- **랭킹 시스템**: 지역별/주택유형별 랭킹 및 리더보드
- **배지 & 포인트**: 절약량 기반 포인트 적립 및 배지 획득
- **실시간 달성률**: Chart.js를 활용한 시각화

### 한전 데이터 기반 예측 시스템
- **지역별 평균 데이터**: 한국전력공사 2023년 통계 기반
- **에너지 사용 습관 설문**: 사용자 맞춤형 예측 정확도 향상
- **계절별 변동 고려**: 겨울/여름/봄·가을 계절 가중치 적용
- **투명한 신뢰도 표시**: 예측 기준, 출처, 한계 명시

