from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import uvicorn

# Import configurations
from fastapi_backend.config import settings
from fastapi_backend.database import engine, SessionLocal, Base
from fastapi_backend.models import User, Department, Badge, Reward
from fastapi_backend.auth import get_password_hash

# Import sub-routers
from fastapi_backend.routers import users, issues, admin

# Instantiate application
app = FastAPI(
    title=settings.APP_NAME,
    description="Hyperlocal Hazard Mapping & AI Municipal Queue Router Engine",
    version="1.0.0"
)

# Host origin configurations to support local dynamic sandbox frames
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(users.router)
app.include_router(issues.router)
app.include_router(admin.router)

# --------------------------------------------------------------------
# Exception Handlers (Global Interceptors)
# --------------------------------------------------------------------
@app.exception_handler(SQLAlchemyError)
def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "A database operation failed unexpectedly.",
            "error_type": "DatabaseError",
            "message": str(exc)
        }
    )

@app.get("/", tags=["system"])
def read_root():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "diagnostics": "healthy",
        "environment": "FastAPI Sandbox"
    }

# --------------------------------------------------------------------
# DB Bootstrap & Initialize Data Seeds
# --------------------------------------------------------------------
@app.on_event("startup")
def bootstrap_database():
    try:
        # Create tables automatically at starting if not present
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        
        # Check if users are seeded
        admin_exists = db.query(User).filter(User.email == "alex@government.org").first()
        if not admin_exists:
            # Seed Alex Admin
            admin_user = User(
                id="u_alex_admin",
                email="alex@government.org",
                full_name="Alex Supervisor",
                password_hash=get_password_hash("password123"),
                role="admin",
                points=1000
            )
            db.add(admin_user)
            
            # Seed Jane Citizen
            citizen_user = User(
                id="u_jane_doe",
                email="jane@community.org",
                full_name="Jane Doe",
                password_hash=get_password_hash("password123"),
                role="citizen",
                points=250
            )
            db.add(citizen_user)
            
        # Check if departments are seeded
        dept_exists = db.query(Department).first()
        if not dept_exists:
            dpw = Department(id="dept_dpw", name="Department of Public Works", code="SF_DPW", contact_email="dpw-dispatch@sfgov.org")
            mta = Department(id="dept_muni", name="Municipal Transportation Agency", code="SF_MTA", contact_email="muni-streets@sfgov.org")
            puc = Department(id="dept_puc", name="Public Utilities Commission", code="SF_PUC", contact_email="water-power@sfgov.org")
            db.add_all([dpw, mta, puc])
            
        # Check if badges are seeded
        badges_exist = db.query(Badge).first()
        if not badges_exist:
            b1 = Badge(id="badge_first_responder", name="First Responder", description="Logged your very first hyperlocal hazard log", points_required=0)
            b2 = Badge(id="badge_civic_crusader", name="Civic Crusader", description="Acquired over 200 points in verified hazard reports", points_required=200)
            b3 = Badge(id="badge_safety_sentinel", name="Safety Sentinel", description="Submitted 10 verified on-site field inspections", points_required=500)
            db.add_all([b1, b2, b3])
            
        # Check if rewards are seeded
        rewards_exist = db.query(Reward).first()
        if not rewards_exist:
            r1 = Reward(id="rew_muni_pass", title="MUNI Transit 1-Day Pass Coupon", description="Free unlimited MUNI rides inside SF county lines.", points_cost=150, stock=100)
            r2 = Reward(id="rew_park_voucher", title="Gold State National Park Token", description="Complimentary visitor entry passes.", points_cost=300, stock=50)
            db.add_all([r1, r2])
            
        db.commit()
        db.close()
        print("Database bootstrap completes successfully.")
    except Exception as e:
        print(f"Error during bootstrapping database: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
