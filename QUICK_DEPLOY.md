# 빠른 배포 가이드

## 🚀 5분 안에 배포하기

### 1. Railway 배포 (백엔드) - 2분

1. **Railway 접속**: https://railway.app
2. **New Project** → **Deploy from GitHub repo** 선택
3. 저장소 선택 후 자동 배포 시작
4. **Variables** 탭에서 환경 변수 추가:
   ```
   FRONTEND_URL=https://your-app.netlify.app
   ```
   (아직 Netlify URL이 없으면 나중에 추가)
5. Railway URL 복사 (예: `https://xxx.up.railway.app`)

### 2. Netlify 배포 (프론트엔드) - 3분

1. **Netlify 접속**: https://netlify.com
2. **Add new site** → **Import an existing project**
3. GitHub 저장소 선택
4. 빌드 설정:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `frontend`
5. **Environment variables** 추가:
   ```
   API_BASE_URL=https://xxx.up.railway.app
   ```
   (Railway에서 복사한 URL)
6. **Deploy site** 클릭

### 3. CORS 설정 완료

1. Netlify 배포 완료 후 URL 확인 (예: `https://xxx.netlify.app`)
2. Railway **Variables**에서 `FRONTEND_URL` 업데이트:
   ```
   FRONTEND_URL=https://xxx.netlify.app
   ```
3. Railway 재배포 (자동 또는 수동)

## ✅ 완료!

이제 `https://xxx.netlify.app`에서 사이트를 사용할 수 있습니다!

## 🔍 문제 해결

### CORS 오류가 발생하면?
- Railway의 `FRONTEND_URL`이 Netlify URL과 정확히 일치하는지 확인
- Railway 서비스가 Running 상태인지 확인

### API 연결이 안 되면?
- Netlify의 `API_BASE_URL`이 Railway URL과 일치하는지 확인
- 브라우저 콘솔에서 네트워크 오류 확인

