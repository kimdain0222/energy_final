const express = require('express');
const router = express.Router();
const { readProgramsCache } = require('../utils/programData');
const { readUsers, writeUsers } = require('../utils/userData');
const { readChallenges } = require('../utils/challengeData');
const { checkAndAwardBadges } = require('../utils/badgeSystem');

// 에너지 분석 (누진세 계산)
router.post('/', async (req, res) => {
  try {
    const { houseType, area, monthlyUsage } = req.body;

    // 누진세 계산 로직
    const tierRates = [
      { min: 0, max: 200, rate: 93.3 },
      { min: 201, max: 400, rate: 187.9 },
      { min: 401, max: Infinity, rate: 280.6 }
    ];

    let totalBill = 0;
    let remainingUsage = monthlyUsage;

    for (const tier of tierRates) {
      if (remainingUsage <= 0) break;
      
      const tierUsage = Math.min(remainingUsage, tier.max - tier.min);
      totalBill += tierUsage * tier.rate;
      remainingUsage -= tierUsage;
    }

    // 기본 요금 추가
    const baseRate = 1600;
    totalBill += baseRate;

    // 추천 프로그램 찾기
    const programs = await readProgramsCache();
    const recommended = programs
      .filter(p => p.isActive && (p.target.includes(houseType) || p.target === '전체'))
      .slice(0, 3);

    // 사용자 정보에 티어 저장 (향후 환산에 사용)
    const tier = monthlyUsage <= 200 ? 1 : monthlyUsage <= 400 ? 2 : 3;
    
    // 사용자 정보 업데이트 (티어 저장 및 분석 기록 저장)
    if (req.body.userId) {
      const users = await readUsers();
      const user = users.find(u => u.id === req.body.userId);
      if (user) {
        user.energyTier = tier;
        if (req.body.houseType) user.housingType = req.body.houseType;
        if (req.body.area) user.area = req.body.area;
        
        // 분석 기록 저장
        if (!user.analysisHistory) user.analysisHistory = [];
        user.analysisHistory.unshift({
          date: new Date().toISOString(),
          houseType: houseType,
          area: area,
          monthlyUsage: monthlyUsage,
          monthlyBill: Math.round(totalBill),
          tier: tier,
          estimatedSavings: Math.round(totalBill * 0.2)
        });
        
        // 최근 10개만 유지
        if (user.analysisHistory.length > 10) {
          user.analysisHistory = user.analysisHistory.slice(0, 10);
        }
        
        // 분석 횟수 업데이트
        user.analysisCount = user.analysisHistory.length;
        
        // 배지 체크 (분석 마스터 등)
        const challengesData = await readChallenges();
        checkAndAwardBadges(user, challengesData.badges);
        
        await writeUsers(users);
      }
    }

    res.json({
      success: true,
      analysis: {
        monthlyBill: Math.round(totalBill),
        tier: tier,
        estimatedSavings: Math.round(totalBill * 0.2), // 추정 절감액
        recommendedPrograms: recommended
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '분석 실패' });
  }
});

module.exports = router;

