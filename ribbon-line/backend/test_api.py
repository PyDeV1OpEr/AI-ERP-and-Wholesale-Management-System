from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    print(f"Health check status: {response.status_code}")
    print(f"Health check response: {response.json()}")
    assert response.status_code == 200

def test_create_customer():
    payload = {
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        "address": "123 Main St",
        "status": "ACTIVE"
    }
    response = client.post("/customers", json=payload)
    print(f"Create customer status: {response.status_code}")
    print(f"Create customer response: {response.json()}")
    assert response.status_code == 201
    return response.json()["id"]

def test_get_customers():
    response = client.get("/customers")
    print(f"Get customers status: {response.status_code}")
    print(f"Get customers response: {response.json()}")
    assert response.status_code == 200

if __name__ == "__main__":
    test_health()
    print("\n" + "="*50 + "\n")
    customer_id = test_create_customer()
    print("\n" + "="*50 + "\n")
    test_get_customers()
    print("\n✅ All tests passed!")
