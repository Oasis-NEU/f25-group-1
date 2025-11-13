import requests
import json
from datetime import datetime

def test_wallet_limit_management():
    """Test wallet limit management functionality"""
    base_url = "https://transops-fleet.preview.emergentagent.com"
    
    # Register fleet owner
    timestamp = datetime.now().strftime('%H%M%S')
    fleet_owner_data = {
        "email": f"owner_limits_{timestamp}@test.com",
        "password": "password123",
        "name": f"Fleet Owner Limits {timestamp}",
        "role": "fleet_owner",
        "phone": "+91 9876543210"
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=fleet_owner_data)
    if response.status_code != 200:
        print(f"❌ Fleet owner registration failed: {response.status_code}")
        return False
    
    fleet_owner_token = response.json()['token']
    fleet_owner_id = response.json()['user']['id']
    print(f"✅ Fleet owner registered with ID: {fleet_owner_id}")
    
    # Register driver with fleet owner ID
    driver_data = {
        "email": f"driver_limits_{timestamp}@test.com",
        "password": "password123",
        "name": f"Driver Limits {timestamp}",
        "role": "driver",
        "phone": "+91 9876543211",
        "fleet_owner_id": fleet_owner_id
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=driver_data)
    if response.status_code != 200:
        print(f"❌ Driver registration failed: {response.status_code}")
        return False
    
    driver_token = response.json()['token']
    driver_id = response.json()['user']['id']
    print(f"✅ Driver registered with ID: {driver_id}")
    
    # Test wallet limit update
    headers = {'Authorization': f'Bearer {fleet_owner_token}'}
    limit_url = f"{base_url}/api/wallet/{driver_id}/limits?fuel_limit=1000&toll_limit=500&food_limit=300&lodging_limit=800&repair_limit=1200"
    
    response = requests.put(limit_url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Wallet limit update failed: {response.status_code}")
        return False
    
    print("✅ Wallet limits updated successfully")
    
    # Verify limits were set
    driver_headers = {'Authorization': f'Bearer {driver_token}'}
    response = requests.get(f"{base_url}/api/wallet", headers=driver_headers)
    if response.status_code != 200:
        print(f"❌ Failed to get wallet: {response.status_code}")
        return False
    
    wallet = response.json()
    expected_limits = {
        'fuel_limit': 1000,
        'toll_limit': 500,
        'food_limit': 300,
        'lodging_limit': 800,
        'repair_limit': 1200
    }
    
    for limit_type, expected_value in expected_limits.items():
        if wallet.get(limit_type) != expected_value:
            print(f"❌ {limit_type} mismatch: expected {expected_value}, got {wallet.get(limit_type)}")
            return False
        else:
            print(f"✅ {limit_type}: {wallet.get(limit_type)}")
    
    return True

if __name__ == "__main__":
    success = test_wallet_limit_management()
    print(f"\n{'✅ Wallet limit management test PASSED' if success else '❌ Wallet limit management test FAILED'}")