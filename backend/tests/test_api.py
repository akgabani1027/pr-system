import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.services.seed import seed_database
from app.core.database import database

async def init_test_db():
    await database.connect()
    await seed_database()

@pytest.mark.asyncio
async def test_health_and_root():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert "docs" in data

        health = await client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_flow():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login with demo employee
        res = await client.post("/api/auth/login", json={
            "email": "employee@prsystem.com",
            "password": "password123"
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "employee@prsystem.com"
        assert data["user"]["role"] == "employee"
        emp_token = data["access_token"]

        # 2. Get /me
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {emp_token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "employee@prsystem.com"

        # 3. Invalid login
        bad_login = await client.post("/api/auth/login", json={
            "email": "employee@prsystem.com",
            "password": "wrongpassword"
        })
        assert bad_login.status_code == 401

@pytest.mark.asyncio
async def test_pr_lifecycle_and_approval_flow():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get tokens for employee, manager, and admin
        emp_login = await client.post("/api/auth/login", json={"email": "employee@prsystem.com", "password": "password123"})
        emp_token = emp_login.json()["access_token"]
        
        mgr_login = await client.post("/api/auth/login", json={"email": "manager@prsystem.com", "password": "password123"})
        mgr_token = mgr_login.json()["access_token"]

        adm_login = await client.post("/api/auth/login", json={"email": "admin@prsystem.com", "password": "password123"})
        adm_token = adm_login.json()["access_token"]

        # 1. Employee creates PR
        new_pr_payload = {
            "title": "Cloud Server Scaling Cluster",
            "description": "Additional Kubernetes nodes for load spike testing.",
            "department": "Engineering",
            "category": "Software & Subscriptions",
            "priority": "High",
            "currency": "USD",
            "items": [
                {
                    "item_name": "Compute Instance c6i.4xlarge (Annual)",
                    "quantity": 2,
                    "unit_price": 2400.00,
                    "specification": "Dedicated AWS Node"
                }
            ],
            "justification": "Required for Q4 scalability benchmarking.",
            "vendor_name": "Amazon Web Services"
        }
        create_res = await client.post(
            "/api/prs", 
            json=new_pr_payload, 
            headers={"Authorization": f"Bearer {emp_token}"}
        )
        assert create_res.status_code == 201, create_res.text
        pr_data = create_res.json()
        pr_id = pr_data["id"]
        assert pr_data["status"] == "Pending Manager Approval"
        assert pr_data["estimated_total_cost"] == 4800.00
        assert pr_data["pr_number"].startswith("PR-")

        # 2. Manager approves (Tier 1)
        mgr_approve = await client.post(
            f"/api/prs/{pr_id}/action",
            json={"action": "approve", "comment": "Approved by Engineering Manager"},
            headers={"Authorization": f"Bearer {mgr_token}"}
        )
        assert mgr_approve.status_code == 200, mgr_approve.text
        assert mgr_approve.json()["status"] == "Pending Admin Approval"
        assert mgr_approve.json()["manager_approval"]["user_name"] == "Alex Rivera (Manager)"

        # 3. Admin approves (Final Tier)
        adm_approve = await client.post(
            f"/api/prs/{pr_id}/action",
            json={"action": "approve", "comment": "Final sign-off by Finance Admin"},
            headers={"Authorization": f"Bearer {adm_token}"}
        )
        assert adm_approve.status_code == 200, adm_approve.text
        assert adm_approve.json()["status"] == "Approved"
        assert adm_approve.json()["admin_approval"]["user_name"] == "Sarah Connor (Admin)"

        # 4. Check Analytics
        analytics_res = await client.get("/api/analytics/dashboard", headers={"Authorization": f"Bearer {adm_token}"})
        assert analytics_res.status_code == 200
        analytics_data = analytics_res.json()
        assert analytics_data["summary"]["total_prs"] >= 1
        assert analytics_data["summary"]["total_approved_spend"] > 0
