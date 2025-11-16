// backend/middleware/cors.js
/**
 * CORS 미들웨어
 * 기존 server.js의 CORS 로직을 그대로 옮김 (동작 변경 없음)
 */

// 허용된 Origin 목록
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// 초기화 로그
console.log('=== CORS 설정 초기화 ===');
console.log('허용된 CORS 도메인:', allowedOrigins);

// CORS 헤더를 모든 응답에 추가하는 미들웨어
function setCorsHeaders(req, res, next) {
    const origin = req.headers.origin;
    const isAllowed = !origin || allowedOrigins.includes(origin);
    
    if (isAllowed) {
        const allowOrigin = origin || '*';
        res.setHeader('Access-Control-Allow-Origin', allowOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }
    
    next();
}

/**
 * CORS 미들웨어 설정
 * @param {Express} app - Express 앱 인스턴스
 */
module.exports = (app) => {
    console.log('✅ CORS 미들웨어 등록 완료');
    
    // OPTIONS 요청 처리 함수
    const handleOptions = (req, res) => {
        console.log('='.repeat(50));
        console.log('🔍 OPTIONS 요청 감지됨!');
        console.log('Path:', req.path);
        console.log('URL:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        try {
            const origin = req.headers.origin;
            console.log('=== OPTIONS 요청 처리 시작 ===');
            console.log('Origin:', origin);
            console.log('허용된 도메인 목록:', allowedOrigins);
            
            // 허용된 origin인지 확인
            const isAllowed = !origin || allowedOrigins.includes(origin);
            
            console.log('isAllowed:', isAllowed);
            
            if (isAllowed) {
                const allowOrigin = origin || '*';
                
                // CORS 헤더 설정
                res.setHeader('Access-Control-Allow-Origin', allowOrigin);
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Access-Control-Max-Age', '86400');
                
                console.log('✅ OPTIONS 요청 허용됨, Origin:', allowOrigin);
                console.log('✅ CORS 헤더 설정 완료');
                console.log('='.repeat(50));
                
                // 응답 전송
                return res.status(200).send('');
            }
            
            // 허용되지 않은 origin
            console.log('❌ OPTIONS 요청 차단:', origin);
            console.log('='.repeat(50));
            return res.status(403).send('CORS policy: Origin not allowed');
        } catch (error) {
            console.error('❌ OPTIONS 처리 중 오류:', error);
            console.error('스택:', error.stack);
            console.log('='.repeat(50));
            return res.status(500).send('Internal server error');
        }
    };
    
    // 모든 경로에 대해 OPTIONS 요청 처리 (app.options 사용)
    app.options('*', handleOptions);
    
    // app.use로도 처리 (이중 안전장치)
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            return handleOptions(req, res);
        }
        next();
    });
    
    // CORS 헤더 미들웨어 적용 (OPTIONS 제외 - 이미 처리됨) - 기존 코드 그대로
    app.use((req, res, next) => {
        if (req.method !== 'OPTIONS') {
            setCorsHeaders(req, res, next);
        } else {
            next();
        }
    });
    
    console.log('✅ CORS 미들웨어 설정 완료 - OPTIONS 및 일반 요청 처리 준비됨');
};

