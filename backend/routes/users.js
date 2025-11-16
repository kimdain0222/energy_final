const express = require('express');
const router = express.Router();
const { readUsers, writeUsers, generateDemoUsers } = require('../utils/userData');
const { readChallenges } = require('../utils/challengeData');
const { checkAndAwardBadges } = require('../utils/badgeSystem');
const { calculateEnergyPrediction } = require('../utils/energyPrediction');

// 사용자 설문 저장
router.post('/survey', async (req, res) => {
  try {
    const { userId, surveyAnswers, userProfile } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 업데이트
    if (userProfile) {
      user.region = userProfile.region || user.region;
      user.housingType = userProfile.housingType || user.housingType;
      user.area = userProfile.area || user.area;
      user.householdSize = userProfile.householdSize || user.householdSize;
    }

    // 설문 답변 저장
    if (surveyAnswers) {
      user.surveyAnswers = surveyAnswers;
    }

    await writeUsers(users);

    // 예측 결과 계산
    const profile = {
      region: user.region || '서울',
      housingType: user.housingType || '아파트',
      area: user.area || 30,
      householdSize: user.householdSize || 4
    };
    const prediction = calculateEnergyPrediction(profile, surveyAnswers || {});

    // 배지 체크 (맞춤형 설문 완료 등)
    const challengesData = await readChallenges();
    checkAndAwardBadges(user, challengesData.badges);
    
    await writeUsers(users);

    res.json({
      success: true,
      message: '설문이 저장되었습니다.',
      prediction: prediction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '설문 저장 실패' });
  }
});

// 사용자 정보 조회 (마이페이지용)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // badge000 (시작의 발걸음)이 없으면 부여
    if (!user.badges) {
      user.badges = [];
    }
    if (!user.badges.includes('badge000')) {
      user.badges.push('badge000');
      await writeUsers(users); // 저장
    }

    // 비밀번호 제외한 사용자 정보 반환
    const { password, ...userInfo } = user;
    
    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '사용자 정보 조회 실패' });
  }
});

module.exports = router;

