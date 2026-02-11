#!/usr/bin/env python
"""
End-to-End Test Script for Admin Management System
Tests the complete workflows from login to various admin operations
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
ADMIN_BASE_URL = f"{BASE_URL}/admin"

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class AdminE2ETest:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.test_user_id = None
        self.test_transaction_id = None
        self.test_delivery_id = None
        self.results = {
            'passed': 0,
            'failed': 0,
            'skipped': 0
        }
    
    def print_header(self, text):
        """Print a formatted header"""
        print(f"\n{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BLUE}{text}{Colors.RESET}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.RESET}")
    
    def print_test(self, name, status, message=""):
        """Print test result"""
        if status == "PASS":
            print(f"{Colors.GREEN}✓{Colors.RESET} {name}")
            self.results['passed'] += 1
        elif status == "FAIL":
            print(f"{Colors.RED}✗{Colors.RESET} {name}")
            if message:
                print(f"  {Colors.RED}Error: {message}{Colors.RESET}")
            self.results['failed'] += 1
        elif status == "SKIP":
            print(f"{Colors.YELLOW}⊘{Colors.RESET} {name} (skipped)")
            self.results['skipped'] += 1
    
    def get_headers(self, auth=True):
        """Get request headers with optional authentication"""
        headers = {'Content-Type': 'application/json'}
        if auth and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        return headers
    
    # ========== Authentication Tests ==========
    
    def test_admin_login(self):
        """Test 1: Admin user login"""
        self.print_header("Test 1: Admin Login")
        
        # Try to login with admin credentials
        login_data = {
            "email": "admin@preciousvault.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/auth/jwt/create/",
                json=login_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                self.print_test("Admin login successful", "PASS")
                return True
            else:
                self.print_test("Admin login", "FAIL", f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Admin login", "FAIL", str(e))
            return False
    
    # ========== Dashboard Tests ==========
    
    def test_dashboard_metrics(self):
        """Test 2: Dashboard metrics endpoint"""
        self.print_header("Test 2: Dashboard Metrics")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/dashboard/metrics/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total_users', 'active_users_30d', 'pending_kyc', 
                                 'pending_transactions', 'active_deliveries']
                
                missing_fields = [f for f in required_fields if f not in data]
                if missing_fields:
                    self.print_test("Dashboard metrics", "FAIL", 
                                  f"Missing fields: {', '.join(missing_fields)}")
                    return False
                
                print(f"  Total Users: {data['total_users']}")
                print(f"  Active Users (30d): {data['active_users_30d']}")
                print(f"  Pending KYC: {data['pending_kyc']}")
                print(f"  Pending Transactions: {data['pending_transactions']}")
                print(f"  Active Deliveries: {data['active_deliveries']}")
                
                self.print_test("Dashboard metrics retrieved", "PASS")
                return True
            else:
                self.print_test("Dashboard metrics", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Dashboard metrics", "FAIL", str(e))
            return False
    
    def test_dashboard_alerts(self):
        """Test 3: Dashboard alerts endpoint"""
        self.print_header("Test 3: Dashboard Alerts")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/dashboard/alerts/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Old Pending KYC: {len(data.get('old_pending_kyc', []))}")
                print(f"  Old Pending Transactions: {len(data.get('old_pending_transactions', []))}")
                
                self.print_test("Dashboard alerts retrieved", "PASS")
                return True
            else:
                self.print_test("Dashboard alerts", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Dashboard alerts", "FAIL", str(e))
            return False
    
    # ========== KYC Management Tests ==========
    
    def test_kyc_pending_list(self):
        """Test 4: List pending KYC requests"""
        self.print_header("Test 4: KYC Pending List")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/kyc/pending/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"  Found {len(results)} pending KYC requests")
                
                if len(results) > 0:
                    self.test_user_id = results[0].get('id')
                    print(f"  First user ID: {self.test_user_id}")
                
                self.print_test("KYC pending list retrieved", "PASS")
                return True
            else:
                self.print_test("KYC pending list", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("KYC pending list", "FAIL", str(e))
            return False
    
    def test_kyc_approval_workflow(self):
        """Test 5: KYC approval workflow"""
        self.print_header("Test 5: KYC Approval Workflow")
        
        if not self.test_user_id:
            self.print_test("KYC approval", "SKIP", "No pending KYC requests found")
            return False
        
        try:
            # Get user details first
            response = requests.get(
                f"{ADMIN_BASE_URL}/kyc/{self.test_user_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"  User: {user_data.get('user_email')}")
                print(f"  Current Status: {user_data.get('kyc_status')}")
                
                # Note: We won't actually approve to avoid modifying test data
                # In a real test, you would approve and verify the status change
                self.print_test("KYC detail retrieval", "PASS")
                print(f"  {Colors.YELLOW}Note: Skipping actual approval to preserve test data{Colors.RESET}")
                return True
            else:
                self.print_test("KYC approval workflow", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("KYC approval workflow", "FAIL", str(e))
            return False
    
    # ========== Transaction Management Tests ==========
    
    def test_transaction_pending_list(self):
        """Test 6: List pending transactions"""
        self.print_header("Test 6: Transaction Pending List")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/transactions/pending/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"  Found {len(results)} pending transactions")
                
                if len(results) > 0:
                    self.test_transaction_id = results[0].get('id')
                    print(f"  First transaction ID: {self.test_transaction_id}")
                
                self.print_test("Transaction pending list retrieved", "PASS")
                return True
            else:
                self.print_test("Transaction pending list", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Transaction pending list", "FAIL", str(e))
            return False
    
    def test_transaction_approval_workflow(self):
        """Test 7: Transaction approval workflow"""
        self.print_header("Test 7: Transaction Approval Workflow")
        
        if not self.test_transaction_id:
            self.print_test("Transaction approval", "SKIP", "No pending transactions found")
            return False
        
        try:
            # Get transaction details
            response = requests.get(
                f"{ADMIN_BASE_URL}/transactions/{self.test_transaction_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                tx_data = response.json()
                print(f"  Transaction Type: {tx_data.get('transaction_type')}")
                print(f"  Amount: ${tx_data.get('total_amount')}")
                print(f"  Status: {tx_data.get('status')}")
                
                self.print_test("Transaction detail retrieval", "PASS")
                print(f"  {Colors.YELLOW}Note: Skipping actual approval to preserve test data{Colors.RESET}")
                return True
            else:
                self.print_test("Transaction approval workflow", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Transaction approval workflow", "FAIL", str(e))
            return False
    
    # ========== User Management Tests ==========
    
    def test_user_search(self):
        """Test 8: User search functionality"""
        self.print_header("Test 8: User Search")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/users/search/?q=test",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"  Found {len(results)} users matching 'test'")
                
                self.print_test("User search", "PASS")
                return True
            else:
                self.print_test("User search", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("User search", "FAIL", str(e))
            return False
    
    def test_user_suspension_workflow(self):
        """Test 9: User suspension workflow"""
        self.print_header("Test 9: User Suspension Workflow")
        
        if not self.test_user_id:
            self.print_test("User suspension", "SKIP", "No test user available")
            return False
        
        try:
            # Get user details
            response = requests.get(
                f"{ADMIN_BASE_URL}/users/{self.test_user_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"  User: {user_data.get('email')}")
                print(f"  Active: {user_data.get('is_active')}")
                
                self.print_test("User detail retrieval", "PASS")
                print(f"  {Colors.YELLOW}Note: Skipping actual suspension to preserve test data{Colors.RESET}")
                return True
            else:
                self.print_test("User suspension workflow", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("User suspension workflow", "FAIL", str(e))
            return False
    
    # ========== Delivery Management Tests ==========
    
    def test_delivery_list(self):
        """Test 10: List delivery requests"""
        self.print_header("Test 10: Delivery List")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/deliveries/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"  Found {len(results)} delivery requests")
                
                if len(results) > 0:
                    self.test_delivery_id = results[0].get('id')
                    print(f"  First delivery ID: {self.test_delivery_id}")
                
                self.print_test("Delivery list retrieved", "PASS")
                return True
            else:
                self.print_test("Delivery list", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Delivery list", "FAIL", str(e))
            return False
    
    def test_delivery_status_update_workflow(self):
        """Test 11: Delivery status update workflow"""
        self.print_header("Test 11: Delivery Status Update Workflow")
        
        if not self.test_delivery_id:
            self.print_test("Delivery status update", "SKIP", "No delivery requests found")
            return False
        
        try:
            # Get delivery details
            response = requests.get(
                f"{ADMIN_BASE_URL}/deliveries/{self.test_delivery_id}/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                delivery_data = response.json()
                print(f"  Status: {delivery_data.get('status')}")
                print(f"  Carrier: {delivery_data.get('carrier', 'Not assigned')}")
                
                self.print_test("Delivery detail retrieval", "PASS")
                print(f"  {Colors.YELLOW}Note: Skipping actual status update to preserve test data{Colors.RESET}")
                return True
            else:
                self.print_test("Delivery status update workflow", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Delivery status update workflow", "FAIL", str(e))
            return False
    
    # ========== Audit Log Tests ==========
    
    def test_audit_log(self):
        """Test 12: Audit log verification"""
        self.print_header("Test 12: Audit Log Verification")
        
        try:
            response = requests.get(
                f"{ADMIN_BASE_URL}/audit/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"  Found {len(results)} audit log entries")
                
                if len(results) > 0:
                    latest = results[0]
                    print(f"  Latest action: {latest.get('action_type')}")
                    print(f"  Admin user: {latest.get('admin_user')}")
                    print(f"  Timestamp: {latest.get('timestamp')}")
                
                self.print_test("Audit log retrieved", "PASS")
                return True
            else:
                self.print_test("Audit log", "FAIL", 
                              f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.print_test("Audit log", "FAIL", str(e))
            return False
    
    # ========== Main Test Runner ==========
    
    def run_all_tests(self):
        """Run all end-to-end tests"""
        print(f"\n{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BLUE}Admin Management System - End-to-End Tests{Colors.RESET}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Authentication
        if not self.test_admin_login():
            print(f"\n{Colors.RED}✗ Authentication failed. Cannot proceed with tests.{Colors.RESET}")
            return False
        
        # Dashboard tests
        self.test_dashboard_metrics()
        self.test_dashboard_alerts()
        
        # KYC tests
        self.test_kyc_pending_list()
        self.test_kyc_approval_workflow()
        
        # Transaction tests
        self.test_transaction_pending_list()
        self.test_transaction_approval_workflow()
        
        # User management tests
        self.test_user_search()
        self.test_user_suspension_workflow()
        
        # Delivery tests
        self.test_delivery_list()
        self.test_delivery_status_update_workflow()
        
        # Audit log tests
        self.test_audit_log()
        
        # Print summary
        self.print_summary()
        
        return self.results['failed'] == 0
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BLUE}Test Summary{Colors.RESET}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.GREEN}Passed: {self.results['passed']}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.results['failed']}{Colors.RESET}")
        print(f"{Colors.YELLOW}Skipped: {self.results['skipped']}{Colors.RESET}")
        print(f"Total: {sum(self.results.values())}")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.RESET}\n")

def main():
    """Main entry point"""
    tester = AdminE2ETest()
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except requests.exceptions.ConnectionError:
        print(f"\n{Colors.RED}✗ Error: Could not connect to API server{Colors.RESET}")
        print("Make sure the backend is running:")
        print("  docker-compose up backend")
        print("  OR")
        print("  cd fortress-vault-backend && python manage.py runserver")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}✗ Unexpected error: {e}{Colors.RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
