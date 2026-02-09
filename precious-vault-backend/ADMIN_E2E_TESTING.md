# Admin Management System - End-to-End Testing Guide

This guide explains how to test the complete admin management system workflows from frontend to backend.

## Prerequisites

1. **Backend Running**: The Django backend must be running on `http://localhost:8000`
2. **Admin Frontend Running**: The React admin frontend must be running (default: `http://localhost:5173`)
3. **Database Seeded**: The database should have test data including:
   - An admin user (staff/superuser)
   - Some regular users with pending KYC
   - Some pending transactions
   - Some delivery requests

## Setup Instructions

### 1. Start the Backend

**Option A: Using Docker Compose**
```bash
docker-compose up backend postgres redis
```

**Option B: Local Development**
```bash
cd precious-vault-backend
python manage.py runserver
```

### 2. Create Admin User (if not exists)

```bash
cd precious-vault-backend
python manage.py createsuperuser
```

Follow the prompts to create an admin user:
- Email: `admin@preciousvault.com`
- Password: `admin123` (or your choice)

### 3. Seed Test Data (optional)

If you have a seed command:
```bash
python manage.py seed_data
```

Or create test data manually through Django admin or API.

### 4. Start the Admin Frontend

```bash
cd precious-vault-admin
npm run dev
```

The admin frontend will start on `http://localhost:5173` (or the next available port).

## Automated API Tests

Run the automated end-to-end API test script:

```bash
cd precious-vault-backend
python test_admin_e2e.py
```

This script tests:
1. ✓ Admin login authentication
2. ✓ Dashboard metrics retrieval
3. ✓ Dashboard alerts
4. ✓ KYC pending list
5. ✓ KYC approval workflow (read-only)
6. ✓ Transaction pending list
7. ✓ Transaction approval workflow (read-only)
8. ✓ User search
9. ✓ User suspension workflow (read-only)
10. ✓ Delivery list
11. ✓ Delivery status update workflow (read-only)
12. ✓ Audit log verification

**Note**: The script performs read-only operations to avoid modifying test data. For full workflow testing, use the manual tests below.

## Manual Frontend Tests

### Test 1: Login → Dashboard Workflow

**Steps:**
1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Enter admin credentials:
   - Email: `admin@preciousvault.com`
   - Password: `admin123`
4. Click "Login"

**Expected Results:**
- ✓ Login successful
- ✓ Redirected to dashboard
- ✓ Dashboard displays metrics:
  - Total users count
  - Active users (30 days)
  - Pending KYC count
  - Pending transactions count
  - Active deliveries count
- ✓ Recent admin actions displayed
- ✓ Alerts section shows items requiring attention

**Verification:**
- Check browser console for no errors
- Verify JWT token is stored in localStorage
- Verify API calls return 200 status

---

### Test 2: KYC Approval Workflow

**Steps:**
1. From dashboard, click "KYC Management" in sidebar
2. View the list of pending KYC requests
3. Click "View Details" on a pending request
4. Review the user information and documents
5. Click "Approve" button
6. Confirm the approval

**Expected Results:**
- ✓ KYC list displays all pending requests
- ✓ Detail modal shows:
  - User email and name
  - Identity documents with zoom capability
  - KYC submission history
- ✓ Approval succeeds
- ✓ User status changes to "verified"
- ✓ Success notification displayed
- ✓ KYC list updates automatically
- ✓ Dashboard pending KYC count decreases

**Verification:**
- Check audit log for approval entry
- Verify user can now perform restricted operations
- Check database: `SELECT kyc_status FROM users_user WHERE id = ?`

---

### Test 3: Transaction Approval Workflow

**Steps:**
1. Click "Transactions" in sidebar
2. View pending transactions list
3. Click on a transaction to view details
4. Review transaction information
5. Add a note: "Verified with user via phone"
6. Click "Approve" button
7. Confirm the approval

**Expected Results:**
- ✓ Transaction list displays all pending transactions
- ✓ Transactions ordered by amount and age
- ✓ Detail modal shows:
  - User information
  - Transaction type, metal, quantity, amount
  - Transaction notes
- ✓ Note is added successfully
- ✓ Approval succeeds
- ✓ Transaction status changes to "completed"
- ✓ User portfolio/wallet updated
- ✓ Success notification displayed
- ✓ Transaction list updates

**Verification:**
- Check audit log for approval entry
- Verify transaction note is saved
- Check user's portfolio for updated holdings
- Check database: `SELECT status FROM trading_transaction WHERE id = ?`

---

### Test 4: User Suspension Workflow

**Steps:**
1. Click "Users" in sidebar
2. Search for a user by email or username
3. Click on a user to view details
4. Review user information, balance, and activity
5. Click "Suspend Account" button
6. Enter reason: "Suspicious activity detected"
7. Confirm suspension

**Expected Results:**
- ✓ User search returns matching results
- ✓ User detail modal shows:
  - Complete user information (with masked sensitive data)
  - Wallet balance
  - Portfolio holdings
  - Recent transactions
  - Activity timeline
- ✓ Suspension succeeds
- ✓ User status changes to inactive
- ✓ Success notification displayed
- ✓ User list updates

**Verification:**
- Check audit log for suspension entry with reason
- Try to login as suspended user (should fail)
- Try to perform trading operation as suspended user (should fail)
- Check database: `SELECT is_active FROM users_user WHERE id = ?`

**Cleanup:**
- Reactivate the user after testing

---

### Test 5: Delivery Status Update Workflow

**Steps:**
1. Click "Deliveries" in sidebar
2. View delivery requests list
3. Click on a delivery to view details
4. Review delivery information
5. Click "Update Status"
6. Select new status: "in_transit"
7. Confirm update
8. Assign carrier:
   - Carrier: "FedEx"
   - Tracking: "1234567890"
9. Confirm assignment

**Expected Results:**
- ✓ Delivery list displays all requests
- ✓ Detail modal shows:
  - User information
  - Delivery items
  - Shipping address
  - Current status
  - Delivery history timeline
- ✓ Status update succeeds
- ✓ History entry created with timestamp
- ✓ Carrier assignment succeeds
- ✓ Tracking number saved
- ✓ User receives notification (if configured)
- ✓ Success notification displayed

**Verification:**
- Check audit log for status update entry
- Check delivery history for new entry
- Verify user can see updated status in their account
- Check database: `SELECT status, carrier, tracking_number FROM delivery_deliveryrequest WHERE id = ?`

---

### Test 6: Audit Log Verification

**Steps:**
1. Click "Audit Log" in sidebar
2. View all admin actions
3. Filter by action type: "kyc_approve"
4. Filter by date range: Last 7 days
5. Click on an audit entry to view details

**Expected Results:**
- ✓ Audit log displays all admin actions
- ✓ Actions ordered by timestamp (newest first)
- ✓ Each entry shows:
  - Timestamp
  - Admin user who performed action
  - Action type
  - Target object
  - Details
- ✓ Filters work correctly
- ✓ Pagination works
- ✓ All previous test actions are logged

**Verification:**
- Verify all actions from previous tests are present
- Check that each action has correct admin_user
- Verify timestamps are accurate
- Check database: `SELECT * FROM admin_api_adminaction ORDER BY timestamp DESC LIMIT 10`

---

## Common Issues and Troubleshooting

### Issue: "401 Unauthorized" errors

**Solution:**
- Check that JWT token is present in localStorage
- Try logging out and logging back in
- Verify admin user has `is_staff=True` or `is_superuser=True`

### Issue: "403 Forbidden" errors

**Solution:**
- Verify the logged-in user is an admin (staff or superuser)
- Check Django settings for `IsAdminUser` permission class
- Verify CORS is configured correctly

### Issue: "Network Error" or "Connection Refused"

**Solution:**
- Verify backend is running on `http://localhost:8000`
- Check CORS_ALLOWED_ORIGINS includes admin frontend URL
- Check browser console for CORS errors

### Issue: Data not updating after actions

**Solution:**
- Check TanStack Query cache invalidation
- Verify API endpoints return correct status codes
- Check browser network tab for API responses
- Try hard refresh (Ctrl+Shift+R)

### Issue: Audit log entries not created

**Solution:**
- Verify `create_audit_log()` is called in view methods
- Check database for AdminAction records
- Verify no exceptions in backend logs

---

## Test Data Requirements

For comprehensive testing, ensure you have:

1. **Users:**
   - At least 1 admin user (staff/superuser)
   - At least 3 regular users
   - At least 1 user with pending KYC
   - At least 1 suspended user

2. **Transactions:**
   - At least 2 pending transactions
   - At least 2 completed transactions
   - Transactions of different types (buy, sell)

3. **Deliveries:**
   - At least 1 pending delivery
   - At least 1 in-transit delivery
   - At least 1 completed delivery

4. **Audit Log:**
   - Should have entries from previous admin actions

---

## Performance Checks

While testing, monitor:

1. **API Response Times:**
   - Dashboard metrics: < 500ms
   - List endpoints: < 1s
   - Detail endpoints: < 500ms
   - Action endpoints: < 1s

2. **Frontend Performance:**
   - Initial page load: < 2s
   - Navigation between pages: < 500ms
   - Modal open/close: < 200ms

3. **Real-time Updates:**
   - Dashboard metrics refresh: 60s interval
   - Recent actions refresh: 30s interval
   - Alerts refresh: 30s interval

---

## Security Checks

Verify the following security measures:

1. **Authentication:**
   - ✓ Cannot access admin pages without login
   - ✓ JWT token expires after configured time
   - ✓ Refresh token rotation works

2. **Authorization:**
   - ✓ Non-admin users cannot access admin endpoints
   - ✓ Admin actions require staff/superuser privileges

3. **Data Protection:**
   - ✓ Sensitive user data is masked in UI
   - ✓ Passwords are never displayed
   - ✓ HTTPS used in production

4. **Audit Trail:**
   - ✓ All admin actions are logged
   - ✓ Audit logs cannot be deleted
   - ✓ Audit logs include admin user identifier

---

## Success Criteria

All tests pass when:

- ✓ All workflows complete without errors
- ✓ Data updates are reflected immediately
- ✓ Audit log entries are created for all actions
- ✓ No console errors in browser
- ✓ No 4xx/5xx errors in API calls
- ✓ UI is responsive and intuitive
- ✓ Loading states display correctly
- ✓ Error messages are user-friendly
- ✓ Success notifications appear
- ✓ Cache invalidation works correctly

---

## Next Steps

After successful testing:

1. Document any bugs or issues found
2. Create tickets for improvements
3. Update this guide with any new findings
4. Consider adding automated UI tests (Playwright/Cypress)
5. Set up CI/CD pipeline for automated testing
6. Deploy to staging environment for further testing

---

## Contact

For questions or issues with testing:
- Check the main README.md
- Review the design document: `.kiro/specs/admin-management-system/design.md`
- Review the requirements: `.kiro/specs/admin-management-system/requirements.md`
