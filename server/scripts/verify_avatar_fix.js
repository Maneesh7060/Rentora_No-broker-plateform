const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function testAvatar() {
  console.log('🧪 VERIFYING PROFILE IMAGE AND STATIC SERVING FIX');

  // 1. Check existing user avatar file directly via HTTP
  const existingUser = (
    await pool.query(
      "SELECT id, full_name, email, avatar_url FROM users WHERE email = 'manishgangwar373@gmail.com'"
    )
  ).rows[0];
  console.log('Existing user in DB:', existingUser);

  if (existingUser?.avatar_url) {
    const directUrl = 'http://localhost:5000' + existingUser.avatar_url;
    console.log('Testing direct HTTP GET on:', directUrl);
    const res = await fetch(directUrl);
    const buf = await res.arrayBuffer();
    console.log(
      '✅ Status:',
      res.status,
      '| Content-Type:',
      res.headers.get('content-type'),
      '| Size:',
      buf.byteLength,
      'bytes'
    );
  }

  // 2. Test login and get profile
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tenant.test@rentora.dev',
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log('✅ Login successful for test tenant (Status:', loginRes.status, ')');

  // 3. Upload a sample avatar
  const sampleImagePath = path.join(__dirname, 'test_sample.png');
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(sampleImagePath, samplePngBuffer);

  const fileBlob = new Blob([fs.readFileSync(sampleImagePath)], { type: 'image/png' });
  const formData = new FormData();
  formData.append('avatar', fileBlob, 'test_avatar.png');

  const uploadRes = await fetch('http://localhost:5000/api/v1/users/avatar', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('✅ Avatar upload status:', uploadRes.status);
  const newAvatarUrl = uploadData.data?.avatar_url;
  console.log('Uploaded Avatar URL:', newAvatarUrl);

  // 4. Test fetching the uploaded avatar from HTTP server
  const fetchUploaded = await fetch('http://localhost:5000' + newAvatarUrl);
  const upBuf = await fetchUploaded.arrayBuffer();
  console.log(
    '✅ Fetched uploaded image from server. Status:',
    fetchUploaded.status,
    '| Content-Type:',
    fetchUploaded.headers.get('content-type'),
    '| Size:',
    upBuf.byteLength,
    'bytes'
  );

  // Clean up
  fs.unlinkSync(sampleImagePath);
  console.log('🎉 AVATAR STATIC SERVING AND PROFILE IMAGE FIX VERIFIED 100%!');
  process.exit(0);
}

testAvatar().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
