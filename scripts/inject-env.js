// Netlify 빌드 시 환경 변수를 HTML 파일에 주입하는 스크립트
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const API_BASE_URL = process.env.API_BASE_URL || '';

console.log('🔧 환경 변수 주입 시작...');
console.log('API_BASE_URL:', API_BASE_URL || '(설정되지 않음)');

// HTML 파일 목록
const htmlFiles = [
  'index.html',
  'login.html',
  'register.html',
  'dashboard.html',
  'analyze.html',
  'results.html',
  'programs.html',
  'mypage.html',
  'ranking.html',
  'challenge.html',
  'challenge-list.html',
  'challenge-detail.html',
  'survey.html',
  'badges.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(FRONTEND_DIR, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 파일 없음: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // API_BASE_URL을 window.API_BASE_URL로 주입
  // 기존 설정이 있으면 교체, 없으면 추가
  if (content.includes('window.API_BASE_URL')) {
    // 다양한 패턴 처리: 
    // - window.API_BASE_URL = window.API_BASE_URL || '';
    // - window.API_BASE_URL = '';
    // - window.API_BASE_URL = '...';
    content = content.replace(
      /window\.API_BASE_URL\s*=\s*(window\.API_BASE_URL\s*\|\|\s*)?['"`]?[^'"`;]*['"`]?;?/g,
      `window.API_BASE_URL = '${API_BASE_URL}';`
    );
  } else {
    // </head> 태그 앞에 스크립트 추가
    if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `<script>window.API_BASE_URL = '${API_BASE_URL}';</script>\n</head>`
      );
    } else if (content.includes('<body>')) {
      content = content.replace(
        '<body>',
        `<script>window.API_BASE_URL = '${API_BASE_URL}';</script>\n<body>`
      );
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ ${file} 업데이트 완료`);
});

// config.js 파일도 업데이트
const configJsPath = path.join(FRONTEND_DIR, 'js', 'config.js');
if (fs.existsSync(configJsPath)) {
  let configContent = fs.readFileSync(configJsPath, 'utf8');
  configContent = configContent.replace(
    /window\.API_BASE_URL\s*=\s*(window\.API_BASE_URL\s*\|\|\s*)?['"`]?[^'"`;]*['"`]?;?/g,
    `window.API_BASE_URL = '${API_BASE_URL}';`
  );
  fs.writeFileSync(configJsPath, configContent, 'utf8');
  console.log('✅ config.js 업데이트 완료');
}

// common.js에도 기본값 추가 (안전장치)
const commonJsPath = path.join(FRONTEND_DIR, 'js', 'common.js');
if (fs.existsSync(commonJsPath)) {
  let commonContent = fs.readFileSync(commonJsPath, 'utf8');
  // API_BASE_URL 기본값을 Railway URL로 설정
  const railwayUrl = API_BASE_URL || 'https://web-production-c47e7.up.railway.app';
  commonContent = commonContent.replace(
    /const API_BASE_URL\s*=\s*window\.API_BASE_URL\s*\|\|\s*['"`]?[^'"`;]*['"`]?;?/g,
    `const API_BASE_URL = window.API_BASE_URL || '${railwayUrl}';`
  );
  fs.writeFileSync(commonJsPath, commonContent, 'utf8');
  console.log('✅ common.js 업데이트 완료');
}

console.log('✅ 환경 변수 주입 완료!');

