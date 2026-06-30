const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const db = require('../db');

// Nodemailer Transporter Setup for REAL Email Delivery
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this if using Outlook/Yahoo
    auth: {
      user: process.env.EMAIL_USER, // e.g. your-email@gmail.com
      pass: process.env.EMAIL_PASS, // e.g. your 16-digit App Password
    },
  });
};

// Validation Helpers
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
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
  const { email, password, rememberMe, deviceId, deviceName } = req.body;

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

    // --- Device Registration Check ---
    if (deviceId) {
      const devicesResult = await db.query('SELECT * FROM user_devices WHERE user_id = $1', [user.id]);
      const registeredDevices = devicesResult.rows;

      if (registeredDevices.length === 0) {
        // First device ever — auto-register with zero friction
        await db.query(
          'INSERT INTO user_devices (user_id, device_id, device_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, device_id) DO NOTHING',
          [user.id, deviceId, deviceName || 'Unknown Device']
        );
        await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
          [user.id, 'DEVICE_AUTO_REGISTERED', `First device auto-registered: ${deviceName || deviceId}`, req.ip]);
      } else {
        // Check if this specific device is registered
        const knownDevice = registeredDevices.find(d => d.device_id === deviceId);
        if (!knownDevice) {
          // Verify that SMTP credentials are set
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
              message: 'Server Configuration Error: To send verification emails, you MUST add EMAIL_USER and EMAIL_PASS to your backend/.env file and restart the server!'
            });
          }

          // UNRECOGNIZED DEVICE — block login, generate device OTP challenge
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await db.query(
            'UPDATE users SET device_otp = $1, device_otp_expires = $2 WHERE id = $3',
            [otp, expiresAt, user.id]
          );

          await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
            [user.id, 'UNRECOGNIZED_DEVICE_ACCESS_ATTEMPT', `Unrecognized device: ${deviceName || deviceId}. OTP challenge initiated.`, req.ip]);

          // Send Real Email using Nodemailer
          try {
            const transporter = createTransporter();
            const mailOptions = {
              from: `"IoT Gateway Security" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: "Security Alert: Verification Code for Unrecognized Device",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                  <h2 style="color: #6366f1; margin-bottom: 20px;">IoT Gateway Simulator — Device Verification</h2>
                  <p>We detected an attempt to sign in to your account from an unrecognized device: <strong>${deviceName || deviceId || 'Unknown Device'}</strong>.</p>
                  <p>Please enter the following 6-digit verification code to register this device and complete your sign-in. This code will expire in 10 minutes.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #f5f3ff; padding: 10px 20px; border-radius: 8px; border: 1px dashed #c084fc; display: inline-block;">
                      ${otp}
                    </span>
                  </div>
                  <p style="color: #64748b; font-size: 12px; margin-top: 20px;">If you did not request this code, someone else may be attempting to access your account. Please change your password immediately.</p>
                  <p style="color: #64748b; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px; text-align: center;">
                    © 2026 IoT Gateway Simulator.
                  </p>
                </div>
              `
            };
            await transporter.sendMail(mailOptions);
            console.log(`[Email Sent] Verification code successfully emailed to ${user.email}`);
          } catch (mailError) {
            console.error('Error sending device verification email:', mailError);
            return res.status(500).json({
              message: 'Failed to transmit verification email. Please check your SMTP settings or try again later.'
            });
          }

          return res.status(403).json({
            status: 'device_verification_required',
            message: 'Unrecognized device detected. A verification code has been transmitted to your email address.',
            email: user.email
          });
        }
      }
    }
    // --- End Device Check ---

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    const refreshToken = await generateRefreshToken(user.id);

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, 'USER_LOGIN', `User logged in from device: ${deviceName || 'unknown'}`, req.ip]);

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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    const userResult = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Security identity not registered in Nexus registry.' });
    }

    const user = userResult.rows[0];

    // Generate a secure 64-char hex token for the URL
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, 'PASSWORD_RESET_REQUESTED', `Secure email recovery link generated for ${user.email}`, req.ip]
    );

    // Send Real Email using Nodemailer
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        message: 'Server Configuration Error: To send real emails, you MUST add EMAIL_USER and EMAIL_PASS to your backend/.env file and restart the server!' 
      });
    }

    const transporter = createTransporter();
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const mailOptions = {
      from: `"IoT Gateway Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Action Required: Reset Your Security Key",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f9d58;">IoT Gateway Simulator — Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to set a new password. This link will expire in 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0f9d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          <p style="color: #64748b; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px; text-align: center;">
            © 2026 IoT Gateway Simulator.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`\n=============================================`);
    console.log(`[REAL EMAIL TRANSMISSION]`);
    console.log(`To: ${user.email}`);
    console.log(`Status: Successfully Dispatched to SMTP Provider`);
    console.log(`=============================================\n`);

    res.json({
      message: 'If an account matches, a recovery link has been dispatched to your actual inbox.',
      email: user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during recovery.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, secure token, and new password are required.' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be 8+ characters and contain a number.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid identity or recovery link.' });
    }

    const user = userResult.rows[0];

    if (!user.reset_token || user.reset_token !== token) {
      return res.status(400).json({ message: 'Invalid or incorrect recovery token. It may have been used.' });
    }

    const expiresAt = new Date(user.reset_token_expires);
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: 'Recovery link has expired (15-min limit exceeded).' });
    }

    // Update password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, 'PASSWORD_RESET_SUCCESSFUL', `Password updated successfully for ${user.email}`, req.ip]
    );

    res.json({ message: 'Security key updated successfully. Node connection re-established.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during key reset.' });
  }
};

exports.verifyDevice = async (req, res) => {
  const { email, otp, deviceId, deviceName, rememberMe } = req.body;

  if (!email || !otp || !deviceId) {
    return res.status(400).json({ message: 'Email, OTP code, and device ID are required.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid identity.' });
    }

    const user = userResult.rows[0];

    if (!user.device_otp || user.device_otp !== otp) {
      return res.status(400).json({ message: 'Invalid or incorrect device verification code.' });
    }

    const expiresAt = new Date(user.device_otp_expires);
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: 'Device verification code has expired (10-min limit).' });
    }

    // Register the device
    await db.query(
      'INSERT INTO user_devices (user_id, device_id, device_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, device_id) DO NOTHING',
      [user.id, deviceId, deviceName || 'Unknown Device']
    );

    // Clear OTP fields
    await db.query(
      'UPDATE users SET device_otp = NULL, device_otp_expires = NULL WHERE id = $1',
      [user.id]
    );

    // Generate session tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    const refreshToken = await generateRefreshToken(user.id);

    // Audit logs
    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, 'DEVICE_REGISTERED', `New device registered: ${deviceName || deviceId}`, req.ip]);
    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, 'USER_LOGIN', `User logged in after device verification from: ${deviceName || deviceId}`, req.ip]);

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during device verification.' });
  }
};
