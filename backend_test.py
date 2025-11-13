import requests
import sys
import json
from datetime import datetime

class TransOpsAPITester:
    def __init__(self, base_url="https://transops-fleet.preview.emergentagent.com"):
        self.base_url = base_url
        self.fleet_owner_token = None
        self.driver_token = None
        self.fleet_owner_id = None
        self.driver_id = None
        self.vehicle_id = None
        self.trip_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_fleet_owner_registration(self):
        """Test fleet owner registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        data = {
            "email": f"owner{timestamp}@test.com",
            "password": "password123",
            "name": f"Fleet Owner {timestamp}",
            "role": "fleet_owner",
            "phone": "+91 9876543210"
        }
        
        success, response = self.run_test(
            "Fleet Owner Registration",
            "POST",
            "auth/register",
            200,
            data
        )
        
        if success and 'token' in response:
            self.fleet_owner_token = response['token']
            self.fleet_owner_id = response['user']['id']
            return True
        return False

    def test_driver_registration(self):
        """Test driver registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        data = {
            "email": f"driver{timestamp}@test.com",
            "password": "password123",
            "name": f"Driver {timestamp}",
            "role": "driver",
            "phone": "+91 9876543211",
            "fleet_owner_id": self.fleet_owner_id
        }
        
        success, response = self.run_test(
            "Driver Registration",
            "POST",
            "auth/register",
            200,
            data
        )
        
        if success and 'token' in response:
            self.driver_token = response['token']
            self.driver_id = response['user']['id']
            return True
        return False

    def test_fleet_owner_login(self):
        """Test fleet owner login"""
        data = {
            "email": f"owner@test.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Fleet Owner Login",
            "POST",
            "auth/login",
            200,
            data
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats for fleet owner"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        success, response = self.run_test(
            "Fleet Owner Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            headers=headers
        )
        
        if success:
            required_fields = ['total_trips', 'total_expenses', 'active_trips', 'total_vehicles', 'total_drivers']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Dashboard Stats - {field} field", False, f"Missing {field}")
                    return False
                else:
                    self.log_test(f"Dashboard Stats - {field} field", True)
        
        return success

    def test_create_vehicle(self):
        """Test vehicle creation"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        data = {
            "registration_number": "MH-01-AB-1234",
            "vehicle_type": "truck",
            "capacity": 10.0,
            "model": "Tata LPT 1918"
        }
        
        success, response = self.run_test(
            "Create Vehicle",
            "POST",
            "vehicles",
            200,
            data,
            headers
        )
        
        if success and 'id' in response:
            self.vehicle_id = response['id']
            return True
        return False

    def test_get_vehicles(self):
        """Test get vehicles"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        return self.run_test(
            "Get Vehicles",
            "GET",
            "vehicles",
            200,
            headers=headers
        )

    def test_create_trip(self):
        """Test trip creation"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        data = {
            "driver_id": self.driver_id,
            "vehicle_id": self.vehicle_id,
            "origin": "Mumbai",
            "destination": "Delhi",
            "cargo_details": "Electronics",
            "estimated_distance": 1400
        }
        
        success, response = self.run_test(
            "Create Trip",
            "POST",
            "trips",
            200,
            data,
            headers
        )
        
        if success and 'id' in response:
            self.trip_id = response['id']
            return True
        return False

    def test_get_trips(self):
        """Test get trips"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        return self.run_test(
            "Get Trips",
            "GET",
            "trips",
            200,
            headers=headers
        )

    def test_ai_route_optimization(self):
        """Test AI route optimization"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        data = {
            "origin": "Mumbai",
            "destination": "Delhi",
            "vehicle_type": "truck",
            "cargo_details": "Electronics"
        }
        
        success, response = self.run_test(
            "AI Route Optimization",
            "POST",
            "ai/route-optimize",
            200,
            data,
            headers
        )
        
        if success and 'route_suggestion' in response:
            self.log_test("AI Route Optimization - Response Content", True)
            return True
        elif success:
            self.log_test("AI Route Optimization - Response Content", False, "Missing route_suggestion")
        return success

    def test_create_return_load(self):
        """Test return load creation"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        data = {
            "origin": "Delhi",
            "destination": "Mumbai",
            "cargo_type": "Construction Materials",
            "weight": 5000,
            "offered_price": 25000,
            "pickup_date": "2025-01-15"
        }
        
        return self.run_test(
            "Create Return Load",
            "POST",
            "return-loads",
            200,
            data,
            headers
        )

    def test_get_return_loads(self):
        """Test get return loads"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        return self.run_test(
            "Get Return Loads",
            "GET",
            "return-loads",
            200,
            headers=headers
        )

    def test_driver_wallet(self):
        """Test driver wallet"""
        headers = {'Authorization': f'Bearer {self.driver_token}'}
        success, response = self.run_test(
            "Driver Wallet",
            "GET",
            "wallet",
            200,
            headers=headers
        )
        
        if success:
            required_fields = ['balance', 'fuel_limit', 'toll_limit', 'food_limit', 'lodging_limit', 'repair_limit']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Wallet - {field} field", False, f"Missing {field}")
                else:
                    self.log_test(f"Wallet - {field} field", True)
        
        return success

    def test_driver_dashboard_stats(self):
        """Test driver dashboard stats"""
        headers = {'Authorization': f'Bearer {self.driver_token}'}
        success, response = self.run_test(
            "Driver Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            headers=headers
        )
        
        if success:
            required_fields = ['total_trips', 'total_expenses', 'wallet_balance', 'reward_points']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Driver Stats - {field} field", False, f"Missing {field}")
                else:
                    self.log_test(f"Driver Stats - {field} field", True)
        
        return success

    def test_create_expense(self):
        """Test expense creation"""
        headers = {'Authorization': f'Bearer {self.driver_token}'}
        data = {
            "trip_id": self.trip_id,
            "driver_id": self.driver_id,
            "category": "fuel",
            "amount": 500.0,
            "description": "Fuel at HP Station",
            "location": "Mumbai - Pune Highway"
        }
        
        return self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data,
            headers
        )

    def test_get_expenses(self):
        """Test get expenses"""
        headers = {'Authorization': f'Bearer {self.driver_token}'}
        return self.run_test(
            "Get Expenses",
            "GET",
            "expenses",
            200,
            headers=headers
        )

    def test_payment_checkout(self):
        """Test payment checkout"""
        headers = {'Authorization': f'Bearer {self.fleet_owner_token}'}
        data = {"package": "small"}
        
        success, response = self.run_test(
            "Payment Checkout",
            "POST",
            "payments/checkout",
            200,
            data,
            headers
        )
        
        if success and 'url' in response and 'session_id' in response:
            self.log_test("Payment Checkout - Response Content", True)
            return True
        elif success:
            self.log_test("Payment Checkout - Response Content", False, "Missing url or session_id")
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting TransOps API Testing...")
        print("=" * 50)
        
        # Test basic connectivity
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed - stopping tests")
            return False
        
        # Test authentication
        if not self.test_fleet_owner_registration():
            print("❌ Fleet owner registration failed - stopping tests")
            return False
            
        if not self.test_driver_registration():
            print("❌ Driver registration failed - stopping tests")
            return False
        
        # Test dashboard
        self.test_dashboard_stats()
        
        # Test vehicle management
        if not self.test_create_vehicle():
            print("❌ Vehicle creation failed - some tests may fail")
        else:
            self.test_get_vehicles()
        
        # Test trip management
        if not self.test_create_trip():
            print("❌ Trip creation failed - some tests may fail")
        else:
            self.test_get_trips()
        
        # Test AI features
        self.test_ai_route_optimization()
        
        # Test return loads
        self.test_create_return_load()
        self.test_get_return_loads()
        
        # Test driver features
        self.test_driver_wallet()
        self.test_driver_dashboard_stats()
        
        # Test expense management
        self.test_create_expense()
        self.test_get_expenses()
        
        # Test payment
        self.test_payment_checkout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TransOpsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())