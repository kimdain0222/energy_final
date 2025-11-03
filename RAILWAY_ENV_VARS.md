# Railway 환경 변수 설정 가이드

## 필수 환경 변수

Railway의 **Variables** 탭에서 다음 환경 변수들을 추가하세요:

### 1. PORT (자동 설정됨 - 선택사항)
```
PORT=3000
```
- Railway가 자동으로 `PORT` 환경 변수를 제공하므로 **설정하지 않아도 됩니다**
- 하지만 명시적으로 설정하고 싶다면 `3000`으로 설정 가능

### 2. FRONTEND_URL (필수)
```
FRONTEND_URL=https://your-app.netlify.app
```
- Netlify에 배포한 프론트엔드 URL을 입력하세요
- CORS 설정에 사용됩니다
- 예시: `https://energy-saving-app.netlify.app`
- **주의**: Netlify 배포 후 실제 URL로 변경해야 합니다

## 선택사항 (에너지공단 API 사용 시)

### 3. ENERGY_API_URL (선택사항)
```
ENERGY_API_URL=https://openapi.kemco.or.kr/openapi/service/rest/energyProgram/getEnergyProgramList
```
- 에너지공단 API URL
- 기본값이 이미 설정되어 있어서 설정하지 않아도 됩니다

### 4. ENERGY_API_KEY (선택사항)
```
ENERGY_API_KEY=your_actual_api_key_here
```
- 에너지공단에서 발급받은 실제 API 키
- **없으면 더미 데이터로 동작합니다**

## 설정 방법

1. Railway 대시보드에서 프로젝트 선택
2. **Variables** 탭 클릭
3. **+ New Variable** 클릭
4. **Key**와 **Value** 입력 후 **Add** 클릭

## 설정 예시

```
필수:
- FRONTEND_URL: https://energy-saving-app.netlify.app

선택사항:
- ENERGY_API_KEY: abc123xyz789 (실제 API 키가 있다면)
```

## 중요 사항

- `PORT`는 Railway가 자동으로 할당하므로 **설정하지 않아도 됩니다**
- `FRONTEND_URL`은 Netlify 배포 **이후**에 설정하세요
- `ENERGY_API_KEY`는 실제 API 키가 있을 때만 설정하세요 (없으면 더미 데이터 사용)

