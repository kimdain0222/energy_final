const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRAMS_FILE = path.join(DATA_DIR, 'programs.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');

module.exports = {
  DATA_DIR,
  USERS_FILE,
  PROGRAMS_FILE,
  CHALLENGES_FILE
};

