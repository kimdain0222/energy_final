// Netlify 빌드 시 환경 변수를 HTML 파일에 주입하는 스크립트
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || '';

// frontend 디렉토리의 모든 HTML 파일 찾기
const frontendDir = path.join(__dirname, '..', 'frontend');
const htmlFiles = fs.readdirSync(frontendDir).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
  const filePath = path.join(frontendDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // API_BASE_URL 스크립트 태그 찾기 및 업데이트
  const scriptPattern = /window\.API_BASE_URL\s*=\s*window\.API_BASE_URL\s*\|\|\s*['"]?['"]?/g;
  
  if (scriptPattern.test(content)) {
    content = content.replace(
      /window\.API_BASE_URL\s*=\s*window\.API_BASE_URL\s*\|\|\s*['"]?['"]?/g,
      `window.API_BASE_URL = window.API_BASE_URL || '${API_BASE_URL}'`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} with API_BASE_URL: ${API_BASE_URL}`);
  }
});

console.log('Environment variables injected successfully!');

