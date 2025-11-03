// 공통 JavaScript 함수

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

// API 호출 헬퍼 함수
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
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

