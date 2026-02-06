#!/usr/bin/env python
"""
Quick API test script
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_metals_endpoint():
    """Test metals endpoint (no auth required)"""
    print("\n=== Testing Metals Endpoint ===")
    response = requests.get(f"{BASE_URL}/trading/metals/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} metals:")
        for metal in data:
            print(f"  - {metal['name']} ({metal['symbol']}): ${metal['current_price']}")
    else:
        print(f"Error: {response.text}")

def test_products_endpoint():
    """Test products endpoint (no auth required)"""
    print("\n=== Testing Products Endpoint ===")
    response = requests.get(f"{BASE_URL}/trading/products/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} products:")
        for product in data[:3]:  # Show first 3
            print(f"  - {product['name']}: {product['weight_oz']}oz")
    else:
        print(f"Error: {response.text}")

def test_vaults_endpoint():
    """Test vaults endpoint (no auth required)"""
    print("\n=== Testing Vaults Endpoint ===")
    response = requests.get(f"{BASE_URL}/vaults/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} vaults:")
        for vault in data:
            print(f"  - {vault['city']}, {vault['country']}: {vault['storage_fee_percent']}% fee")
    else:
        print(f"Error: {response.text}")

def test_registration():
    """Test user registration"""
    print("\n=== Testing User Registration ===")
    user_data = {
        "email": "test@preciousvault.com",
        "username": "testuser",
        "password": "TestPass123!",
        "password2": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    response = requests.post(f"{BASE_URL}/auth/users/", json=user_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✓ User registered successfully")
        return True
    else:
        print(f"Error: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Precious Vault API Test")
    print("=" * 50)
    
    try:
        test_metals_endpoint()
        test_products_endpoint()
        test_vaults_endpoint()
        test_registration()
        
        print("\n" + "=" * 50)
        print("✓ All tests completed!")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to API server")
        print("Make sure the server is running: docker-compose up web")
    except Exception as e:
        print(f"\n✗ Error: {e}")
