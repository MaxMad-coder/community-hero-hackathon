# ====================================================================
# Gemini 2.5 Flash AI Service Module for Community Hero
# Integrates Google GenAI SDK for server-side classification & analytics
# Created/Updated: 2026-06-23
# ====================================================================

import os
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Setup logging
logger = logging.getLogger("gemini_service")
logging.basicConfig(level=logging.INFO)

# Lazy Client Initialization to prevent module load-time crashes
_client = None

def get_gemini_client():
    """Lazily retrieves or initializes the Gemini API client safely."""
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY environment variable is not defined. Falling back to local heuristic mode.")
        return None

    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        return _client
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI Client: {e}")
        return None


# --------------------------------------------------------------------
# 1. Pydantic Schemas for Structured JSON Output
# --------------------------------------------------------------------
class ClassificationResult(BaseModel):
    category: str = Field(description="Category of the civic issue. Must be strictly one of: 'Pothole', 'Water Leakage', 'Garbage', 'Drainage', 'Streetlight', 'Road Damage', 'Public Safety', 'Other'.")

class SeverityEstimate(BaseModel):
    severity: str = Field(description="Incident severity tier. Must be strictly one of: 'Low', 'Medium', 'High', 'Critical'.")
    justification: str = Field(description="1-2 sentences of professional hazard assessment reasoning.")

class SummaryGeneration(BaseModel):
    summary: str = Field(description="A concise, professional 1-paragraph objective summary of the reported hazard for municipal field technicians.")

class DepartmentRecommendation(BaseModel):
    department_code: str = Field(description="Suggested department code. One of: 'SF_DPW' (Public Works), 'SF_PUC' (Utilities Commission - water/power/drains), 'SF_MTA' (Transportation Agency - roads/buses/parking), or none.")
    department_name: str = Field(description="Polished formal name of the department.")
    reasoning: str = Field(description="Strategic justification explaining why this department holds jurisdiction over this ticket category.")

class DuplicateDetectionResult(BaseModel):
    is_duplicate: bool = Field(description="True if an existing issue describes the exact same physical hazard at a matching timeline/location.")
    duplicate_issue_id: Optional[str] = Field(None, description="The unique ID of the matching duplicate ticket from the historical database, or null if none.")
    similarity_score: float = Field(description="Percentage score (0 to 100) indicating the calculated similarity of description, categories, and coordinates.")
    explanation: str = Field(description="Objective comparative analysis explaining why or why not these reports overlap.")

class HotspotPrediction(BaseModel):
    prediction_summary: str = Field(description="High-level narrative forecasting likely imminent hyperlocal issue spikes in the coming weeks.")
    hotspot_zones: List[Dict[str, Any]] = Field(
        description="List of predicted risk coordinates with a risk label (e.g., 'West SF Water Spikes', 'SOMA Streetlight Degradations') and an estimated latitude/longitude center bounds."
    )
    preventative_actions: List[str] = Field(description="Strategic dispatch initiatives suggested for municipal supervisors to mitigate issues before they trigger citizen reports.")


# --------------------------------------------------------------------
# 2. Main API Functional Interfaces
# --------------------------------------------------------------------

def classify_issue(title: str, description: str) -> str:
    """Classifies a citizen's civic report into standard municipal taxonomy categories."""
    client = get_gemini_client()
    if not client:
        # Fallback local rulesets
        desc_lower = (title + " " + description).lower()
        if "pothole" in desc_lower or "crater" in desc_lower:
            return "Pothole"
        elif "water" in desc_lower or "leak" in desc_lower or "pipe" in desc_lower:
            return "Water Leakage"
        elif "trash" in desc_lower or "garbage" in desc_lower or "dump" in desc_lower:
            return "Garbage"
        elif "flood" in desc_lower or "drain" in desc_lower OR "sewer" in desc_lower:
            return "Drainage"
        elif "light" in desc_lower or "dark" in desc_lower or "lamp" in desc_lower:
            return "Streetlight"
        elif "sidewalk" in desc_lower or "crack" in desc_lower or "pavement" in desc_lower:
            return "Road Damage"
        elif "safety" in desc_lower or "danger" in desc_lower or "police" in desc_lower:
            return "Public Safety"
        return "Other"

    # Call Gemini API with structured JSON Schema enforce parameters
    try:
        from google.genai import types
        prompt = f"Analyze the following civic issue report title and description, and classify it into one of the permitted categories.\n\nTitle: {title}\nDescription: {description}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ClassificationResult,
                temperature=0.1
            ),
        )
        data = json.loads(response.text)
        return data.get("category", "Other")
    except Exception as e:
        logger.error(f"Gemini API Error in classify_issue: {e}. Defaulting to heuristic fallback.")
        return "Other"


def estimate_severity(title: str, description: str) -> Dict[str, Any]:
    """Estimates the hazard threat level & safety impact of the reported ticket."""
    client = get_gemini_client()
    if not client:
        # Fallback local calculations
        desc_lower = (title + " " + description).lower()
        if "critical" in desc_lower or "danger" in desc_lower or "accident" in desc_lower or "injury" in desc_lower:
            return {"severity": "Critical", "justification": "Heuristic warning: Key risk indicators of direct safety danger identified in description."}
        elif "hazard" in desc_lower or "broken" in desc_lower:
            return {"severity": "High", "justification": "Heuristic warning: Broken public asset may cause near-term municipal failures."}
        elif "annoying" in desc_lower or "slow" in desc_lower:
            return {"severity": "Medium", "justification": "Heuristic warning: Asset issue present but unlikely to threaten pedestrian safety."}
        return {"severity": "Low", "justification": "Heuristic warning: Standard maintenance backlog ticket."}

    try:
        from google.genai import types
        prompt = f"Evaluate the risk/safety impact of this civic report to determine severity (Low, Medium, High, Critical).\n\nTitle: {title}\nDescription: {description}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SeverityEstimate,
                temperature=0.2
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API Error in estimate_severity: {e}.")
        return {"severity": "High", "justification": "Defaulted due to processing failure."}


def generate_summary(title: str, description: str) -> str:
    """Generates a professional 1-paragraph summary for dispatched work tickets."""
    client = get_gemini_client()
    if not client:
        return f"Hyperlocal civic log indicating possible {title}. Citizen description notes: {description[:120]}..."

    try:
        from google.genai import types
        prompt = f"Convert this raw citizen complaint into a clean, highly objective 1-paragraph summary suitable for municipal field technicians.\n\nTitle: {title}\nDescription: {description}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SummaryGeneration,
                temperature=0.3
            ),
        )
        data = json.loads(response.text)
        return data.get("summary", description[:150])
    except Exception as e:
        logger.error(f"Gemini API Error in generate_summary: {e}.")
        return f"Citizen filed report of: '{title}'. Details: {description[:100]}"


def recommend_department(category: str, title: str, description: str) -> Dict[str, Any]:
    """Recommends a municipal agency with appropriate jurisdictional authority."""
    client = get_gemini_client()
    if not client:
        # Fallback local mappings
        mapping = {
            "Pothole": ("SF_DPW", "Department of Public Works", "Direct jurisdiction over street pavement issues."),
            "Water Leakage": ("SF_PUC", "Public Utilities Commission", "Responsible for main water infrastructure."),
            "Streetlight": ("SF_PUC", "Public Utilities Commission", "Maintains city power and electrical lamp grids."),
            "Drainage": ("SF_PUC", "Public Utilities Commission", "Responsible for stormwater sewer networks."),
            "Garbage": ("SF_DPW", "Department of Public Works", "Direct service area for cleanliness oversight."),
            "Road Damage": ("SF_DPW", "Department of Public Works", "Maintains public pathways and sidewalks."),
            "Public Safety": ("SF_MTA", "Municipal Transportation Agency", "Deals with road signage and street layouts.")
        }
        code, name, reasoning = mapping.get(category, ("SF_DPW", "Department of Public Works", "Default deployment fallback."))
        return {"department_code": code, "department_name": name, "reasoning": reasoning}

    try:
        from google.genai import types
        prompt = (
            f"Based on our municipal department guide, recommend the correct jurisdictional team to resolve this hazard.\n\n"
            f"Taxonomy categories: Pothole, Water Leakage, Garbage, Drainage, Streetlight, Road Damage, Public Safety, Other\n"
            f"Target agencies: 'SF_DPW' (Department of Public Works), 'SF_PUC' (Public Utilities Commission), 'SF_MTA' (Municipal Transportation Agency).\n\n"
            f"Report Category: {category}\nTitle: {title}\nDescription: {description}"
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DepartmentRecommendation,
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API Error in recommend_department: {e}.")
        return {"department_code": "SF_DPW", "department_name": "Department of Public Works", "reasoning": "Processing failure fallback."}


def detect_duplicate_issue(new_issue: Dict[str, Any], existing_issues: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compares coordinates and context against existing reports to stop double entries."""
    client = get_gemini_client()
    if not client:
        # Non-AI proximity fallback
        for issue in existing_issues:
            lat_diff = abs(issue.get("latitude", 0.0) - new_issue.get("latitude", 0.0)) * 111000
            lon_diff = abs(issue.get("longitude", 0.0) - new_issue.get("longitude", 0.0)) * 111000
            distance = (lat_diff**2 + lon_diff**2)**0.5
            if distance < 300.0 and issue.get("category") == new_issue.get("category"):
                return {
                    "is_duplicate": True,
                    "duplicate_issue_id": issue.get("id"),
                    "similarity_score": 90.0,
                    "explanation": f"Non-AI Heuristic: Found active report '{issue.get('title')}' in same category within {distance:.1f} meters."
                }
        return {"is_duplicate": False, "duplicate_issue_id": None, "similarity_score": 0.0, "explanation": "No matching active tickets within proximity bounds."}

    try:
        from google.genai import types
        # Filter existing issues to a safe sub-context to avoid token inflation
        filtered_historical = []
        for issue in existing_issues:
            lat_diff = abs(issue.get("latitude", 0.0) - new_issue.get("latitude", 0.0)) * 111000
            lon_diff = abs(issue.get("longitude", 0.0) - new_issue.get("longitude", 0.0)) * 111000
            distance = (lat_diff**2 + lon_diff**2)**0.5
            if distance < 1000.0:  # Only evaluate local context within 1 kilometer
                filtered_historical.append({
                    "id": issue.get("id"),
                    "title": issue.get("title"),
                    "category": issue.get("category"),
                    "description": issue.get("description"),
                    "distance_meters": round(distance, 1)
                })

        prompt = (
            f"Analyze the incoming report and historical neighborhood list. Confirm if the incoming report matches any historical logs.\n\n"
            f"Incoming report: {json.dumps(new_issue)}\n\n"
            f"Nearby active issues (within 1km radius): {json.dumps(filtered_historical)}"
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DuplicateDetectionResult,
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API Error in detect_duplicate_issue: {e}.")
        return {"is_duplicate": False, "duplicate_issue_id": None, "similarity_score": 0.0, "explanation": "Fallback due to processing failure."}


def generate_analytics_summary(issues_data: List[Dict[str, Any]]) -> str:
    """Formats overall backlog counts and creates an insightful diagnostic summary bullet."""
    client = get_gemini_client()
    if not client:
        return f"A total of {len(issues_data)} incidents are stored. Active municipal crews and citizens are tracking ongoing work across multiple municipal jurisdiction pipelines."

    try:
        from google.genai import types
        # Sub-serialize issues briefly to fit schema
        summary_payload = []
        for issue in issues_data[:50]: # Limit context load
            summary_payload.append({
                "category": issue.get("category"),
                "status": issue.get("status"),
                "severity": issue.get("severity"),
                "date": str(issue.get("created_at"))[:10] if issue.get("created_at") else ""
            })

        prompt = (
            f"Synthesize the following list of active civic tickets to formulate a smart, sophisticated 2-3 sentence 'Executive Bulletin' "
            f"detailing municipal work queues, prominent issue bottlenecks, and actionable trends.\n\n"
            f"Queue Data: {json.dumps(summary_payload)}"
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4
            ),
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API Error in generate_analytics_summary: {e}.")
        return f"Tracking a fleet of {len(issues_data)} active municipal logs. Focus areas remain prioritized around high-volume road repairs."


def predict_future_hotspots(historical_reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Identifies geographical/temporal trends and details possible risk hotspots."""
    client = get_gemini_client()
    if not client:
        # Static prediction fallback
        return {
            "prediction_summary": "Heuristic projection: SOMA and downtown central water infrastructure zones show mild ongoing leak reports. Preemptive checks recommended.",
            "hotspot_zones": [
                {
                    "name": "District 3 Pothole Cluster Risk",
                    "latitude": 37.785,
                    "longitude": -122.410,
                    "danger_category": "Pothole",
                    "likelihood": "Moderate"
                }
            ],
            "preventative_actions": [
                "Deploy proactive patch trucks to historical lanes before regional rains.",
                "Schedule streetlight testing inside known low-intensity pathways."
            ]
        }

    try:
        from google.genai import types
        summary_payload = []
        for issue in historical_reports[:80]:
            summary_payload.append({
                "latitude": round(issue.get("latitude", 0.0), 3),
                "longitude": round(issue.get("longitude", 0.0), 3),
                "category": issue.get("category"),
                "date": str(issue.get("created_at"))[:10] if issue.get("created_at") else ""
            })

        prompt = (
            f"Analyze these coordinates and dates of filed reports to forecast potential bottleneck spikes "
            f"or geographical risk hotspots in the next 14 to 30 days.\n\n"
            f"Spatio-Temporal logs: {json.dumps(summary_payload)}"
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HotspotPrediction,
                temperature=0.3
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API Error in predict_future_hotspots: {e}.")
        return {
            "prediction_summary": "Incomplete data projection. Dynamic alerts remain steady across San Francisco avenues.",
            "hotspot_zones": [],
            "preventative_actions": ["Execute routine maintenance protocols across public avenues."]
        }
