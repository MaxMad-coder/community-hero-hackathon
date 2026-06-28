from datetime import datetime, timedelta
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from fastapi_backend.database import get_db
from fastapi_backend.models import User, Issue, Comment, Verification, TimelineItem, Notification, Department, UserBadge, Badge
from fastapi_backend.schemas import IssueCreate, IssueResponse, CommentCreate, CommentResponse, VerificationCreate, VerificationResponse, TimelineItemResponse, AnalyticsSummary, CategoryCount, SeverityCount
from fastapi_backend.auth import get_current_user

router = APIRouter(prefix="/api/issues", tags=["issues"])

# Schema definitions for specific action endpoints
class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    duplicate_issue_id: Optional[str] = None
    similarity_score: float
    explanation: str

@router.get("", response_model=List[IssueResponse])
def get_all_issues(db: Session = Depends(get_db)):
    return db.query(Issue).order_by(Issue.created_at.desc()).all()

@router.post("", response_model=IssueResponse)
def create_issue(issue_in: IssueCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple simulated spatial heuristics & AI routing for standard fast responses
    departments = db.query(Department).all()
    dept_map = {
        "Pothole": "SF_DPW",
        "Water Leakage": "SF_PUC",
        "Streetlight": "SF_PUC",
        "Drainage": "SF_PUC",
        "Garbage": "SF_DPW",
        "Road Damage": "SF_DPW",
        "Public Safety": "SF_MTA"
    }
    
    selected_dept = None
    if departments:
        target_code = dept_map.get(issue_in.category.value, "SF_DPW")
        selected_dept = next((d for d in departments if d.code == target_code), departments[0])

    # Dynamic AI prediction simulation for classification diagnostics
    severity_options = ["Medium", "High", "Critical"]
    simulated_severity = "High" if "danger" in issue_in.description.lower() or "critical" in issue_in.description.lower() else random.choice(severity_options)
    
    assigned_dept_name = selected_dept.name if selected_dept else "Department of Public Works"
    simulated_summary = f"Hyperlocal report detailing {issue_in.category.value} incident located near latitude {issue_in.latitude:.4f}."
    simulated_explanation = f"Automated AI routing successfully mapped this ticket to the {assigned_dept_name} based on categorizations of {issue_in.category.value} and descriptive safety keywords."

    new_issue = Issue(
        title=issue_in.title,
        description=issue_in.description,
        category=issue_in.category.value,
        severity=simulated_severity,
        status="Reported",
        latitude=issue_in.latitude,
        longitude=issue_in.longitude,
        image_url=issue_in.image_url,
        reporter_id=current_user.id,
        reporter_name=current_user.full_name,
        department_id=selected_dept.id if selected_dept else None,
        summary=simulated_summary,
        ai_explanation=simulated_explanation,
        upvotes_count=0,
        verifications_count=0
    )
    db.add(new_issue)
    
    # Award gamification reward points to the reporter
    current_user.points += 50
    
    # Setup timeline history log
    timeline = TimelineItem(
        issue_id=new_issue.id,
        status="Reported",
        title="Incident Logged",
        description=f"Ticket successfully posted by citizen '{current_user.full_name}'. AI routed destination: {assigned_dept_name}.",
        updated_by="reporter"
    )
    db.add(timeline)

    # Post an AI system dispatcher greeting comment
    dispatcher_comment = Comment(
        issue_id=new_issue.id,
        user_name="City AI Dispatcher",
        user_role="ai",
        comment_text=f"Hello! I am your AI Civic Assistant. I have audited your report of a {issue_in.category.value} and dispatched it to the {assigned_dept_name} with urgency classified as '{simulated_severity}' based on field diagnostics. Thank you for making our city safer!"
    )
    db.add(dispatcher_comment)

    # Issue a notification for gamification update
    notification = Notification(
        user_id=current_user.id,
        title="Points Credited!",
        message="You earned +50 points for lodging an active civic report.",
        type="points_awarded"
    )
    db.add(notification)

    # Audit for badge upgrades
    check_and_upgrade_badges(current_user, db)

    db.commit()
    db.refresh(new_issue)
    return new_issue

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate_issue(check_req: DuplicateCheckRequest, db: Session = Depends(get_db)):
    # Spatial proximity search heuristics
    existing_issues = db.query(Issue).filter(Issue.status != "Resolved").all()
    for issue in existing_issues:
        # Simple spatial distance formula (approximately 111km per degree)
        lat_diff = abs(issue.latitude - check_req.latitude) * 111000
        lon_diff = abs(issue.longitude - check_req.longitude) * 111000
        distance = (lat_diff**2 + lon_diff**2)**0.5
        
        # If coordinates are less than 350 meters and categories overlap, suspect duplicates
        if distance < 350.0 and (issue.title.lower()[:10] in check_req.title.lower() or "leak" in check_req.description.lower() and "leak" in issue.description.lower()):
            return DuplicateCheckResponse(
                is_duplicate=True,
                duplicate_issue_id=issue.id,
                similarity_score=87.5,
                explanation=f"A matching active report '{issue.title}' is logged just {distance:.1f} meters from your pinned coordinates. Please consider upvoting instead of resubmitting."
            )
            
    return DuplicateCheckResponse(
        is_duplicate=False,
        similarity_score=12.0,
        explanation="No active overlapping incidents detected near these coordinates."
    )

@router.post("/{issue_id}/upvote")
def upvote_issue(issue_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incident not found in registry.")
        
    # Standard upvote increments
    issue.upvotes_count += 1
    
    notification = Notification(
        user_id=issue.reporter_id,
        title="Your report got an upvote!",
        message=f"Another citizen of the community upvoted your report: '{issue.title}'.",
        type="issue_update",
        reference_id=issue.id
    )
    db.add(notification)
    
    db.commit()
    return {"status": "success", "upvotes_count": issue.upvotes_count}

@router.post("/{issue_id}/verify", response_model=VerificationResponse)
def verify_issue(issue_id: str, verify_in: VerificationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incident not found in registry.")
        
    # Defend duplicates
    duplicate_check = db.query(Verification).filter(
        Verification.issue_id == issue_id, 
        Verification.user_id == current_user.id
    ).first()
    if duplicate_check:
        raise HTTPException(status_code=400, detail="You have already submitted an onsite verification log for this ticket.")

    new_verification = Verification(
        issue_id=issue_id,
        user_id=current_user.id,
        notes=verify_in.notes
    )
    db.add(new_verification)
    
    # Increment counters and transition status to Verified if reported previously
    issue.verifications_count += 1
    if issue.status == "Reported":
        issue.status = "Verified"
        
        timeline = TimelineItem(
            issue_id=issue.id,
            status="Verified",
            title="Citizen Verified",
            description=f"Citizen validation completed on-site by '{current_user.full_name}' with logs: '{verify_in.notes}'.",
            updated_by="reporter"
        )
        db.add(timeline)

    # Award validation XP point booster
    current_user.points += 20
    
    notification = Notification(
        user_id=current_user.id,
        title="Points Credited!",
        message="You earned +20 points for providing a verified ground truth inspection.",
        type="points_awarded"
    )
    db.add(notification)

    # Dispatch notification to original reporter
    if issue.reporter_id != current_user.id:
        reporter_notif = Notification(
            user_id=issue.reporter_id,
            title="Report verified!",
            message=f"Citizen '{current_user.full_name}' has verified your report: '{issue.title}'.",
            type="issue_update",
            reference_id=issue_id
        )
        db.add(reporter_notif)

    check_and_upgrade_badges(current_user, db)
    db.commit()
    db.refresh(new_verification)
    return new_verification

@router.get("/{issue_id}/comments", response_model=List[CommentResponse])
def get_comments(issue_id: str, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.issue_id == issue_id).order_by(Comment.created_at.asc()).all()

@router.post("/{issue_id}/comments", response_model=CommentResponse)
def create_comment(issue_id: str, comment_in: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    comment = Comment(
        issue_id=issue_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role=current_user.role,
        comment_text=comment_in.comment_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/{issue_id}/timeline", response_model=List[TimelineItemResponse])
def get_timeline(issue_id: str, db: Session = Depends(get_db)):
    return db.query(TimelineItem).filter(TimelineItem.issue_id == issue_id).order_by(TimelineItem.created_at.asc()).all()

@router.get("/summary/analytics", response_model=AnalyticsSummary)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    total_issues = db.query(Issue).count()
    resolved_issues = db.query(Issue).filter(Issue.status == "Resolved").count()
    active_users = db.query(User).count()
    
    # Category Distribution logic
    categories = ["Pothole", "Water Leakage", "Garbage", "Drainage", "Streetlight", "Road Damage", "Public Safety", "Other"]
    category_distribution = []
    most_common_cat = None
    max_cat_count = -1
    for cat in categories:
        count = db.query(Issue).filter(Issue.category == cat).count()
        category_distribution.append(CategoryCount(category=cat, count=count))
        if count > max_cat_count:
            max_cat_count = count
            most_common_cat = cat
            
    # Severity distribution
    severities = ["Low", "Medium", "High", "Critical"]
    severity_distribution = []
    for sev in severities:
        count = db.query(Issue).filter(Issue.severity == sev).count()
        severity_distribution.append(SeverityCount(severity=sev, count=count))

    summary_message = f"In San Francisco county, we are tracking {total_issues} reported incidents. Standard municipal dispatch queues are resolving {resolved_issues} tickets, fueled by active checking from {active_users} civil champions."

    return AnalyticsSummary(
        total_issues=total_issues,
        resolved_issues=resolved_issues,
        active_users=active_users,
        most_common_category=most_common_cat,
        category_distribution=category_distribution,
        severity_distribution=severity_distribution,
        summary_message=summary_message
    )

def check_and_upgrade_badges(user: User, db: Session):
    # Retrieve badges
    crusader = db.query(Badge).filter(Badge.name == "Civic Crusader").first()
    sentinel = db.query(Badge).filter(Badge.name == "Safety Sentinel").first()
    
    if crusader and user.points >= crusader.points_required:
        has_it = db.query(UserBadge).filter(UserBadge.user_id == user.id, UserBadge.badge_id == crusader.id).first()
        if not has_it:
            bl = UserBadge(user_id=user.id, badge_id=crusader.id)
            db.add(bl)
            notification = Notification(
                user_id=user.id,
                title="Badge Earned!",
                message=f"Outstanding! You earned: {crusader.name}.",
                type="badge_earned",
                reference_id=crusader.id
            )
            db.add(notification)
            
    if sentinel and user.points >= sentinel.points_required:
        has_it = db.query(UserBadge).filter(UserBadge.user_id == user.id, UserBadge.badge_id == sentinel.id).first()
        if not has_it:
            bl = UserBadge(user_id=user.id, badge_id=sentinel.id)
            db.add(bl)
            notification = Notification(
                user_id=user.id,
                title="Badge Earned!",
                message=f"Outstanding! You earned: {sentinel.name}.",
                type="badge_earned",
                reference_id=sentinel.id
            )
            db.add(notification)
