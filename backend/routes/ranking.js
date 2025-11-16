const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../utils/userData');
const { readChallenges } = require('../utils/challengeData');
const { checkAndAwardBadges } = require('../utils/badgeSystem');

// 랭킹 조회
router.get('/', async (req, res) => {
  try {
    const { type, region, housingType, period, userId } = req.query;
    const users = await readUsers();
    
    // 랭킹 방문 추적 (userId가 있을 때만)
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.rankingVisits = (user.rankingVisits || 0) + 1;
        // 배지 체크 (커뮤니티 참여자 등)
        const challengesData = await readChallenges();
        checkAndAwardBadges(user, challengesData.badges);
        await writeUsers(users);
      }
    }

    let filtered = users.filter(u => u.currentChallenge && u.currentChallenge.status === 'active');

    // 지역 필터
    if (region && region !== '전체') {
      filtered = filtered.filter(u => {
        const userRegion = u.region || '';
        return userRegion.includes(region) || userRegion === '전국';
      });
    }

    // 주택 유형 필터
    if (housingType && housingType !== '전체') {
      filtered = filtered.filter(u => {
        const userHousing = u.housingType || '';
        return userHousing.includes(housingType);
      });
    }

    // 정렬 및 랭킹 계산
    filtered = filtered.map((u, index) => ({
      ...u,
      rank: index + 1,
      savedKwh: u.currentChallenge?.savedKwh || 0,
      achievementRate: u.currentChallenge?.achievementRate || 0
    })).sort((a, b) => {
      // 절약량 우선
      if (b.savedKwh !== a.savedKwh) {
        return b.savedKwh - a.savedKwh;
      }
      // 동점시 달성률
      return b.achievementRate - a.achievementRate;
    });

    // 랭킹 재계산
    filtered = filtered.map((u, index) => ({
      ...u,
      rank: index + 1
    }));

    res.json({
      success: true,
      rankings: filtered.slice(0, 100), // 상위 100명
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '랭킹 조회 실패' });
  }
});

module.exports = router;

