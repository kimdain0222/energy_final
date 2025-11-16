const fs = require('fs').promises;
const { CHALLENGES_FILE } = require('../config/paths');

// 챌린지 데이터 읽기
async function readChallenges() {
  try {
    const data = await fs.readFile(CHALLENGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { activeChallenges: [], completedChallenges: [], badges: [] };
  }
}

// 챌린지 데이터 쓰기
async function writeChallenges(challenges) {
  await fs.writeFile(CHALLENGES_FILE, JSON.stringify(challenges, null, 2));
}

module.exports = {
  readChallenges,
  writeChallenges
};

