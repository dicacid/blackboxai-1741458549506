import requests
import json
from datetime import datetime

def print_response(response):
    """Pretty print the API response"""
    print("\nStatus Code:", response.status_code)
    print("Response:")
    print(json.dumps(response.json(), indent=2))
    print("-" * 50)

# API base URL
BASE_URL = "http://localhost:5001"

def main():
    print("Cryptix API Example Usage\n")

    # 1. Get API Documentation
    print("1. Getting API Documentation:")
    response = requests.get(f"{BASE_URL}/")
    print_response(response)

    # 2. Check API Health
    print("\n2. Checking API Health:")
    response = requests.get(f"{BASE_URL}/health")
    print_response(response)

    # 3. Test Log Endpoint (GET)
    print("\n3. Testing Log Endpoint (GET):")
    response = requests.get(f"{BASE_URL}/log")
    print_response(response)

    # 4. Test Log Endpoint (POST)
    print("\n4. Testing Log Endpoint (POST):")
    test_data = {
        "event": "test_event",
        "timestamp": datetime.now().isoformat(),
        "data": {
            "user": "test_user",
            "action": "api_test"
        }
    }
    response = requests.post(
        f"{BASE_URL}/log",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    print_response(response)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API.")
        print("Make sure the API server is running (./run.sh)")
    except Exception as e:
        print(f"Error: {str(e)}")
