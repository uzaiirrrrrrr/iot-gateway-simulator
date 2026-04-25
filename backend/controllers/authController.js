const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Validation Helpers
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword = (password) => {
    // Min 8 chars, at least 1 number
    return password.length >= 8 && /\d/.test(password);
};

exports.register = async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be 8+ characters and contain a number.' });
  }
  
  try {
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const assignedRole = role || 'Viewer';

    const result = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, status`,
      [email, passwordHash, assignedRole]
    );

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [result.rows[0].id, 'USER_REGISTERED', `User registered with role ${assignedRole}`, req.ip]);

    res.status(201).json({ message: 'User registered successfully.', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateRefreshToken = async (userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
    return token;
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    const refreshToken = await generateRefreshToken(user.id);

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [user.id, 'USER_LOGIN', 'User logged in successfully', req.ip]);

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required.' });

    try {
        const storedToken = await db.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
        if (storedToken.rows.length === 0) return res.status(403).json({ message: 'Invalid or expired refresh token.' });

        const userResult = await db.query('SELECT id, email, role FROM users WHERE id = $1', [storedToken.rows[0].user_id]);
        if (userResult.rows.length === 0) return res.status(403).json({ message: 'User not found.' });

        const user = userResult.rows[0];
        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token: newToken });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    const { token } = req.body;
    try {
        await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
        res.json({ message: 'Logged out.' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logoutAll = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
        res.json({ message: 'Logged out from all devices.' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};
