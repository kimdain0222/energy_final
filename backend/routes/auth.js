const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../utils/userData');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    const users = await readUsers();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: '이미 등록된 이메일입니다.' });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // 실제로는 해시화 필요
      name,
      phone,
      createdAt: new Date().toISOString(),
      badges: ['badge000'], // 회원가입 시 기본 뱃지 부여
      points: 0
    };

    users.push(newUser);
    await writeUsers(users);

    res.json({ success: true, message: '회원가입 성공', user: { id: newUser.id, email, name } });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    console.log('=== 로그인 요청 수신 ===');
    console.log('Body:', JSON.stringify(req.body));
    console.log('Origin:', req.headers.origin);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ 이메일 또는 비밀번호 누락');
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }
    
    console.log('사용자 목록 읽기 시도...');
    const users = await readUsers();
    console.log(`사용자 ${users.length}명 발견`);
    
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      console.log('❌ 사용자 인증 실패:', email);
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    console.log('✅ 로그인 성공:', user.id, user.email);
    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      message: '로그인 성공'
    });
  } catch (error) {
    console.error('❌ 로그인 API 오류:', error);
    console.error('스택 트레이스:', error.stack);
    res.status(500).json({ success: false, message: '서버 오류', error: error.message });
  }
});

module.exports = router;

