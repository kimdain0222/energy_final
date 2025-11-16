const express = require('express');
const router = express.Router();
const { verifiedSavingScenarios } = require('../config/constants');
const { readUsers, writeUsers, generateDemoUsers } = require('../utils/userData');

// 검증된 절약 시나리오 조회
router.get('/saving-scenarios', async (req, res) => {
  try {
    res.json({
      success: true,
      scenarios: verifiedSavingScenarios
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 데모 사용자 초기화 (수동 생성용)
router.post('/demo/users/generate', async (req, res) => {
  try {
    const users = await readUsers();
    // 기존 사용자 중 데모 사용자가 아닌 것만 필터링
    const realUsers = users.filter(u => !u.id.startsWith('demo_user_'));
    
    // 기존 데모 사용자 제거
    await writeUsers(realUsers);
    
    // 새 데모 사용자 생성
    await generateDemoUsers();
    
    res.json({ 
      success: true, 
      message: '데모 사용자 30명이 생성되었습니다.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '데모 사용자 생성 실패' });
  }
});

module.exports = router;

