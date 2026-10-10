require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/hash');

async function testPhase3Backend() {
  console.log('========================================');
  console.log('🧪 TESTING PHASE 3 BACKEND FUNCTIONALITY');
  console.log('========================================\n');

  try {
    // 1. Ensure we have a tenant and an owner user in DB
    const tenantRes = await pool.query("SELECT * FROM users WHERE email = 'tenant.test@rentora.dev'");
    let tenant = tenantRes.rows[0];
    if (!tenant) {
      const hashed = await hashPassword('Password@123');
      const insertTenant = await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, phone) VALUES ($1, $2, $3, 'tenant', '9876543210') RETURNING *",
        ['Test Tenant', 'tenant.test@rentora.dev', hashed]
      );
      tenant = insertTenant.rows[0];
    }

    const ownerRes = await pool.query("SELECT * FROM users WHERE email = 'owner@rentora.dev'");
    let owner = ownerRes.rows[0];
    if (!owner) {
      const hashed = await hashPassword('Password@123');
      const insertOwner = await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, phone) VALUES ($1, $2, $3, 'owner', '9876543211') RETURNING *",
        ['Test Owner', 'owner@rentora.dev', hashed]
      );
      owner = insertOwner.rows[0];
    }

    // Get a property owned by the owner
    let propRes = await pool.query("SELECT * FROM properties WHERE owner_id = $1 LIMIT 1", [owner.id]);
    let property = propRes.rows[0];
    if (!property) {
      const anyProp = await pool.query("SELECT * FROM properties LIMIT 1");
      property = anyProp.rows[0];
    }
    console.log(`✅ Test Tenant ID: ${tenant.id}, Test Owner ID: ${owner.id}, Property ID: ${property.id}`);

    // Import models directly to test logic
    const appModel = require('../models/applicationModel');
    const wishModel = require('../models/wishlistModel');
    const notifModel = require('../models/notificationModel');

    // Clean up any test records
    await pool.query("DELETE FROM rental_applications WHERE tenant_id = $1", [tenant.id]);
    await pool.query("DELETE FROM wishlists WHERE user_id = $1", [tenant.id]);
    await pool.query("DELETE FROM notifications WHERE user_id IN ($1, $2)", [tenant.id, owner.id]);

    // TEST 1: Wishlist
    console.log('\n--- Test 1: Wishlist ---');
    await wishModel.addToWishlist(tenant.id, property.id);
    let ids = await wishModel.getWishlistPropertyIds(tenant.id);
    console.log('Wishlist IDs:', ids);
    if (!ids.includes(property.id)) throw new Error('Property was not added to wishlist');
    let isIn = await wishModel.isInWishlist(tenant.id, property.id);
    if (!isIn) throw new Error('isInWishlist returned false');
    let list = await wishModel.getWishlistByUser(tenant.id);
    if (list.length !== 1 || list[0].id !== property.id) throw new Error('getWishlistByUser returned incorrect data');
    console.log('✅ Wishlist Add & Fetch Passed');

    await wishModel.removeFromWishlist(tenant.id, property.id);
    isIn = await wishModel.isInWishlist(tenant.id, property.id);
    if (isIn) throw new Error('Property still in wishlist after removal');
    console.log('✅ Wishlist Remove Passed');

    // TEST 2: Rental Application Creation
    console.log('\n--- Test 2: Rental Application Creation ---');
    const app = await appModel.createApplication({
      propertyId: property.id,
      tenantId: tenant.id,
      ownerId: owner.id,
      applicantName: tenant.full_name,
      phone: tenant.phone,
      email: tenant.email,
      monthlyIncome: 75000,
      employmentStatus: 'employed',
      occupation: 'Software Engineer',
      occupants: 2,
      moveInDate: '2026-10-01',
      message: 'Looking for a clean flat near tech park.',
    });
    console.log(`Created application ID: ${app.id}, Status: ${app.status}`);
    if (app.status !== 'pending') throw new Error('Application status is not pending');

    // Check duplicate pending prevention
    const pendingApp = await appModel.checkPendingApplication(tenant.id, property.id);
    if (!pendingApp || pendingApp.id !== app.id) throw new Error('checkPendingApplication failed');
    console.log('✅ Check Pending Application Passed');

    // TEST 3: Notification Creation & Fetch
    console.log('\n--- Test 3: Notifications ---');
    await notifModel.createNotification({
      userId: owner.id,
      title: 'New Rental Application',
      message: `${tenant.full_name} applied for "${property.title}".`,
      type: 'application_submitted',
      link: '/owner/applications',
    });

    let ownerNotifs = await notifModel.getNotificationsByUser(owner.id);
    console.log(`Owner has ${ownerNotifs.length} notifications`);
    if (ownerNotifs.length === 0) throw new Error('Owner did not receive notification');

    let unreadCount = await notifModel.getUnreadCount(owner.id);
    if (unreadCount !== 1) throw new Error(`Expected 1 unread notification, got ${unreadCount}`);

    await notifModel.markNotificationAsRead(ownerNotifs[0].id, owner.id);
    unreadCount = await notifModel.getUnreadCount(owner.id);
    if (unreadCount !== 0) throw new Error(`Expected 0 unread after markAsRead, got ${unreadCount}`);
    console.log('✅ Notifications Lifecycle Passed');

    // TEST 4: Owner Status Update (Approval)
    console.log('\n--- Test 4: Owner Status Update (Approve) ---');
    const updated = await appModel.updateApplicationStatus(app.id, {
      status: 'approved',
      ownerNotes: 'Documents verified. Welcome aboard!',
    });
    if (updated.status !== 'approved' || updated.owner_notes !== 'Documents verified. Welcome aboard!') {
      throw new Error('Application status or notes did not update correctly');
    }
    console.log('✅ Owner Application Approval Passed');

    // TEST 5: Application Stats
    console.log('\n--- Test 5: Dashboard Stats ---');
    const tenantStats = await appModel.countTenantApplications(tenant.id);
    console.log('Tenant stats:', tenantStats);
    if (tenantStats.approved !== 1) throw new Error('Expected 1 approved application in tenant stats');

    const ownerStats = await appModel.countOwnerApplications(owner.id);
    console.log('Owner stats:', ownerStats);
    if (ownerStats.approved !== 1) throw new Error('Expected 1 approved application in owner stats');

    console.log('\n🎉 ALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 3 Backend Test Error:', err);
    process.exit(1);
  }
}

testPhase3Backend();
