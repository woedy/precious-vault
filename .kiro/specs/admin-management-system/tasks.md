# Implementation Plan: Admin Management System

## Overview

This implementation plan breaks down the Admin Management System into discrete coding tasks. The system consists of a Django backend (admin_api app) and a separate React frontend (precious-vault-admin). Tasks are organized to build incrementally, with testing integrated throughout. Each task builds on previous work, ensuring no orphaned code.

## Tasks

- [x] 1. Backend: Setup and authentication infrastructure
  - [x] 1.1 Configure admin_api URL routing and permissions
    - Add URL patterns to `precious-vault-backend/admin_api/urls.py` for all admin endpoints
    - Create `IsAdminUser` permission class in `admin_api/permissions.py` that checks `is_staff` or `is_superuser`
    - Register admin_api URLs in main `config/urls.py` under `/api/admin/`
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 1.2 Create audit logging utility function
    - Implement `create_audit_log()` function in `admin_api/utils.py` that creates AdminAction records
    - Function should accept admin_user, action_type, target_model, target_id, and optional details dict
    - _Requirements: 6.1_
  
  - [ ]* 1.3 Write property tests for authentication and authorization
    - **Property 27: JWT authentication requirement**
    - **Property 28: Admin permission enforcement**
    - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 2. Backend: KYC management endpoints
  - [x] 2.1 Implement KYC serializers
    - Create `AdminKYCSerializer` in `admin_api/serializers.py` with user details and documents
    - Create `IdentityDocumentSerializer` for document details
    - Include user_email, user_name, kyc_status, documents, created_at fields
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Implement KYCManagementViewSet
    - Create `KYCManagementViewSet` in `admin_api/views.py` with IsAdminUser permission
    - Implement `pending()` action to list users with kyc_status='pending'
    - Implement `retrieve()` action to get single user KYC details with documents
    - Implement `history()` action to get user's KYC submission history
    - _Requirements: 1.1, 1.2, 1.6_
  
  - [x] 2.3 Implement KYC approve and reject actions
    - Add `approve()` action that updates user kyc_status to 'verified'
    - Add `reject()` action that requires reason parameter and updates status
    - Both actions should call `create_audit_log()` utility
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ]* 2.4 Write property tests for KYC management
    - **Property 1: Pending KYC filtering**
    - **Property 2: KYC approval state transition**
    - **Property 3: KYC rejection requires reason**
    - **Property 4: KYC history preservation**
    - **Property 25: Universal audit logging** (KYC actions)
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6, 6.1**

- [x] 3. Backend: Transaction management endpoints
  - [x] 3.1 Implement transaction serializers
    - Create `AdminTransactionSerializer` in `admin_api/serializers.py`
    - Include user_email, metal_name, transaction details, status, notes
    - Create `TransactionNoteSerializer` for note details
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 3.2 Implement TransactionManagementViewSet
    - Create `TransactionManagementViewSet` in `admin_api/views.py` with IsAdminUser permission
    - Implement `pending()` action to list transactions with status='pending' ordered by amount and age
    - Implement `retrieve()` action to get transaction details with notes
    - Implement `list()` action with filtering by status, type, user, date range, amount threshold
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [x] 3.3 Implement transaction approve and reject actions
    - Add `approve()` action that updates status to 'completed' and executes transaction logic
    - Add `reject()` action that requires reason, updates status to 'failed', and refunds held funds
    - Both actions should call `create_audit_log()` utility
    - _Requirements: 2.3, 2.4, 2.7_
  
  - [x] 3.4 Implement transaction notes functionality
    - Add `notes()` action to create TransactionNote records
    - Link note to transaction and admin user with timestamp
    - _Requirements: 2.5_
  
  - [ ]* 3.5 Write property tests for transaction management
    - **Property 5: Pending transaction filtering and ordering**
    - **Property 6: Transaction approval execution**
    - **Property 7: Transaction rejection with refund**
    - **Property 8: Transaction note persistence**
    - **Property 9: Transaction filtering**
    - **Property 25: Universal audit logging** (transaction actions)
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1**

- [x] 4. Checkpoint - Ensure backend KYC and transaction tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Backend: User management endpoints
  - [x] 5.1 Implement user management serializers
    - Create `AdminUserDetailSerializer` in `admin_api/serializers.py`
    - Include email, name, kyc_status, is_active, wallet_balance, portfolio, recent_transactions
    - Implement data masking for sensitive fields (partial email, phone)
    - _Requirements: 3.2, 3.7_
  
  - [x] 5.2 Implement UserManagementViewSet
    - Create `UserManagementViewSet` in `admin_api/views.py` with IsAdminUser permission
    - Implement `list()` action with pagination
    - Implement `retrieve()` action to get user details
    - Implement `search()` action to search by username, email, or user ID
    - Implement `activity()` action to get user activity timeline
    - _Requirements: 3.1, 3.2, 3.6, 9.2_
  
  - [x] 5.3 Implement user account management actions
    - Add `suspend()` action that sets is_active=False and requires reason
    - Add `activate()` action that sets is_active=True
    - Add `adjust_balance()` action that requires amount and reason, creates adjustment transaction
    - All actions should call `create_audit_log()` utility
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ]* 5.4 Write property tests for user management
    - **Property 10: User search multi-field matching**
    - **Property 11: User suspension authorization effect**
    - **Property 12: User activation round-trip**
    - **Property 13: Balance adjustment with transaction**
    - **Property 14: User activity aggregation**
    - **Property 15: Sensitive data masking**
    - **Property 25: Universal audit logging** (user actions)
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 9.2**

- [x] 6. Backend: Delivery management endpoints
  - [x] 6.1 Implement delivery serializers
    - Create `AdminDeliverySerializer` in `admin_api/serializers.py`
    - Include user_email, status, carrier, tracking_number, shipping_address, items, history
    - Create `DeliveryItemSerializer` and `DeliveryHistorySerializer`
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.2 Implement DeliveryManagementViewSet
    - Create `DeliveryManagementViewSet` in `admin_api/views.py` with IsAdminUser permission
    - Implement `list()` action with filtering by status, user, date range, carrier
    - Implement `retrieve()` action to get delivery details
    - Implement `history()` action to get delivery history events
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [x] 6.3 Implement delivery status and carrier actions
    - Add `update_status()` action that updates status and creates DeliveryHistory entry
    - Add `assign_carrier()` action that updates carrier and tracking_number fields
    - Both actions should call `create_audit_log()` utility
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ]* 6.4 Write property tests for delivery management
    - **Property 16: Delivery status history creation**
    - **Property 17: Delivery carrier assignment**
    - **Property 18: Delivery filtering**
    - **Property 25: Universal audit logging** (delivery actions)
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.6, 6.1**

- [x] 7. Backend: Dashboard and metrics endpoints
  - [x] 7.1 Implement dashboard serializers
    - Create `DashboardMetricsSerializer` in `admin_api/serializers.py`
    - Include total_users, active_users_30d, pending_kyc, pending_transactions, active_deliveries, transaction_volume, trends
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.2 Implement dashboard views with caching
    - Create `DashboardMetricsView` in `admin_api/views.py` with IsAdminUser permission
    - Implement metrics calculation with Redis caching (60 second TTL)
    - Create `DashboardAlertsView` to return items requiring attention (old pending items)
    - Create `DashboardRecentActionsView` to return recent audit log entries
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 7.3 Implement vault inventory and transaction volume endpoints
    - Create `VaultInventoryView` to aggregate vault assets by metal type
    - Create `TransactionVolumeView` to calculate daily, weekly, monthly totals
    - Create `MetalPricesView` to return current metal prices
    - _Requirements: 5.5, 5.6, 5.7_
  
  - [ ]* 7.4 Write property tests for dashboard metrics
    - **Property 19: Dashboard metrics calculation**
    - **Property 20: Metric trend calculation**
    - **Property 21: Audit log chronological ordering**
    - **Property 22: Alert generation by age threshold**
    - **Property 23: Vault inventory aggregation**
    - **Property 24: Transaction volume aggregation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7**

- [x] 8. Backend: Audit log endpoints
  - [x] 8.1 Implement audit log ViewSet
    - Create `AuditLogViewSet` in `admin_api/views.py` with IsAdminUser permission
    - Implement `list()` action with filtering by action_type, admin_user, date_range, target_object
    - Implement `retrieve()` action to get audit log details
    - Order results by timestamp descending
    - _Requirements: 6.2_
  
  - [ ]* 8.2 Write property tests for audit log
    - **Property 26: Audit log filtering**
    - **Validates: Requirements 6.2**

- [x] 9. Backend: Bulk operations
  - [x] 9.1 Implement bulk KYC operations
    - Add `bulk_approve()` action to KYCManagementViewSet
    - Add `bulk_reject()` action to KYCManagementViewSet
    - Validate maximum 50 items per request
    - Handle partial failures and return summary
    - Create audit log entries for successful operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 9.2 Write property tests for bulk operations
    - **Property 31: Bulk KYC operations**
    - **Property 32: Bulk operation partial failure handling**
    - **Property 33: Bulk operation size limit**
    - **Property 34: Bulk operation audit logging**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 10. Backend: Pagination and table utilities
  - [x] 10.1 Implement pagination for all list endpoints
    - Configure DRF pagination settings for consistent page sizes
    - Ensure all list endpoints support pagination parameters
    - _Requirements: 7.3_
  
  - [ ]* 10.2 Write property tests for pagination
    - **Property 29: Table pagination consistency**
    - **Validates: Requirements 7.3**

- [x] 11. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend: Project setup and authentication
  - [x] 12.1 Initialize admin frontend project
    - Create `precious-vault-admin/` directory
    - Initialize React + TypeScript + Vite project
    - Install dependencies: react-router-dom, @tanstack/react-query, axios, zod, react-hook-form
    - Install Tailwind CSS and configure
    - Install shadcn/ui CLI and initialize
    - Configure path alias `@/` to `src/`
    - _Requirements: 7.1, 7.5_
  
  - [x] 12.2 Create API client and authentication utilities
    - Create `src/lib/api.ts` with Axios instance configured for `/api/admin/` base URL
    - Add JWT token interceptor to attach Authorization header
    - Add response interceptor for error handling
    - Create `src/lib/auth.ts` with token storage utilities (localStorage)
    - _Requirements: 6.3, 7.1_
  
  - [x] 12.3 Create AuthContext and protected routes
    - Create `src/context/AuthContext.tsx` with login, logout, and auth state
    - Implement login function that calls `/api/auth/jwt/create/` and stores token
    - Create `ProtectedRoute` component that checks auth and redirects to login
    - _Requirements: 7.1_
  
  - [x] 12.4 Create login page
    - Create `src/pages/LoginPage.tsx` with email and password form
    - Use React Hook Form with Zod validation
    - Display loading state and error messages
    - Redirect to dashboard on successful login
    - _Requirements: 7.1, 7.6_
  
  - [ ]* 12.5 Write unit tests for authentication
    - Test login form validation
    - Test successful login flow
    - Test error handling
    - Test protected route redirect
    - **Validates: Requirements 7.1, 7.6**

- [x] 13. Frontend: Layout and navigation
  - [x] 13.1 Create admin layout component
    - Create `src/components/layout/AdminLayout.tsx` with sidebar and header
    - Add navigation links to Dashboard, KYC, Transactions, Users, Deliveries, Audit Log
    - Display admin user info in header with logout button
    - Make layout responsive for desktop and tablet
    - _Requirements: 7.2, 7.7_
  
  - [x] 13.2 Create shared UI components
    - Create `src/components/StatusBadge.tsx` for color-coded status display
    - Create `src/components/MetricCard.tsx` for dashboard metrics
    - Create `src/components/DataTable.tsx` for reusable tables with sorting and pagination
    - Create `src/components/ActionModal.tsx` for approve/reject actions
    - _Requirements: 7.3, 7.4_
  
  - [x] 13.3 Configure React Router
    - Create `src/App.tsx` with router configuration
    - Define routes for all pages (Dashboard, KYC, Transactions, Users, Deliveries, Audit Log, Login)
    - Wrap protected routes with ProtectedRoute component
    - _Requirements: 7.2_

- [x] 14. Frontend: Dashboard page
  - [x] 14.1 Create dashboard hook
    - Create `src/hooks/useDashboard.ts` with TanStack Query hooks
    - Implement queries for metrics, recent actions, and alerts
    - Configure 60 second refetch interval for metrics, 30 seconds for actions/alerts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.3_
  
  - [x] 14.2 Create dashboard page
    - Create `src/pages/DashboardPage.tsx` with metric cards grid
    - Display total users, active users, pending KYC, pending transactions, active deliveries
    - Show trend indicators (up/down arrows with percentages)
    - Display recent admin actions list
    - Display alerts section for items requiring attention
    - Add quick links to pending items
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  


- [x] 15. Frontend: KYC management page
  - [x] 15.1 Create KYC management hook
    - Create `src/hooks/useKYCManagement.ts` with TanStack Query hooks
    - Implement queries for pending KYC list and KYC details
    - Implement mutations for approve and reject actions
    - Configure cache invalidation on mutations
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 15.2 Create KYC management page
    - Create `src/pages/KYCManagementPage.tsx` with pending KYC table
    - Display user email, name, submission date, status
    - Add "View Details" button for each request
    - _Requirements: 1.1_
  
  - [x] 15.3 Create KYC detail modal
    - Create `src/components/kyc/KYCDetailModal.tsx`
    - Display user information and KYC status
    - Create `src/components/kyc/DocumentViewer.tsx` for identity documents
    - Add zoom, download, and full-screen capabilities for documents
    - Display KYC history timeline
    - Add approve and reject buttons with reason input for rejection
    - _Requirements: 1.2, 1.3, 1.4, 1.6_
  
  - [ ]* 15.4 Write unit tests for KYC management
    - Test KYC table rendering
    - Test document viewer functionality
    - Test approve/reject actions
    - Test reason validation for rejection
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

- [x] 16. Checkpoint - Ensure frontend builds and runs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Frontend: Transaction management page
  - [x] 17.1 Create transaction management hook
    - Create `src/hooks/useTransactionManagement.ts` with TanStack Query hooks
    - Implement queries for pending transactions, transaction details, and filtered transactions
    - Implement mutations for approve, reject, and add note actions
    - Configure cache invalidation on mutations
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  
  - [x] 17.2 Create transaction management page
    - Create `src/pages/TransactionManagementPage.tsx` with transactions table
    - Display transaction ID, user, type, metal, quantity, amount, status, date
    - Add filter controls for status, type, user, date range, amount threshold
    - Add search functionality
    - Preserve filter state in URL query parameters
    - _Requirements: 2.1, 2.6, 9.2, 9.3_
  
  - [x] 17.3 Create transaction detail modal
    - Create `src/components/transactions/TransactionDetailModal.tsx`
    - Display complete transaction details including user info
    - Display transaction notes list
    - Add form to add new note
    - Add approve and reject buttons with reason input for rejection
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 17.4 Write unit tests for transaction management
    - Test transaction table rendering
    - Test filtering functionality
    - Test approve/reject actions
    - Test note addition
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

- [x] 18. Frontend: User management page
  - [x] 18.1 Create user management hook
    - Create `src/hooks/useUserManagement.ts` with TanStack Query hooks
    - Implement queries for user search, user details, and user activity
    - Implement mutations for suspend, activate, and adjust balance actions
    - Configure cache invalidation on mutations
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  
  - [x] 18.2 Create user management page
    - Create `src/pages/UserManagementPage.tsx` with user search interface
    - Add search input that searches by username, email, or user ID
    - Display user list table with email, name, KYC status, account status, join date
    - Add pagination controls
    - _Requirements: 3.1, 9.2_
  
  - [x] 18.3 Create user detail modal
    - Create `src/components/users/UserDetailModal.tsx`
    - Display complete user information with masked sensitive data
    - Display wallet balance and portfolio holdings
    - Display recent transactions
    - Display activity timeline
    - Add suspend/activate buttons with reason input for suspension
    - Add balance adjustment form with amount and reason inputs
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 18.4 Write unit tests for user management
    - Test user search functionality
    - Test user detail display
    - Test suspend/activate actions
    - Test balance adjustment
    - Test data masking
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

- [x] 19. Frontend: Delivery management page
  - [x] 19.1 Create delivery management hook
    - Create `src/hooks/useDeliveryManagement.ts` with TanStack Query hooks
    - Implement queries for delivery list, delivery details, and delivery history
    - Implement mutations for update status and assign carrier actions
    - Configure cache invalidation on mutations
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [x] 19.2 Create delivery management page
    - Create `src/pages/DeliveryManagementPage.tsx` with deliveries table
    - Display delivery ID, user, status, carrier, tracking number, date
    - Add filter controls for status, user, date range, carrier
    - _Requirements: 4.1, 4.6_
  
  - [x] 19.3 Create delivery detail modal
    - Create `src/components/delivery/DeliveryDetailModal.tsx`
    - Display complete delivery details including items and shipping address
    - Display delivery history timeline
    - Add status update form with status dropdown
    - Add carrier assignment form with carrier and tracking number inputs
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ]* 19.4 Write unit tests for delivery management
    - Test delivery table rendering
    - Test filtering functionality
    - Test status update
    - Test carrier assignment
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**

- [x] 20. Frontend: Audit log page
  - [x] 20.1 Create audit log hook
    - Create `src/hooks/useAuditLog.ts` with TanStack Query hooks
    - Implement queries for audit log list with filtering
    - _Requirements: 6.2_
  
  - [x] 20.2 Create audit log page
    - Create `src/pages/AuditLogPage.tsx` with audit log table
    - Display timestamp, admin user, action type, target object, details
    - Add filter controls for action type, admin user, date range, target object
    - Add pagination controls
    - _Requirements: 6.2_
  
  - [ ]* 20.3 Write unit tests for audit log
    - Test audit log table rendering
    - Test filtering functionality
    - **Validates: Requirements 6.2**

- [x] 21. Frontend: Bulk operations
  - [x] 21.1 Add bulk selection to KYC table
    - Add checkboxes to KYC table for row selection
    - Add "Bulk Approve" and "Bulk Reject" buttons
    - Limit selection to 50 items
    - Display selection count
    - _Requirements: 10.1, 10.4_
  
  - [x] 21.2 Implement bulk operation handling
    - Create bulk approve/reject mutations in useKYCManagement hook
    - Display progress indicator during bulk operations
    - Handle partial failures and display summary
    - Show which items succeeded and which failed with reasons
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 21.3 Write unit tests for bulk operations
    - Test bulk selection
    - Test bulk approve/reject
    - Test size limit validation
    - Test partial failure handling
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 22. Frontend: Error handling and loading states
  - [x] 22.1 Implement global error handling
    - Create error boundary component for React errors
    - Add toast notifications for API errors using Sonner
    - Display user-friendly error messages
    - _Requirements: 7.4, 8.5_
  
  - [x] 22.2 Add loading states to all pages
    - Display skeleton loaders for tables and cards
    - Show loading spinners for actions
    - Disable buttons during mutations
    - _Requirements: 7.4_
  
  - [ ]* 22.3 Write unit tests for error handling
    - Test error boundary
    - Test API error display
    - Test loading states
    - **Validates: Requirements 7.4, 8.5**

- [x] 23. Frontend: Form validation
  - [x] 23.1 Create Zod schemas for all forms
    - Create schemas for login, KYC rejection, transaction rejection, balance adjustment, etc.
    - Define validation rules matching backend requirements
    - _Requirements: 7.6_
  
  - [x] 23.2 Integrate validation with React Hook Form
    - Use Zod resolver in all forms
    - Display field-specific error messages
    - Prevent submission of invalid forms
    - _Requirements: 7.6_
  
  - [ ]* 23.3 Write property tests for form validation
    - **Property 30: Form input validation**
    - **Validates: Requirements 7.6**

- [x] 24. Integration: Wire frontend to backend
  - [x] 24.1 Configure CORS in Django backend
    - Add admin frontend origin to CORS_ALLOWED_ORIGINS
    - Configure CORS headers for admin endpoints
    - _Requirements: 6.3_
  
  - [x] 24.2 Test end-to-end workflows
    - Test login → dashboard → KYC approval workflow
    - Test transaction approval workflow
    - Test user suspension workflow
    - Test delivery status update workflow
    - Verify audit log entries are created
    - _Requirements: All_
  
  - [ ]* 24.3 Write integration tests
    - Test complete admin workflows
    - Test cache invalidation
    - Test optimistic updates
    - **Validates: Requirements 1.1-10.5**

- [x] 25. Deployment: Docker configuration
  - [x] 25.1 Create Dockerfile for admin frontend
    - Create `precious-vault-admin/Dockerfile` with multi-stage build
    - Build static assets with Vite
    - Serve with Nginx
    - _Requirements: 7.7_
  
  - [x] 25.2 Update docker-compose.yml
    - Add admin frontend service
    - Configure port mapping (e.g., 3001)
    - Add environment variables for API URL
    - _Requirements: 7.7_
  
  - [x] 25.3 Update backend URL configuration
    - Ensure admin_api URLs are properly registered
    - Test all endpoints are accessible
    - _Requirements: 6.3_

- [ ] 26. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend tasks (1-11) can be developed independently from frontend tasks (12-24)
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and UI behavior
- Integration tests validate complete workflows across frontend and backend
- All admin actions must create audit log entries for compliance
- Use existing Django models (User, Transaction, DeliveryRequest) - no new models needed
- Admin frontend is a separate React app in `precious-vault-admin/` directory
- Backend endpoints are under `/api/admin/` prefix
- JWT authentication is shared with main platform
