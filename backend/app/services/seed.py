import uuid
from datetime import datetime, timezone, timedelta
from app.core.security import get_password_hash
from app.core.database import get_users_collection, get_prs_collection, get_activities_collection
from app.models.user import UserRole
from app.models.pr import PRStatus, PRPriority

async def seed_database():
    users_coll = get_users_collection()
    prs_coll = get_prs_collection()
    act_coll = get_activities_collection()
    
    count_users = await users_coll.count_documents({})
    if count_users > 0:
        return
        
    print("[*] Seeding demo users and purchase requisitions...")
    now = datetime.now(timezone.utc)
    
    # 1. Create Default Users
    admin_id = str(uuid.uuid4())
    manager_id = str(uuid.uuid4())
    employee_id = str(uuid.uuid4())
    
    users = [
        {
            "_id": admin_id,
            "id": admin_id,
            "name": "Sarah Connor (Admin)",
            "email": "admin@prsystem.com",
            "department": "Executive / Operations",
            "role": UserRole.ADMIN.value,
            "hashed_password": get_password_hash("password123"),
            "is_active": True,
            "created_at": (now - timedelta(days=30)).isoformat()
        },
        {
            "_id": manager_id,
            "id": manager_id,
            "name": "Alex Rivera (Manager)",
            "email": "manager@prsystem.com",
            "department": "Engineering",
            "role": UserRole.MANAGER.value,
            "hashed_password": get_password_hash("password123"),
            "is_active": True,
            "created_at": (now - timedelta(days=25)).isoformat()
        },
        {
            "_id": employee_id,
            "id": employee_id,
            "name": "Jordan Lee (Employee)",
            "email": "employee@prsystem.com",
            "department": "Engineering",
            "role": UserRole.EMPLOYEE.value,
            "hashed_password": get_password_hash("password123"),
            "is_active": True,
            "created_at": (now - timedelta(days=20)).isoformat()
        }
    ]
    
    for u in users:
        await users_coll.insert_one(u)
        
    # 2. Create Realistic PRs
    demo_prs = [
        {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "pr_number": "PR-2026-0001",
            "title": "High-Performance Developer Workstations",
            "description": "Procure 3x Apple MacBook Pro M3 Max for the core platform backend and AI engineering team.",
            "department": "Engineering",
            "category": "IT Equipment",
            "priority": PRPriority.HIGH.value,
            "currency": "USD",
            "items": [
                {
                    "item_name": "MacBook Pro 16\" M3 Max 64GB 1TB",
                    "quantity": 3,
                    "unit_price": 3499.00,
                    "total_price": 10497.00,
                    "specification": "Space Black, 16-core CPU, 40-core GPU, AppleCare+ included"
                },
                {
                    "item_name": "Dell UltraSharp 32\" 4K Thunderbolt Monitors",
                    "quantity": 3,
                    "unit_price": 899.00,
                    "total_price": 2697.00,
                    "specification": "U3223QE 4K USB-C Hub Monitor"
                }
            ],
            "estimated_total_cost": 13194.00,
            "justification": "Required for compiling heavy local microservices and running local LLM quantizations.",
            "vendor_name": "Apple Enterprise Direct & B&H",
            "required_by_date": (now + timedelta(days=14)).strftime("%Y-%m-%d"),
            "status": PRStatus.PENDING_ADMIN.value,
            "requester": {
                "id": employee_id,
                "name": "Jordan Lee (Employee)",
                "email": "employee@prsystem.com",
                "department": "Engineering",
                "role": "employee"
            },
            "manager_approval": {
                "user_id": manager_id,
                "user_name": "Alex Rivera (Manager)",
                "user_role": "manager",
                "timestamp": (now - timedelta(days=1)).isoformat(),
                "comment": "Approved at department level. Hardware specs justified for team Q3 deliverables."
            },
            "admin_approval": None,
            "rejection_reason": None,
            "attachments": [
                {
                    "file_name": "hardware_quote_apple.pdf",
                    "file_url": "/uploads/sample_hardware_quote.pdf",
                    "file_size": 245760,
                    "uploaded_at": (now - timedelta(days=2)).isoformat()
                }
            ],
            "activities": [
                {
                    "id": str(uuid.uuid4()),
                    "user_id": employee_id,
                    "user_name": "Jordan Lee (Employee)",
                    "user_role": "employee",
                    "action": "Submitted Requisition",
                    "comment": "Submitted for engineering hardware upgrade.",
                    "timestamp": (now - timedelta(days=2)).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "user_id": manager_id,
                    "user_name": "Alex Rivera (Manager)",
                    "user_role": "manager",
                    "action": "Manager Approved (Tier 1)",
                    "comment": "Approved at department level. Forwarded to Admin for final sign-off.",
                    "timestamp": (now - timedelta(days=1)).isoformat()
                }
            ],
            "created_at": (now - timedelta(days=2)).isoformat(),
            "updated_at": (now - timedelta(days=1)).isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "pr_number": "PR-2026-0002",
            "title": "Annual Figma & Cloud Tooling Subscriptions",
            "description": "Annual enterprise license renewal for Figma Org and GitHub Enterprise seats.",
            "department": "Design",
            "category": "Software & Subscriptions",
            "priority": PRPriority.MEDIUM.value,
            "currency": "USD",
            "items": [
                {
                    "item_name": "Figma Enterprise Tier (Annual)",
                    "quantity": 12,
                    "unit_price": 900.00,
                    "total_price": 10800.00,
                    "specification": "12 editor seats for UX/UI designers and front-end leads"
                }
            ],
            "estimated_total_cost": 10800.00,
            "justification": "Core tool for design system and product prototyping.",
            "vendor_name": "Figma Inc.",
            "required_by_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
            "status": PRStatus.APPROVED.value,
            "requester": {
                "id": employee_id,
                "name": "Jordan Lee (Employee)",
                "email": "employee@prsystem.com",
                "department": "Engineering",
                "role": "employee"
            },
            "manager_approval": {
                "user_id": manager_id,
                "user_name": "Alex Rivera (Manager)",
                "user_role": "manager",
                "timestamp": (now - timedelta(days=5)).isoformat(),
                "comment": "Design licenses verified."
            },
            "admin_approval": {
                "user_id": admin_id,
                "user_name": "Sarah Connor (Admin)",
                "timestamp": (now - timedelta(days=4)).isoformat(),
                "comment": "Finance budget approved and PO issued."
            },
            "rejection_reason": None,
            "attachments": [],
            "activities": [
                {
                    "id": str(uuid.uuid4()),
                    "user_id": employee_id,
                    "user_name": "Jordan Lee (Employee)",
                    "user_role": "employee",
                    "action": "Submitted Requisition",
                    "comment": "Annual renewal",
                    "timestamp": (now - timedelta(days=6)).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "user_id": manager_id,
                    "user_name": "Alex Rivera (Manager)",
                    "user_role": "manager",
                    "action": "Manager Approved (Tier 1)",
                    "comment": "Approved",
                    "timestamp": (now - timedelta(days=5)).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "user_id": admin_id,
                    "user_name": "Sarah Connor (Admin)",
                    "user_role": "admin",
                    "action": "Final Admin Approval Granted",
                    "comment": "PO Issued",
                    "timestamp": (now - timedelta(days=4)).isoformat()
                }
            ],
            "created_at": (now - timedelta(days=6)).isoformat(),
            "updated_at": (now - timedelta(days=4)).isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "pr_number": "PR-2026-0003",
            "title": "Ergonomic Office Chairs & Standing Desks",
            "description": "Ergonomic setup renewal for the team floor in Building B.",
            "department": "Operations",
            "category": "Office Supplies",
            "priority": PRPriority.LOW.value,
            "currency": "USD",
            "items": [
                {
                    "item_name": "Herman Miller Aeron Chair",
                    "quantity": 5,
                    "unit_price": 1250.00,
                    "total_price": 6250.00,
                    "specification": "Size B, Fully adjustable arms and Lumbar Support"
                }
            ],
            "estimated_total_cost": 6250.00,
            "justification": "Workplace health and ergonomic standards compliance.",
            "vendor_name": "Herman Miller Commercial",
            "required_by_date": (now + timedelta(days=30)).strftime("%Y-%m-%d"),
            "status": PRStatus.PENDING_MANAGER.value,
            "requester": {
                "id": employee_id,
                "name": "Jordan Lee (Employee)",
                "email": "employee@prsystem.com",
                "department": "Engineering",
                "role": "employee"
            },
            "manager_approval": None,
            "admin_approval": None,
            "rejection_reason": None,
            "attachments": [],
            "activities": [
                {
                    "id": str(uuid.uuid4()),
                    "user_id": employee_id,
                    "user_name": "Jordan Lee (Employee)",
                    "user_role": "employee",
                    "action": "Submitted Requisition",
                    "comment": "Requisition created for office chairs.",
                    "timestamp": (now - timedelta(hours=6)).isoformat()
                }
            ],
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "updated_at": (now - timedelta(hours=6)).isoformat()
        }
    ]
    
    for pr in demo_prs:
        await prs_coll.insert_one(pr)
        for act in pr.get("activities", []):
            await act_coll.insert_one({
                **act,
                "pr_id": pr["id"],
                "pr_number": pr["pr_number"]
            })
            
    print(f"[*] Successfully seeded {len(users)} users and {len(demo_prs)} requisitions.")
