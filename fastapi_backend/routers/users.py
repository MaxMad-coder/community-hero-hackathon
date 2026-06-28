from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from fastapi_backend.database import get_db
from fastapi_backend.models import User, UserBadge, Badge, Reward, UserReward, Notification
from fastapi_backend.schemas import UserCreate, UserResponse, Token, UserLeaderboardResponse, BadgeResponse, RewardResponse, UserRewardResponse
from fastapi_backend.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api", tags=["users"])

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Validate unique constraint
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_ERROR_CLASS := status.HTTP_400_BAD_REQUEST,
            detail="User email is already registered."
        )
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=hashed_password,
        role=user_in.role.value if user_in.role else "citizen",
        points=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto reward First Responder badge if badges are seeded
    first_badge = db.query(Badge).filter(Badge.name == "First Responder").first()
    if first_badge:
        user_badge = UserBadge(user_id=new_user.id, badge_id=first_badge.id)
        db.add(user_badge)
        
        # Dispatch notification
        notification = Notification(
            user_id=new_user.id,
            title="Badge Unlocked!",
            message="Congratulations! You earned the First Responder badge.",
            type="badge_earned",
            reference_id=first_badge.id
        )
        db.add(notification)
        db.commit()

    return new_user

@router.post("/auth/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or credentials authentication validation.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users/leaderboard", response_model=List[UserLeaderboardResponse])
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.points.desc()).limit(15).all()
    leaderboard = []
    for user in users:
        # Fetch earned badge names
        badge_links = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
        badges = []
        for bl in badge_links:
            b = db.query(Badge).filter(Badge.id == bl.badge_id).first()
            if b:
                badges.append(b.name)
        
        leaderboard.append({
            "id": user.id,
            "full_name": user.full_name,
            "points": user.points,
            "badges": badges
        })
    return leaderboard

@router.get("/badges", response_model=List[BadgeResponse])
def get_all_badges(db: Session = Depends(get_db)):
    return db.query(Badge).all()

@router.get("/rewards", response_model=List[RewardResponse])
def get_all_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.is_active == True).all()

@router.post("/rewards/{reward_id}/redeem", response_model=UserRewardResponse)
def redeem_points_for_reward(
    reward_id: str, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward or not reward.is_active:
        raise HTTPException(status_code=404, detail="Selected reward is not found or deactivated.")
    
    if reward.stock == 0:
        raise HTTPException(status_code=400, detail="This voucher has sold out.")
        
    if current_user.points < reward.points_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient points. Required: {reward.points_cost}, current: {current_user.points}"
        )
    
    # Apply transactional point deduction
    current_user.points -= reward.points_cost
    if reward.stock > 0:
        reward.stock -= 1
        
    user_reward = UserReward(
        user_id=current_user.id,
        reward_id=reward.id,
        status="Claimed"
    )
    db.add(user_reward)
    
    # Broadcast notification to user
    notification = Notification(
        user_id=current_user.id,
        title="Reward Redeemed!",
        message=f"You successfully exchanged {reward.points_cost} points for: {reward.title}.",
        type="reward_redeemed",
        reference_id=reward.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(user_reward)
    return user_reward

@router.get("/notifications", response_model=List[Notification]) # Using direct model serializations
def read_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    # Mark as read
    for n in notifications:
        n.is_read = True
    db.commit()
    return notifications
