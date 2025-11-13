import requests
from datetime import datetime

def test_driver_registration_validation():
    """Test driver registration validation with fleet owner ID"""
    base_url = "https://transops-fleet.preview.emergentagent.com"
    timestamp = datetime.now().strftime('%H%M%S')
    
    print("🔍 Testing driver registration with invalid Fleet Owner ID...")
    
    # Test with invalid fleet owner ID
    invalid_driver_data = {
        "email": f"invalid_driver_{timestamp}@test.com",
        "password": "password123",
        "name": f"Invalid Driver {timestamp}",
        "role": "driver",
        "phone": "+91 9876543211",
        "fleet_owner_id": "invalid-fleet-owner-id"
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=invalid_driver_data)
    if response.status_code == 400:
        error_detail = response.json().get('detail', '')
        if 'Invalid Fleet Owner ID' in error_detail:
            print("✅ Driver registration correctly rejected with invalid Fleet Owner ID")
            print(f"   Error message: {error_detail}")
        else:
            print(f"❌ Wrong error message: {error_detail}")
            return False
    else:
        print(f"❌ Expected 400 error, got {response.status_code}")
        return False
    
    print("\n🔍 Testing driver registration without Fleet Owner ID...")
    
    # Test driver registration without fleet owner ID (should fail)
    no_owner_driver_data = {
        "email": f"no_owner_driver_{timestamp}@test.com",
        "password": "password123",
        "name": f"No Owner Driver {timestamp}",
        "role": "driver",
        "phone": "+91 9876543211"
        # No fleet_owner_id provided
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=no_owner_driver_data)
    if response.status_code == 200:
        print("✅ Driver registration allowed without Fleet Owner ID (optional field)")
    else:
        print(f"ℹ️  Driver registration without Fleet Owner ID returned: {response.status_code}")
    
    print("\n🔍 Testing valid driver registration flow...")
    
    # First register a fleet owner
    fleet_owner_data = {
        "email": f"valid_owner_{timestamp}@test.com",
        "password": "password123",
        "name": f"Valid Fleet Owner {timestamp}",
        "role": "fleet_owner",
        "phone": "+91 9876543210"
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=fleet_owner_data)
    if response.status_code != 200:
        print(f"❌ Fleet owner registration failed: {response.status_code}")
        return False
    
    fleet_owner_id = response.json()['user']['id']
    print(f"✅ Fleet owner registered with ID: {fleet_owner_id}")
    
    # Now register driver with valid fleet owner ID
    valid_driver_data = {
        "email": f"valid_driver_{timestamp}@test.com",
        "password": "password123",
        "name": f"Valid Driver {timestamp}",
        "role": "driver",
        "phone": "+91 9876543211",
        "fleet_owner_id": fleet_owner_id
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=valid_driver_data)
    if response.status_code == 200:
        driver_id = response.json()['user']['id']
        driver_fleet_owner_id = response.json()['user'].get('fleet_owner_id')
        if driver_fleet_owner_id == fleet_owner_id:
            print(f"✅ Driver registered successfully with correct Fleet Owner ID: {driver_fleet_owner_id}")
            return True
        else:
            print(f"❌ Fleet Owner ID mismatch: expected {fleet_owner_id}, got {driver_fleet_owner_id}")
            return False
    else:
        print(f"❌ Valid driver registration failed: {response.status_code}")
        return False

if __name__ == "__main__":
    success = test_driver_registration_validation()
    print(f"\n{'✅ Driver registration validation test PASSED' if success else '❌ Driver registration validation test FAILED'}")