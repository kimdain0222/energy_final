// 환경 변수 로드 (선택사항)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv가 설치되지 않은 경우 무시
}

const express = require('express');
const bodyParser = require('body-parser');
const { initializeData } = require('./utils/dataInit');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
// CORS 미들웨어를 가장 먼저 등록 (요청 로깅보다 먼저)
require('./middleware/cors')(app);

// 요청 로깅 미들웨어 (CORS 다음에 실행 - 모든 요청 기록)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log('='.repeat(50));
    console.log(`[${timestamp}] 요청 도달!`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log(`URL: ${req.url}`);
    console.log(`Origin: ${req.headers.origin || '없음'}`);
    console.log(`IP: ${req.ip || req.connection.remoteAddress || '없음'}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    console.log('='.repeat(50));
    next();
});

// Body Parser - 모든 요청에 대해 JSON 파싱
app.use(bodyParser.json());
app.use(express.static('frontend'));

// ============ API 라우트 ============

// 루트 경로
app.get('/', (req, res) => {
  console.log('✅ 루트 경로(/) 요청 수신');
  console.log('요청 헤더:', JSON.stringify(req.headers, null, 2));
  res.json({
    status: 'ok',
    message: '에너지 절약 플랫폼 API 서버',
    timestamp: new Date().toISOString(),
    server: 'running',
    cors: 'configured'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  console.log('✅ 헬스 체크(/health) 요청 수신');
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    server: 'listening'
  });
});

// API 라우트 등록
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');

app.use('/api', authRoutes);
app.use('/api/programs', require('./routes/programs'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/challenge', challengeRoutes);
app.use('/api/badges', challengeRoutes); // /badges 라우트도 같은 라우터 사용
app.use('/api/user', require('./routes/users'));
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api', require('./routes/misc'));

// 서버 시작
console.log('='.repeat(50));
console.log('=== 서버 시작 ===');
console.log('PORT:', PORT);
console.log('='.repeat(50));

const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  console.log('='.repeat(50));
  console.log('✅ 서버 리스닝 성공!');
  console.log(`포트: ${PORT}`);
  console.log(`호스트: ${HOST}`);
  console.log(`서버 주소: ${address ? `${address.address}:${address.port}` : '없음'}`);
  console.log('='.repeat(50));
  
  // 서버가 시작된 후 데이터 초기화 (비동기, 에러가 나도 서버는 계속 실행)
  setTimeout(() => {
    initializeData()
      .then(() => {
        console.log('✅ 데이터 초기화 완료');
      })
      .catch((initError) => {
        console.error('⚠️ 데이터 초기화 실패 (서버는 계속 실행):', initError.message);
        if (initError.stack) {
          console.error('스택:', initError.stack);
        }
      });
  }, 1000); // 1초 후 초기화 시작
});

// 서버가 실제로 리스닝하는지 확인
server.on('listening', () => {
  const address = server.address();
  console.log('='.repeat(50));
  console.log('✅ 서버 리스닝 이벤트 발생!');
  console.log(`실제 바인딩 주소: ${address ? `${address.address}:${address.port}` : '없음'}`);
  console.log(`서버 리스닝 상태: ${server.listening ? '✅ 리스닝 중' : '❌ 리스닝 안 함'}`);
  console.log('='.repeat(50));
});

// 서버 에러 처리
server.on('error', (error) => {
  console.error('❌ 서버 에러:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`포트 ${PORT}가 이미 사용 중입니다.`);
  }
  process.exit(1);
});

// 프로세스 시그널 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

// 처리되지 않은 예외 처리 (로그만 남기고 서버는 계속 실행)
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error.message);
  if (error.stack) {
    console.error('스택 트레이스:', error.stack);
  }
  // 치명적이지 않은 에러는 서버를 계속 실행
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  // 서버는 계속 실행
});
