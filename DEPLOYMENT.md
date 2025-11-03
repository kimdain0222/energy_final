# 배포 가이드 (Railway + Netlify)

이 프로젝트는 백엔드를 Railway에, 프론트엔드를 Netlify에 배포합니다.

## 📋 배포 전 준비사항

1. **GitHub 저장소 생성** (필수)
   - 프로젝트를 GitHub에 푸시
   
2. **Railway 계정 생성**
   - https://railway.app 에서 회원가입
   
3. **Netlify 계정 생성**
   - https://netlify.com 에서 회원가입

## 🚂 Railway 배포 (백엔드)

### 1단계: Railway 프로젝트 생성

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. GitHub 저장소 선택
4. 프로젝트 생성

### 2단계: 환경 변수 설정

Railway 대시보드의 Variables 탭에서:

```
PORT=3000
FRONTEND_URL=https://your-app.netlify.app
```

(선택사항) 에너지공단 API 키가 있다면:
```
ENERGY_API_URL=https://openapi.kemco.or.kr/openapi/service/rest/energyProgram/getEnergyProgramList
ENERGY_API_KEY=your_api_key_here
```

### 3단계: 배포 설정

1. Settings → Build & Deploy
2. Root Directory: 프로젝트 루트 (기본값)
3. Build Command: `npm install`
4. Start Command: `npm start`

### 4단계: 도메인 확인

1. Settings → Networking
2. Generate Domain 클릭
3. 생성된 Railway URL 복사 (예: `https://your-app.up.railway.app`)
4. 이 URL을 나중에 Netlify 설정에서 사용합니다

## 🌐 Netlify 배포 (프론트엔드)

### 1단계: 프론트엔드 설정 수정

배포 전에 API 엔드포인트를 Railway URL로 변경해야 합니다.

`frontend/js/common.js` 파일에서 API_BASE_URL을 수정:

```javascript
const API_BASE_URL = 'https://your-app.up.railway.app';
```

또는 환경 변수를 사용하려면 `netlify.toml`에 추가:

```toml
[context.production.environment]
  API_BASE_URL = "https://your-app.up.railway.app"
```

### 2단계: Netlify 프로젝트 생성

1. Netlify 대시보드에서 "Add new site" → "Import an existing project"
2. GitHub 저장소 선택
3. 빌드 설정:
   - **Build command**: (비워두기 또는 `echo 'No build needed'`)
   - **Publish directory**: `frontend`
4. "Deploy site" 클릭

### 3단계: 환경 변수 설정 (선택사항)

Netlify 대시보드의 Site settings → Environment variables:

```
API_BASE_URL=https://your-app.up.railway.app
```

### 4단계: 리다이렉트 설정 확인

`netlify.toml` 파일이 이미 포함되어 있으므로 자동으로 설정됩니다.

## 🔧 CORS 설정

Railway 백엔드에서 Netlify 프론트엔드의 도메인을 허용해야 합니다.

`backend/server.js`의 CORS 설정이 이미 모든 도메인을 허용하도록 되어 있습니다:

```javascript
app.use(cors());
```

프로덕션에서는 특정 도메인만 허용하도록 수정하는 것이 좋습니다:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-app.netlify.app',
  credentials: true
}));
```

## 📝 배포 후 확인사항

### Railway 확인
- [ ] Railway 대시보드에서 서비스가 Running 상태인지 확인
- [ ] Railway URL로 API 테스트: `https://your-app.up.railway.app/api/programs`
- [ ] 로그에서 에러가 없는지 확인

### Netlify 확인
- [ ] Netlify 사이트가 배포 완료 상태인지 확인
- [ ] Netlify URL로 사이트 접속 확인
- [ ] 브라우저 콘솔에서 CORS 에러가 없는지 확인
- [ ] 로그인/회원가입 기능 테스트

## 🐛 문제 해결

### CORS 에러
- Railway의 CORS 설정 확인
- `FRONTEND_URL` 환경 변수가 올바르게 설정되었는지 확인

### API 연결 실패
- `frontend/js/common.js`의 `API_BASE_URL` 확인
- Railway 서비스가 Running 상태인지 확인
- 브라우저 네트워크 탭에서 요청 URL 확인

### 정적 파일 로딩 실패
- Netlify의 Publish directory가 `frontend`로 설정되었는지 확인
- `netlify.toml` 파일이 올바른지 확인

## 🔄 업데이트 배포

### Railway
- GitHub에 푸시하면 자동으로 재배포됩니다
- 또는 Railway 대시보드에서 "Redeploy" 클릭

### Netlify
- GitHub에 푸시하면 자동으로 재배포됩니다
- 또는 Netlify 대시보드에서 "Trigger deploy" 클릭

## 📞 추가 도움말

- Railway 문서: https://docs.railway.app
- Netlify 문서: https://docs.netlify.com

