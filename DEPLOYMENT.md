# 배포 가이드 (Railway + Netlify)

이 프로젝트는 백엔드를 Railway에, 프론트엔드를 Netlify에 배포합니다.

## 📋 배포 전 준비사항

1. **GitHub 저장소 준비**
   - 코드를 GitHub에 푸시
   - Public 또는 Private 저장소 모두 가능

2. **Railway 계정 생성**
   - https://railway.app 에서 회원가입
   - GitHub 계정으로 연동 권장

3. **Netlify 계정 생성**
   - https://netlify.com 에서 회원가입
   - GitHub 계정으로 연동 권장

## 🚂 Railway 배포 (백엔드)

### 1단계: Railway 프로젝트 생성

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. GitHub 저장소 선택
4. 프로젝트가 자동으로 생성되고 배포 시작

### 2단계: 환경 변수 설정

Railway 대시보드의 **Variables** 탭에서 다음 환경 변수들을 추가하세요:

```
FRONTEND_URL=https://your-app.netlify.app
```

**중요:**
- Railway가 자동으로 `PORT` 환경 변수를 제공하므로 **설정하지 않아도 됩니다**
- `FRONTEND_URL`은 Netlify 배포 **이후**에 실제 URL로 변경해야 합니다
- 예시: `https://energy-saving-app.netlify.app`

### 3단계: 배포 확인

1. Railway 대시보드에서 서비스가 "Running" 상태인지 확인
2. 생성된 Railway URL 복사 (예: `https://your-app.up.railway.app`)
3. 이 URL을 나중에 Netlify 설정에서 사용합니다

**테스트:**
```bash
curl https://your-app.up.railway.app/health
```

## 🌐 Netlify 배포 (프론트엔드)

### 1단계: Netlify 프로젝트 생성

1. Netlify 대시보드에서 "Add new site" → "Import an existing project"
2. GitHub 저장소 선택
3. 빌드 설정:
   - **Base directory**: (비워두기)
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `frontend`
4. "Deploy site" 클릭

### 2단계: 환경 변수 설정

Netlify 대시보드의 **Site settings** → **Environment variables**에서:

```
API_BASE_URL=https://your-app.up.railway.app
```

**중요:**
- `API_BASE_URL`은 Railway에서 생성한 백엔드 URL입니다
- 빌드 시 이 값이 프론트엔드 코드에 자동으로 주입됩니다

### 3단계: 배포 확인

1. Netlify 사이트가 배포 완료 상태인지 확인
2. Netlify URL로 사이트 접속 확인
3. 브라우저 콘솔에서 `window.API_BASE_URL` 확인

## 🔗 CORS 설정

Railway 백엔드에서 Netlify 프론트엔드의 도메인을 허용해야 합니다.

### Railway 환경 변수 업데이트

Railway 대시보드의 **Variables** 탭에서:

```
FRONTEND_URL=https://your-app.netlify.app
```

**참고:**
- Netlify 프리뷰 URL (`*.netlify.app`)은 자동으로 허용됩니다
- 프로덕션 URL은 `FRONTEND_URL` 환경 변수로 설정하세요

## 📝 배포 후 확인사항

### Railway 확인
- [ ] Railway 대시보드에서 서비스가 Running 상태인지 확인
- [ ] Railway URL로 API 테스트: `https://your-app.up.railway.app/api/programs`
- [ ] 헬스 체크: `https://your-app.up.railway.app/health`

### Netlify 확인
- [ ] Netlify 사이트가 배포 완료 상태인지 확인
- [ ] Netlify URL로 사이트 접속 확인
- [ ] 브라우저 콘솔에서 API 호출이 정상적으로 작동하는지 확인

## 🔧 문제 해결

### CORS 오류
- Railway의 CORS 설정 확인
- `FRONTEND_URL` 환경 변수가 올바른지 확인
- Railway 서비스가 Running 상태인지 확인

### API 연결 실패
- Netlify의 `API_BASE_URL` 환경 변수 확인
- Railway URL이 올바른지 확인
- 브라우저 콘솔에서 네트워크 오류 확인

### 빌드 실패
- Netlify의 Publish directory가 `frontend`로 설정되었는지 확인
- `netlify.toml` 파일이 올바른지 확인
- 빌드 로그에서 오류 메시지 확인

## 🔄 업데이트 배포

### Railway
- GitHub에 푸시하면 자동으로 재배포됩니다
- 또는 Railway 대시보드에서 "Redeploy" 클릭

### Netlify
- GitHub에 푸시하면 자동으로 재배포됩니다
- 또는 Netlify 대시보드에서 "Trigger deploy" 클릭

## 📚 참고 자료

- Railway 문서: https://docs.railway.app
- Netlify 문서: https://docs.netlify.com

