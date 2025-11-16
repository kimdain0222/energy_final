const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../utils/userData');
const { readChallenges } = require('../utils/challengeData');
const { checkAndAwardBadges } = require('../utils/badgeSystem');
const { calculateEnergyPrediction, calculateWeeklyProjection } = require('../utils/energyPrediction');

// 챌린지 생성
router.post('/create', async (req, res) => {
  try {
    const { userId, type, targetKwh, targetAmount, startDate, userProfile } = req.body;

    if (!userId || !type || (!targetKwh && !targetAmount)) {
      return res.status(400).json({ success: false, message: '필수 정보를 입력해주세요.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 업데이트 (챌린지 생성 시 함께 저장)
    if (userProfile) {
      user.region = userProfile.region || user.region;
      user.housingType = userProfile.housingType || user.housingType;
      user.area = userProfile.area || user.area;
      user.householdSize = userProfile.householdSize || user.householdSize;
    }

    // 기간 계산
    const days = type === 'weekly' ? 7 : 30;
    const endDate = new Date(startDate || new Date());
    endDate.setDate(endDate.getDate() + days);

    const challenge = {
      id: `challenge_${Date.now()}`,
      userId,
      type,
      targetKwh: targetKwh || 0,
      targetAmount: targetAmount || 0,
      savedKwh: 0,
      savedAmount: 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      achievementRate: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // 사용자 정보 업데이트
    if (!user.currentChallenge) {
      user.currentChallenge = challenge;
      user.totalSaved = user.totalSaved || 0;
      user.points = user.points || 0;
      user.badges = user.badges || [];
      
      // 회원가입 뱃지 (badge000) 체크 - 없으면 추가
      if (!user.badges.includes('badge000')) {
        user.badges.push('badge000');
      }
      
      // 첫 절약 배지 체크
      if (!user.badges.includes('badge001')) {
        user.badges.push('badge001');
        user.points += 50; // 첫 절약 보너스
      }
    }

    await writeUsers(users);

    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ success: false, message: '챌린지 생성 실패' });
  }
});

// 절약량 업데이트
router.post('/update', async (req, res) => {
  try {
    const { userId, savedKwh, savedAmount } = req.body;

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.currentChallenge) {
      return res.status(404).json({ success: false, message: '진행 중인 챌린지가 없습니다.' });
    }

    const challenge = user.currentChallenge;
    challenge.savedKwh = savedKwh || challenge.savedKwh;
    challenge.savedAmount = savedAmount || challenge.savedAmount;
    
    const target = challenge.targetKwh || challenge.targetAmount;
    const saved = challenge.savedKwh || challenge.savedAmount;
    challenge.achievementRate = Math.round((saved / target) * 100);

    // 총 절약량 업데이트
    user.totalSaved = (user.totalSaved || 0) + (savedKwh || 0);
    
    // 포인트 계산 (1kWh당 10포인트)
    const newPoints = (savedKwh || 0) * 10;
    user.points = (user.points || 0) + newPoints;

    // 목표 달성 시 보너스 및 완료 처리
    if (challenge.achievementRate >= 100 && challenge.status === 'active') {
      user.points += 500;
      challenge.status = 'completed';
      
      // 완료된 챌린지를 completedChallenges에 추가
      if (!user.completedChallenges) user.completedChallenges = [];
      user.completedChallenges.push({
        id: challenge.id,
        type: challenge.type,
        targetKwh: challenge.targetKwh,
        savedKwh: challenge.savedKwh,
        achievementRate: challenge.achievementRate,
        completedAt: new Date().toISOString()
      });
      
      // 현재 챌린지 초기화
      user.currentChallenge = null;
    }

    // 배지 체크
    const challengesData = await readChallenges();
    checkAndAwardBadges(user, challengesData.badges);

    await writeUsers(users);

    res.json({ success: true, challenge, user: { points: user.points, badges: user.badges } });
  } catch (error) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
});

// 사용자 챌린지 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 프로필 정보
    const userProfile = {
      region: user.region || '서울',
      housingType: user.housingType || '아파트',
      area: user.area || 30,
      householdSize: user.householdSize || 4
    };

    // 설문 답변
    const surveyAnswers = user.surveyAnswers || {};

    // 에너지 예측
    const prediction = calculateEnergyPrediction(userProfile, surveyAnswers);

    // 주간별 진행률 계산
    let weeklyProgress = null;
    if (user.currentChallenge) {
      weeklyProgress = calculateWeeklyProjection(user.currentChallenge, userProfile, surveyAnswers);
    }

    // 기존 사용자도 badge000 (시작의 발걸음)이 없으면 부여
    if (!user.badges) {
      user.badges = [];
    }
    if (!user.badges.includes('badge000')) {
      user.badges.push('badge000');
      await writeUsers(users); // 저장
    }

    res.json({
      success: true,
      challenge: user.currentChallenge || null,
      totalSaved: user.totalSaved || 0,
      points: user.points || 0,
      badges: user.badges || ['badge000'],
      energyTier: user.energyTier || 2,
      weeklyProgress: weeklyProgress,
      prediction: prediction,
      userProfile: userProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 배지 목록 조회
router.get('/badges', async (req, res) => {
  try {
    const challengesData = await readChallenges();
    res.json({ success: true, badges: challengesData.badges || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '배지 조회 실패' });
  }
});

// 통계 데이터
router.get('/stats', async (req, res) => {
  try {
    const users = await readUsers();
    const activeUsers = users.filter(u => u.currentChallenge && u.currentChallenge.status === 'active');
    
    const totalSaved = activeUsers.reduce((sum, u) => sum + (u.currentChallenge?.savedKwh || 0), 0);
    const avgSaved = activeUsers.length > 0 ? Math.round(totalSaved / activeUsers.length) : 0;
    const topSaver = activeUsers.length > 0 
      ? activeUsers.reduce((top, u) => {
          const saved = u.currentChallenge?.savedKwh || 0;
          return saved > (top.savedKwh || 0) ? { name: u.name, savedKwh: saved } : top;
        }, { name: '', savedKwh: 0 })
      : { name: '없음', savedKwh: 0 };

    res.json({
      success: true,
      stats: {
        totalParticipants: activeUsers.length,
        totalSaved,
        averageSaved: avgSaved,
        topSaver
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '통계 조회 실패' });
  }
});

module.exports = router;

