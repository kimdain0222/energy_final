const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = 'https://ecopass2025.netlify.app/';
const outputPath = path.join(__dirname, '..', 'qrcode.png');

async function generateQRCode() {
    try {
        console.log('🔲 QR 코드 생성 중...');
        console.log('URL:', url);
        
        // QR 코드 이미지 생성
        await QRCode.toFile(outputPath, url, {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 500
        });
        
        console.log('✅ QR 코드 생성 완료!');
        console.log('📁 저장 위치:', outputPath);
        console.log('\n📱 이제 qrcode.png 파일을 스캔하면 바로 사이트로 이동할 수 있습니다!');
    } catch (error) {
        console.error('❌ QR 코드 생성 실패:', error);
        process.exit(1);
    }
}

generateQRCode();

