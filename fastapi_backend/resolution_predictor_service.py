"""
Resolution Predictor Service for Community Hero
Provides AI-powered estimation for ticket resolution times using Gemini models.
"""

import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("resolution_predictor_service")

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment.")
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Error initializing google-genai Client: {e}")
        return None

def predict_resolution_time(issue_details: Dict[str, Any], historical_issues: List[Dict[str, Any]], dept_workloads: Dict[str, int]) -> Dict[str, Any]:
    """
    Predicts likely resolution days, confidence score, and justification reasoning
    using Gemini 3.5 Flash or local high-fidelity heuristics fallback.
    """
    client = get_gemini_client()
    if not client:
        logger.info("Executing local predictive heuristic fallback.")
        return calculate_heuristic_prediction(issue_details, historical_issues, dept_workloads)

    try:
        from google.genai import types
        
        prompt = f"""You are the City Resource Planning AI. Predict the likely resolution time in days.

CURRENT TICKET REPORTED:
Category: {issue_details.get('category')}
Severity: {issue_details.get('severity')}
Verifications: {issue_details.get('verificationsCount', 0)}
Assigned Department: {issue_details.get('assignedDepartment', 'Unassigned')}
Title: "{issue_details.get('title')}"
Description: "{issue_details.get('description')}"

DEPARTMENT ACTIVE WORKLOADS (Open cases queue count):
{json.dumps(dept_workloads, indent=2)}

HISTORICAL CLOSED SISTER INCIDENTS (Last 10 items):
{json.dumps(historical_issues, indent=2)}

Estimate:
- "predicted_resolution_days": Number of days (integer, e.g. 5) expected until resolved.
- "confidence_score": Certainty percentage (integer, 0 to 100).
- "reasoning": Human-readable explanatory sentence.

Return response strictly as a JSON object of this format:
{{
  "predicted_resolution_days": 5,
  "confidence_score": 87,
  "reasoning": "..."
}}
"""
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Gemini API execution error: {e}. Executing heuristic fallback.")
        return calculate_heuristic_prediction(issue_details, historical_issues, dept_workloads)

def calculate_heuristic_prediction(issue: Dict[str, Any], historical: List[Dict[str, Any]], workloads: Dict[str, int]) -> Dict[str, Any]:
    category = issue.get('category', 'Other')
    severity = issue.get('severity', 'Medium')
    verifications = issue.get('verificationsCount', 0)
    dept = issue.get('assignedDepartment', 'City Administration Department')
    
    # Base days per category
    base_days = 5
    if category == 'Pothole':
        base_days = 6
    elif category == 'Water Leakage':
        base_days = 3
    elif category == 'Garbage':
        base_days = 2
    elif category == 'Drainage':
        base_days = 4
    elif category == 'Streetlight':
        base_days = 5
    elif category == 'Road Damage':
        base_days = 10
    elif category == 'Public Safety':
        base_days = 2

    # Severity multiplier
    sev_mult = 1.0
    if severity == 'Critical':
        sev_mult = 0.3
    elif severity == 'High':
        sev_mult = 0.6
    elif severity == 'Medium':
        sev_mult = 1.0
    elif severity == 'Low':
        sev_mult = 1.5

    # Verification acceleration pressure
    ver_mult = max(0.7, 1.0 - (verifications * 0.05))

    # Department queue workload delay
    workload = workloads.get(dept, 0)
    workload_mult = min(2.0, 1.0 + (workload * 0.1))

    predicted_days = max(1, round(base_days * sev_mult * ver_mult * workload_mult))

    # Calculate confidence score
    confidence = 75
    similar_category_closed = [h for h in historical if h.get('category') == category]
    if similar_category_closed:
        confidence += min(15, len(similar_category_closed) * 3)
    else:
        confidence -= 10

    if verifications > 0:
        confidence += min(8, verifications * 2)

    if workload > 5:
        confidence -= min(10, (workload - 5) * 2)

    confidence = min(max(45, confidence), 95)

    reasoning = (
        f"Based on historical baseline benchmarks for {category.lower()} complaints with '{severity}' severity, "
        f"adjusted for public verification (✅ {verifications}) and {dept} active queue burden ({workload} jobs)."
    )

    return {
        "predicted_resolution_days": predicted_days,
        "confidence_score": confidence,
        "reasoning": reasoning
    }
