// 공통 JavaScript 함수

// API Base URL 설정 (환경 변수 또는 기본값)
const API_BASE_URL = window.API_BASE_URL || '';

// API URL 생성 헬퍼 함수
function getApiUrl(path) {
    if (path.startsWith('http')) {
        return path;
    }
    // path가 /로 시작하면 그대로 사용
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
}

// API 호출 헬퍼 함수
async function apiCall(url, options = {}) {
    try {
        const fullUrl = getApiUrl(url);
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

// 로그아웃 함수
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('analysisResult');
        window.location.href = 'index.html';
    }
}

// 로그인 확인 함수
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}


// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 숫자 포맷팅 (천 단위 콤마)
function formatNumber(num) {
    return num?.toLocaleString() || '0';
}

