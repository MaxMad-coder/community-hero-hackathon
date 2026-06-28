from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from fastapi_backend.database import Base

# Enums matching Postgres domain structures
class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"

class IssueCategory(str, enum.Enum):
    Pothole = "Pothole"
    WaterLeakage = "Water Leakage"
    Garbage = "Garbage"
    Drainage = "Drainage"
    Streetlight = "Streetlight"
    RoadDamage = "Road Damage"
    PublicSafety = "Public Safety"
    Other = "Other"

class IssueSeverity(str, enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

class IssueStatus(str, enum.Enum):
    Reported = "Reported"
    Verified = "Verified"
    Assigned = "Assigned"
    InProgress = "In Progress"
    Resolved = "Resolved"

class CommentAuthorRole(str, enum.Enum):
    citizen = "citizen"
    admin = "admin"
    ai = "ai"

class NotificationType(str, enum.Enum):
    system = "system"
    badge_earned = "badge_earned"
    issue_update = "issue_update"
    comment = "comment"
    points_awarded = "points_awarded"
    reward_redeemed = "reward_redeemed"

class RewardRedemptionStatus(str, enum.Enum):
    Pending = "Pending"
    Claimed = "Claimed"
    Cancelled = "Cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True, default=lambda: f"u_{uuid.uuid4().hex[:16]}")
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="citizen", nullable=False)
    points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    issues_reported = relationship("Issue", back_populates="reporter", cascade="all, delete-orphan")
    comments_made = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    verifications_submitted = relationship("Verification", back_populates="user", cascade="all, delete-orphan")
    badges_earned = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    rewards_redeemed = relationship("UserReward", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(100), primary_key=True, default=lambda: f"dept_{uuid.uuid4().hex[:16]}")
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    contact_email = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issues = relationship("Issue", back_populates="department")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(100), primary_key=True, default=lambda: f"issue_{uuid.uuid4().hex[:16]}")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    status = Column(String(20), default="Reported", nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    reporter_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_name = Column(String(150), nullable=False)
    department_id = Column(String(100), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    upvotes_count = Column(Integer, default=0, nullable=False)
    verifications_count = Column(Integer, default=0, nullable=False)
    summary = Column(Text, nullable=False)
    ai_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    reporter = relationship("User", back_populates="issues_reported")
    department = relationship("Department", back_populates="issues")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="issue", cascade="all, delete-orphan")
    timeline_items = relationship("TimelineItem", back_populates="issue", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(100), primary_key=True, default=lambda: f"com_{uuid.uuid4().hex[:16]}")
    issue_id = Column(String(100), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name = Column(String(150), nullable=False)
    user_role = Column(String(20), nullable=False) # citizen | admin | ai
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", back_populates="comments")
    author = relationship("User", back_populates="comments_made")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(100), primary_key=True, default=lambda: f"ver_{uuid.uuid4().hex[:16]}")
    issue_id = Column(String(100), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", back_populates="verifications")
    user = relationship("User", back_populates="verifications_submitted")

    __table_args__ = (
        UniqueConstraint("user_id", "issue_id", name="uq_user_issue_verification"),
    )


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(100), primary_key=True, default=lambda: f"badge_{uuid.uuid4().hex[:16]}")
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    icon_url = Column(String(255), nullable=True)
    points_required = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user_awards = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(100), primary_key=True, default=lambda: f"ub_{uuid.uuid4().hex[:16]}")
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(100), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="badges_earned")
    badge = relationship("Badge", back_populates="user_awards")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge_earning"),
    )


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(String(100), primary_key=True, default=lambda: f"rew_{uuid.uuid4().hex[:16]}")
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    points_cost = Column(Integer, nullable=False)
    stock = Column(Integer, default=-1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    redemptions = relationship("UserReward", back_populates="reward", cascade="all, delete-orphan")


class UserReward(Base):
    __tablename__ = "user_rewards"

    id = Column(String(100), primary_key=True, default=lambda: f"ur_{uuid.uuid4().hex[:16]}")
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_id = Column(String(100), ForeignKey("rewards.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="Pending", nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="rewards_redeemed")
    reward = relationship("Reward", back_populates="redemptions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(100), primary_key=True, default=lambda: f"ntf_{uuid.uuid4().hex[:16]}")
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    type = Column(String(50), default="system", nullable=False)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class TimelineItem(Base):
    __tablename__ = "timeline_items"

    id = Column(String(100), primary_key=True, default=lambda: f"time_{uuid.uuid4().hex[:16]}")
    issue_id = Column(String(100), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    updated_by = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", back_populates="timeline_items")
