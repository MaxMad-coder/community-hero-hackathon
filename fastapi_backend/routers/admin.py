from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from fastapi_backend.database import get_db
from fastapi_backend.models import User, Issue, Department, TimelineItem, Notification, Comment
from fastapi_backend.schemas import IssueResponse, DepartmentResponse
from fastapi_backend.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

class UpdateIncidentDirective(BaseModel):
    status: str # e.g. Assigned, In Progress, Resolved
    department_id: str

@router.patch("/issues/{issue_id}", response_model=IssueResponse)
def update_issue_directive(
    issue_id: str, 
    directive: UpdateIncidentDirective, 
    admin: User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incident not found in municipal logs.")
        
    department = db.query(Department).filter(Department.id == directive.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Selected department not found.")

    # Apply adjustments
    previous_status = issue.status
    issue.status = directive.status
    issue.department_id = department.id
    
    # Construct update descriptions
    update_desc = f"Department assigned to '{department.name}'. Workflow status progressed from '{previous_status}' to '{directive.status}'."
    
    # Write timeline logs
    timeline = TimelineItem(
        issue_id=issue.id,
        status=directive.status,
        title=f"Workflow Update: {directive.status}",
        description=update_desc,
        updated_by="admin"
    )
    db.add(timeline)
    
    # Broadcast status change alerts to reporting citizen
    citizen_notification = Notification(
        user_id=issue.reporter_id,
        title=f"Incident progressing to: {directive.status}",
        message=f"Administrator Alex processed your ticket '{issue.title}'. Department in-charge: {department.name}.",
        type="issue_update",
        reference_id=issue.id
    )
    db.add(citizen_notification)

    # If status progressed to RESOLVED, credit citizens with immense 100 points reward trigger
    if directive.status == "Resolved" and previous_status != "Resolved":
        reporter = db.query(User).filter(User.id == issue.reporter_id).first()
        if reporter:
            reporter.points += 100
            
            p_notif = Notification(
                user_id=reporter.id,
                title="Massive Points Bonus unlocked!",
                message="Your reported hazard has been fully RESOLVED by city teams. You earned +100 bonus points!",
                type="points_awarded"
            )
            db.add(p_notif)

        # Append final comments
        closing_comment = Comment(
            issue_id=issue.id,
            user_name="City AI Dispatcher",
            user_role="ai",
            comment_text=f"Resolution complete! Field technicians from the {department.name} have resolved the reported hazard. Thank you to original reporter '{issue.reporter_name}' and all onsite verifiers for keeping our municipality pristine!"
        )
        db.add(closing_comment)

    db.commit()
    db.refresh(issue)
    return issue
