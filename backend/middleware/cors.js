// backend/middleware/cors.js
/**
 * CORS 미들웨어
 * 기존 server.js의 CORS 로직을 그대로 옮김 (동작 변경 없음)
 */

// 허용된 Origin 목록 (기존 코드와 동일)
const allowedOrigins = [
    'https://ecosync2025.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// FRONTEND_URL 환경 변수 처리 (기존 로직 그대로)
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

// 초기화 로그 (기존과 동일)
console.log('=== CORS 설정 초기화 ===');
console.log('허용된 CORS 도메인:', allowedOrigins);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '설정되지 않음');

// CORS 헤더를 모든 응답에 추가하는 미들웨어 (기존 함수 그대로)
function setCorsHeaders(req, res, next) {
    const origin = req.headers.origin;
    
    // 허용된 origin인지 확인 (기존 로직 그대로)
    const isNetlifyOrigin = origin && origin.includes('netlify.app');
    const isExactMatch = origin && allowedOrigins.includes(origin);
    const isAllowed = !origin || isExactMatch || isNetlifyOrigin || process.env.NODE_ENV !== 'production';
    
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
    // OPTIONS 요청을 가장 먼저 처리 (preflight 요청) - 기존 코드 그대로
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            try {
                const origin = req.headers.origin;
                console.log('=== OPTIONS 요청 처리 시작 ===');
                console.log('Origin:', origin);
                console.log('Path:', req.path);
                console.log('허용된 도메인 목록:', allowedOrigins);
                
                // origin이 netlify.app으로 끝나는지 확인 (유연한 매칭) - 기존 로직 그대로
                const isNetlifyOrigin = origin && origin.includes('netlify.app');
                const isExactMatch = origin && allowedOrigins.includes(origin);
                const isAllowed = !origin || isExactMatch || isNetlifyOrigin || process.env.NODE_ENV !== 'production';
                
                console.log('isNetlifyOrigin:', isNetlifyOrigin);
                console.log('isExactMatch:', isExactMatch);
                console.log('isAllowed:', isAllowed);
                
                if (isAllowed) {
                    const allowOrigin = origin || '*';
                    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Max-Age', '86400');
                    console.log('✅ OPTIONS 요청 허용됨, Origin:', allowOrigin);
                    return res.status(200).end();
                }
                
                // 허용되지 않은 origin
                console.log('❌ OPTIONS 요청 차단:', origin);
                res.status(403).end();
                return;
            } catch (error) {
                console.error('❌ OPTIONS 처리 중 오류:', error);
                console.error('스택:', error.stack);
                res.status(500).end();
                return;
            }
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
};

