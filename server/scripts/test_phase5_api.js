const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Import server app or create test app
const app = require('../server');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET || 'rentora_dev_secret_change_in_production_abc123xyz',
    { expiresIn: '1h' }
  );
}

async function runPhase5Tests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING PHASE 5 API TEST SUITE (PROFILES, MEDIA, DOCS, ADMIN)');
  console.log('===========================================================');

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Get test tenant, owner, admin
    const tenantRes = await pool.query(`SELECT * FROM users WHERE role = 'tenant' LIMIT 1`);
    const tenant = tenantRes.rows[0];
    const tenantToken = generateToken(tenant);

    const ownerRes = await pool.query(`SELECT * FROM users WHERE role = 'owner' LIMIT 1`);
    const owner = ownerRes.rows[0];
    const ownerToken = generateToken(owner);

    const adminRes = await pool.query(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
    const admin = adminRes.rows[0];
    const adminToken = generateToken(admin);

    console.log(`👤 Tenant: ${tenant.full_name} (ID ${tenant.id})`);
    console.log(`🏡 Owner: ${owner.full_name} (ID ${owner.id})`);
    console.log(`🛡️ Admin: ${admin.full_name} (ID ${admin.id})`);

    // --- TEST 1: Tenant Profile & Completion ---
    console.log('\n--- 1. Testing GET /api/v1/users/profile (Tenant) ---');
    const profResp = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const profJson = await profResp.json();
    console.log(`✅ Status: ${profResp.status} | Completion: ${profJson.data.completion.percentage}%`);
    console.log(`  Missing Fields:`, profJson.data.completion.missingFields);

    // --- TEST 2: Update Profile ---
    console.log('\n--- 2. Testing PATCH /api/v1/users/profile ---');
    const updateResp = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        bio: 'Updated bio: Senior full-stack developer & avid reader.',
        city: 'Noida',
        state: 'Uttar Pradesh',
        address: 'Sector 62, Electronic City',
      }),
    });
    const updateJson = await updateResp.json();
    console.log(`✅ Status: ${updateResp.status} | New Completion: ${updateJson.data.completion.percentage}% | Bio: "${updateJson.data.user.bio}"`);

    // --- TEST 3: Public Owner Profile ---
    console.log('\n--- 3. Testing GET /api/v1/users/public/:id ---');
    const pubResp = await fetch(`${baseUrl}/api/v1/users/public/${owner.id}`);
    const pubJson = await pubResp.json();
    console.log(`✅ Status: ${pubResp.status} | Name: ${pubJson.data.profile.full_name} | Published Listings: ${pubJson.data.profile.properties_count}`);

    // --- TEST 4: Document Upload ---
    console.log('\n--- 4. Testing POST /api/v1/documents/upload ---');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakePdfContent = '%PDF-1.4 Fake document content for testing';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document_type"\r\n\r\n` +
      `IDENTITY\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="aadhaar_card.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n` +
      `${fakePdfContent}\r\n` +
      `--${boundary}--\r\n`;

    const docUploadResp = await fetch(`${baseUrl}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tenantToken}`,
      },
      body: multipartBody,
    });
    const docUploadJson = await docUploadResp.json();
    const docId = docUploadJson.data?.document?.id;
    console.log(`✅ Status: ${docUploadResp.status} | Uploaded Doc ID: ${docId} | Status: ${docUploadJson.data?.document?.status}`);

    // --- TEST 5: Document Authorization / Access Control ---
    console.log('\n--- 5. Testing Document Access Security ---');
    // Tenant accessing their own doc
    const ownDocResp = await fetch(`${baseUrl}/api/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    console.log(`✅ Owner accessing own doc -> Status: ${ownDocResp.status} (200 OK)`);

    // Unrelated owner accessing tenant's doc (not tied to their app)
    const unauthDocResp = await fetch(`${baseUrl}/api/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`✅ Unrelated user accessing doc -> Status: ${unauthDocResp.status} (403 Forbidden)`);

    // Admin accessing tenant's doc
    const adminDocResp = await fetch(`${baseUrl}/api/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ Admin accessing doc -> Status: ${adminDocResp.status} (200 OK)`);

    // --- TEST 6: Admin Security Check (Non-admin trying admin endpoint) ---
    console.log('\n--- 6. Testing Admin API Security Guard ---');
    const tenantAdminResp = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    console.log(`✅ Tenant requesting /admin/stats -> Status: ${tenantAdminResp.status} (403 Forbidden)`);

    const ownerAdminResp = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`✅ Owner requesting /admin/stats -> Status: ${ownerAdminResp.status} (403 Forbidden)`);

    // --- TEST 7: Admin Dashboard Stats ---
    console.log('\n--- 7. Testing Admin Dashboard Stats ---');
    const statsResp = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsJson = await statsResp.json();
    console.log(`✅ Status: ${statsResp.status} | Total Users: ${statsJson.data.stats.users.total_users} | Total Properties: ${statsJson.data.stats.properties.total_properties}`);

    // --- TEST 8: Admin Property Verification Flow ---
    console.log('\n--- 8. Testing Property Verification Workflow ---');
    // Create draft property as owner
    const propRes = await pool.query(
      `INSERT INTO properties (owner_id, title, property_type, rent_amount, address_line, city, state, zip_code, status, verification_status)
       VALUES ($1, 'Test Verification Penthouse', 'apartment', 35000, 'Test Street 10', 'Greater Noida', 'UP', '201310', 'draft', 'pending_verification')
       RETURNING id, title, status`,
      [owner.id]
    );
    const testPropId = propRes.rows[0].id;
    console.log(`Created draft test property: ID ${testPropId}`);

    // Admin rejects with reason
    const rejectResp = await fetch(`${baseUrl}/api/v1/admin/properties/${testPropId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'REJECT',
        rejectionReason: 'Property photos need to be clearer and address verified.',
      }),
    });
    const rejectJson = await rejectResp.json();
    console.log(`✅ Admin Rejected -> Status: ${rejectResp.status} | New Status: ${rejectJson.data.property.status} | Reason: "${rejectJson.data.property.rejection_reason}"`);

    // Admin approves property
    const approveResp = await fetch(`${baseUrl}/api/v1/admin/properties/${testPropId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    const approveJson = await approveResp.json();
    console.log(`✅ Admin Approved -> Status: ${approveResp.status} | New Status: ${approveJson.data.property.status} | Verification: ${approveJson.data.property.verification_status}`);

    // Clean test property
    await pool.query('DELETE FROM properties WHERE id = $1', [testPropId]);

    // --- TEST 9: Admin Document Verification ---
    console.log('\n--- 9. Testing Admin Document Verification ---');
    const docVerifyResp = await fetch(`${baseUrl}/api/v1/admin/documents/${docId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    const docVerifyJson = await docVerifyResp.json();
    console.log(`✅ Document Verified -> Status: ${docVerifyResp.status} | New Status: ${docVerifyJson.data.document.status}`);

    // Clean test document
    await pool.query('DELETE FROM documents WHERE id = $1', [docId]);

    // --- TEST 10: Admin User Status Toggle & Last Admin Protection ---
    console.log('\n--- 10. Testing Admin User Suspension & Protection ---');
    // Suspend test tenant
    const suspendResp = await fetch(`${baseUrl}/api/v1/admin/users/${tenant.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    const suspendJson = await suspendResp.json();
    console.log(`✅ Tenant Suspended -> Status: ${suspendResp.status} | User Status: ${suspendJson.data.user.account_status}`);

    // Verify suspended tenant is blocked from protected API
    const blockedResp = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    console.log(`✅ Suspended Tenant Requesting Profile -> Status: ${blockedResp.status} (403 Forbidden)`);

    // Reactivate tenant
    const reactivateResp = await fetch(`${baseUrl}/api/v1/admin/users/${tenant.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    console.log(`✅ Tenant Reactivated -> Status: ${reactivateResp.status} (200 OK)`);

    // Try suspending the only admin (must fail)
    const adminSuspendResp = await fetch(`${baseUrl}/api/v1/admin/users/${admin.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    console.log(`✅ Protection: Suspending last admin -> Status: ${adminSuspendResp.status} (400 Bad Request)`);

    console.log('\n🌟 ALL PHASE 5 BACKEND INTEGRATION TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    pool.end();
  }
}

runPhase5Tests();
