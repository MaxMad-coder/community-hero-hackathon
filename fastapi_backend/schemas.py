from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from fastapi_backend.models import UserRole, IssueCategory, IssueSeverity, IssueStatus, CommentAuthorRole, NotificationType, RewardRedemptionStatus

# --------------------------------------------------------------------
# 1. User Schemas
# --------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.CITIZEN

class UserResponse(UserBase):
    id: str
    role: UserRole
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLeaderboardResponse(BaseModel):
    id: str
    full_name: str
    points: int
    badges: List[str] = []

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 2. Token Schemas
# --------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

# --------------------------------------------------------------------
# 3. Department Schemas
# --------------------------------------------------------------------
class DepartmentBase(BaseModel):
    name: str
    code: str
    contact_email: EmailStr

class DepartmentResponse(DepartmentBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 4. Issue Schemas
# --------------------------------------------------------------------
class IssueBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10)
    category: IssueCategory
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    image_url: Optional[str] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    department_id: Optional[str] = None

class IssueResponse(IssueBase):
    id: str
    status: IssueStatus
    severity: IssueSeverity
    reporter_id: str
    reporter_name: str
    department_id: Optional[str] = None
    upvotes_count: int
    verifications_count: int
    summary: str
    ai_explanation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 5. Comment Schemas
# --------------------------------------------------------------------
class CommentCreate(BaseModel):
    comment_text: str = Field(..., min_length=1)

class CommentResponse(BaseModel):
    id: str
    issue_id: str
    user_id: Optional[str] = None
    user_name: str
    user_role: CommentAuthorRole
    comment_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 6. Verification Schemas
# --------------------------------------------------------------------
class VerificationCreate(BaseModel):
    notes: str = Field(..., min_length=5)

class VerificationResponse(BaseModel):
    id: str
    issue_id: str
    user_id: str
    notes: str
    verified_at: datetime

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 7. Timeline Schemas
# --------------------------------------------------------------------
class TimelineItemResponse(BaseModel):
    id: str
    issue_id: str
    status: str
    title: str
    description: str
    updated_by: str
    created_at: datetime

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 8. Gamification & Rewards
# --------------------------------------------------------------------
class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon_url: Optional[str] = None
    points_required: int

    class Config:
        from_attributes = True

class RewardResponse(BaseModel):
    id: str
    title: str
    description: str
    points_cost: int
    stock: int
    is_active: bool

    class Config:
        from_attributes = True

class UserRewardResponse(BaseModel):
    id: str
    reward_id: str
    status: RewardRedemptionStatus
    redeemed_at: datetime

    class Config:
        from_attributes = True

# --------------------------------------------------------------------
# 9. Dashboard Analytics
# --------------------------------------------------------------------
class CategoryCount(BaseModel):
    category: str
    count: int

class SeverityCount(BaseModel):
    severity: str
    count: int

class AnalyticsSummary(BaseModel):
    total_issues: int
    resolved_issues: int
    active_users: int
    most_common_category: Optional[str] = None
    category_distribution: List[CategoryCount]
    severity_distribution: List[SeverityCount]
    summary_message: str
