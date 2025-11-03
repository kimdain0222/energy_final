// API 설정 파일
// 이 파일은 배포 시 환경 변수로 자동 설정됩니다

// API Base URL - Netlify 환경 변수 또는 기본값
window.API_BASE_URL = window.API_BASE_URL || '';

// 환경 변수에서 가져오기 (Netlify Build-time)
// Netlify는 빌드 시 환경 변수를 JavaScript로 치환할 수 있습니다
// 예: const API_BASE_URL = '%API_BASE_URL%';

console.log('API Base URL:', window.API_BASE_URL || 'http://localhost:3000 (로컬 개발 모드)');

