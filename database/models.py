# ====================================================================
# SQLAlchemy 2.0 Database Models Declarative Map for Community Hero
# Highly-typed database mapping designed for clean, robust fullstack Python services
# Created/Updated: 2026-06-23
# ====================================================================

from datetime import datetime
from typing import List, Optional
from enum import Enum as PyEnum
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, ForeignKey, 
    DateTime, UniqueConstraint, CheckConstraint, Enum
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# --------------------------------------------------------------------
# Declarative Base Definition
# --------------------------------------------------------------------
class Base(DeclarativeBase):
    """Declarative base class for all Community Hero ORM models."""
    pass

# --------------------------------------------------------------------
# Mapped Enums Definition
# --------------------------------------------------------------------
class UserRole(str, PyEnum):
    CITIZEN = "citizen"
    ADMIN = "admin"

class IssueCategory(str, PyEnum):
    POTHOLE = "Pothole"
    WATER_LEAKAGE = "Water Leakage"
    GARBAGE = "Garbage"
    DRAINAGE = "Drainage"
    STREETLIGHT = "Streetlight"
    ROAD_DAMAGE = "Road Damage"
    PUBLIC_SAFETY = "Public Safety"
    OTHER = "Other"

class IssueSeverity(str, PyEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class IssueStatus(str, PyEnum):
    REPORTED = "Reported"
    VERIFIED = "Verified"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class CommentAuthorRole(str, PyEnum):
    CITIZEN = "citizen"
    ADMIN = "admin"
    AI = "ai"

class RewardRedemptionStatus(str, PyEnum):
    PENDING = "Pending"
    CLAIMED = "Claimed"
    CANCELLED = "Cancelled"

class NotificationType(str, PyEnum):
    SYSTEM = "system"
    BADGE_EARNED = "badge_earned"
    ISSUE_UPDATE = "issue_update"
    COMMENT = "comment"
    POINTS_AWARDED = "points_awarded"
    REWARD_REDEEMED = "reward_redeemed"

# --------------------------------------------------------------------
# 1. User Model
# --------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, default=lambda: f"u_")
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CITIZEN, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    issues_reported: Mapped[List["Issue"]] = relationship(
        "Issue", back_populates="reporter", cascade="all, delete-orphan"
    )
    comments_made: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="author", cascade="all, delete-orphan"
    )
    verifications_submitted: Mapped[List["Verification"]] = relationship(
        "Verification", back_populates="user", cascade="all, delete-orphan"
    )
    badges_earned: Mapped[List["UserBadge"]] = relationship(
        "UserBadge", back_populates="user", cascade="all, delete-orphan"
    )
    rewards_redeemed: Mapped[List["UserReward"]] = relationship(
        "UserReward", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("points >= 0", name="chk_user_points_nonnegative"),
    )

# --------------------------------------------------------------------
# 2. Department Model
# --------------------------------------------------------------------
class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    managed_issues: Mapped[List["Issue"]] = relationship("Issue", back_populates="assigned_department")

# --------------------------------------------------------------------
# 3. Issue Model
# --------------------------------------------------------------------
class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[IssueCategory] = mapped_column(Enum(IssueCategory), nullable=False, index=True)
    severity: Mapped[IssueSeverity] = mapped_column(Enum(IssueSeverity), nullable=False, index=True)
    status: Mapped[IssueStatus] = mapped_column(Enum(IssueStatus), default=IssueStatus.REPORTED, nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reporter_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verifications_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    ai_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    reporter: Mapped["User"] = relationship("User", back_populates="issues_reported")
    assigned_department: Mapped[Optional["Department"]] = relationship("Department", back_populates="managed_issues")
    comments: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="issue", cascade="all, delete-orphan"
    )
    verifications: Mapped[List["Verification"]] = relationship(
        "Verification", back_populates="issue", cascade="all, delete-orphan"
    )
    timeline_items: Mapped[List["TimelineItem"]] = relationship(
        "TimelineItem", back_populates="issue", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90", name="chk_issue_latitude_bounds"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="chk_issue_longitude_bounds"),
        CheckConstraint("upvotes_count >= 0", name="chk_issue_upvotes_nonnegative"),
        CheckConstraint("verifications_count >= 0", name="chk_issue_verifications_nonnegative"),
    )

# --------------------------------------------------------------------
# 4. Comment Model
# --------------------------------------------------------------------
class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    issue_id: Mapped[str] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name: Mapped[str] = mapped_column(String(150), nullable=False)
    user_role: Mapped[CommentAuthorRole] = mapped_column(Enum(CommentAuthorRole), nullable=False)
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    issue: Mapped["Issue"] = relationship("Issue", back_populates="comments")
    author: Mapped[Optional["User"]] = relationship("User", back_populates="comments_made")

# --------------------------------------------------------------------
# 5. Verification Model
# --------------------------------------------------------------------
class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    issue_id: Mapped[str] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    issue: Mapped["Issue"] = relationship("Issue", back_populates="verifications")
    user: Mapped["User"] = relationship("User", back_populates="verifications_submitted")

    __table_args__ = (
        UniqueConstraint("user_id", "issue_id", name="uq_user_issue_verification"),
    )

# --------------------------------------------------------------------
# 6. Badge Model
# --------------------------------------------------------------------
class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    points_required: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user_awards: Mapped[List["UserBadge"]] = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("points_required >= 0", name="chk_badge_points_required_nonnegative"),
    )

# --------------------------------------------------------------------
# 7. UserBadge Model (Junction with achievements data metadata)
# --------------------------------------------------------------------
class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id: Mapped[str] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="badges_earned")
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_awards")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge_earning"),
    )

# --------------------------------------------------------------------
# 8. Reward Model
# --------------------------------------------------------------------
class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=-1, nullable=False) # -1 representing infinite stock
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    redemptions: Mapped[List["UserReward"]] = relationship("UserReward", back_populates="reward", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("points_cost > 0", name="chk_reward_points_cost_positive"),
    )

# --------------------------------------------------------------------
# 9. UserReward Model (Junction with redemptions statistics)
# --------------------------------------------------------------------
class UserReward(Base):
    __tablename__ = "user_rewards"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_id: Mapped[str] = mapped_column(ForeignKey("rewards.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[RewardRedemptionStatus] = mapped_column(Enum(RewardRedemptionStatus), default=RewardRedemptionStatus.PENDING, nullable=False)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="rewards_redeemed")
    reward: Mapped["Reward"] = relationship("Reward", back_populates="redemptions")

# --------------------------------------------------------------------
# 10. Notification Model
# --------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # UUID/Id of referenced model
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

# --------------------------------------------------------------------
# 11. TimelineItem Model
# --------------------------------------------------------------------
class TimelineItem(Base):
    __tablename__ = "timeline_items"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    issue_id: Mapped[str] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    updated_by: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    issue: Mapped["Issue"] = relationship("Issue", back_populates="timeline_items")
