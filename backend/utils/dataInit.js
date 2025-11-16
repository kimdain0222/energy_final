const fs = require('fs').promises;
const { DATA_DIR, USERS_FILE, PROGRAMS_FILE, CHALLENGES_FILE } = require('../config/paths');
const { readUsers, generateDemoUsers } = require('./userData');

async function initializeData() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // users.json 초기화
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
  }

  // programs.json 초기화 (캐시용)
  try {
    await fs.access(PROGRAMS_FILE);
  } catch {
    await fs.writeFile(PROGRAMS_FILE, JSON.stringify([], null, 2));
  }

  // challenges.json 초기화
  try {
    await fs.access(CHALLENGES_FILE);
  } catch {
    const defaultChallenges = {
      activeChallenges: [],
      completedChallenges: [],
      badges: [
        { id: 'badge000', name: '시작의 발걸음', description: '에너지 절약 플랫폼에 가입하셨습니다!', icon: '👋', condition: '회원가입 완료' },
        { id: 'badge001', name: '첫 절약', description: '첫 번째 목표 설정', icon: '🌱', condition: '첫 목표 설정' },
        { id: 'badge002', name: '에너지 마스터', description: '100kWh 절약 달성', icon: '⚡', condition: '100kWh 절약' },
        { id: 'badge003', name: '주간 챔피언', description: '주간 1위 달성', icon: '🥇', condition: '주간 1위' },
        { id: 'badge004', name: '지속의 달인', description: '4주 연속 참여', icon: '🔥', condition: '4주 연속 참여' },
        { id: 'badge005', name: '지역 히어로', description: '지역별 1위 달성', icon: '🏆', condition: '지역별 1위' },
        { id: 'badge006', name: '50kWh 클럽', description: '50kWh 절약 달성', icon: '💚', condition: '50kWh 절약' },
        { id: 'badge007', name: '목표 달성왕', description: '목표 150% 초과 달성', icon: '🎯', condition: '목표 150% 초과' }
      ]
    };
    await fs.writeFile(CHALLENGES_FILE, JSON.stringify(defaultChallenges, null, 2));
  }

  // 데모용 가상 사용자 생성 (기존 사용자가 5명 미만일 때만)
  try {
    const existingUsers = await readUsers();
    if (existingUsers.length < 5) {
      await generateDemoUsers();
      console.log('데모용 가상 사용자 30명이 생성되었습니다.');
    }
  } catch (error) {
    console.error('데모 사용자 생성 중 오류:', error);
  }
}

module.exports = { initializeData };

