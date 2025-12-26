import requests
import json

try:
    print("Testing /api/results endpoint...")
    response = requests.get('http://127.0.0.1:5000/api/results')
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status in JSON: {data.get('status')}")
        if 'data' in data:
            print(f"Record count: {len(data['data'])}")
            print("First record sample keys:", data['data'][0].keys())
        else:
            print("No 'data' field found.")
    else:
        print(f"Error Content: {response.text}")

except Exception as e:
    print(f"Connection Failed: {e}")
