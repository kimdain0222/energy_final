const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const { readProgramsCache, writeProgramsCache, fetchEnergyPrograms } = require('../utils/programData');
const { PROGRAMS_FILE } = require('../config/paths');
const { readUsers, writeUsers } = require('../utils/userData');
const { readChallenges } = require('../utils/challengeData');
const { checkAndAwardBadges } = require('../utils/badgeSystem');

// 에너지공단 지원사업 조회
router.get('/', async (req, res) => {
  try {
    // 캐시 확인 (5분 이내 데이터면 재사용)
    let programs = await readProgramsCache();
    const cacheTime = await fs.stat(PROGRAMS_FILE).then(stats => stats.mtime.getTime()).catch(() => 0);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (programs.length === 0 || (now - cacheTime > fiveMinutes)) {
      // API에서 새로 가져오기
      programs = await fetchEnergyPrograms();
      await writeProgramsCache(programs);
    }

    // 필터링 (query params)
    const { houseType, minSupport, region } = req.query;
    let filtered = programs.filter(p => p.isActive);

    if (houseType) {
      filtered = filtered.filter(p => 
        p.target.includes(houseType) || p.target === '전체'
      );
    }

    if (region) {
      filtered = filtered.filter(p => 
        p.region === region || p.region === '전국'
      );
    }

    res.json({ 
      success: true, 
      programs: filtered,
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '프로그램 조회 실패' });
  }
});

// 프로그램 새로고침 (API 강제 호출)
router.post('/refresh', async (req, res) => {
  try {
    const programs = await fetchEnergyPrograms();
    await writeProgramsCache(programs);
    res.json({ success: true, programs, total: programs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: '새로고침 실패' });
  }
});

// 지원사업 조회 기록 저장
router.post('/view', async (req, res) => {
  try {
    const { userId, programId } = req.body;

    if (!userId || !programId) {
      return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 프로그램 정보 조회
    const programs = await readProgramsCache();
    const program = programs.find(p => p.id === programId);

    if (program) {
      // 조회 기록 저장
      if (!user.viewedPrograms) user.viewedPrograms = [];
      
      // 중복 체크 (같은 프로그램이 이미 있으면 제거)
      user.viewedPrograms = user.viewedPrograms.filter(p => p.id !== programId);
      
      // 최신순으로 앞에 추가
      user.viewedPrograms.unshift({
        id: program.id,
        title: program.title,
        description: program.description,
        region: program.region,
        target: program.target,
        supportAmount: program.supportAmount,
        applyUrl: program.applyUrl,
        viewedAt: new Date().toISOString()
      });

      // 최근 20개만 유지
      if (user.viewedPrograms.length > 20) {
        user.viewedPrograms = user.viewedPrograms.slice(0, 20);
      }
      
      // 배지 체크 (지원사업 탐험가 등)
      const challengesData = await readChallenges();
      checkAndAwardBadges(user, challengesData.badges);
      
      await writeUsers(users);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 기록 저장 실패' });
  }
});

module.exports = router;

