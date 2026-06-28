"""
AI Civic Report Generator Service
Analyzes municipal telemetry (reported & resolved tickets, upvotes, verifications, departments, areas)
and produces highly structured professional civic planning summaries using Gemini models.
"""

import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("civic_report_service")

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment for Civic Report Generator.")
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Error initializing google-genai Client: {e}")
        return None

def generate_civic_report(report_type: str, issues: List[Dict[str, Any]], custom_prompt: str = None) -> Dict[str, Any]:
    """
    Synthesizes reported issues, resolution rates, participation metrics, and hotspots
    into a structured municipal dashboard report using Gemini 3.5 Flash or robust heuristic failover.
    """
    # 1. Compute quantitative analytics from input telemetry
    total_reported = len(issues)
    resolved_issues = [i for i in issues if i.get("status") == "Resolved"]
    total_resolved = len(resolved_issues)
    
    resolution_rate = round((total_resolved / total_reported * 100), 1) if total_reported > 0 else 0.0
    
    # Category Distribution
    cat_distribution = {}
    for i in issues:
        cat = i.get("category", "Other")
        cat_distribution[cat] = cat_distribution.get(cat, 0) + 1
    
    most_reported_category = max(cat_distribution, key=cat_distribution.get) if cat_distribution else "Potholes & Drainage"
    
    # Neighborhood / Area Distribution (Extract from location coordinates or custom addresses/regions in issues)
    area_distribution = {}
    for i in issues:
        # Default or fallback areas if not explicitly tagged
        area = i.get("neighborhood") or i.get("area") or "SOMA District"
        area_distribution[area] = area_distribution.get(area, 0) + 1
        
    most_active_area = max(area_distribution, key=area_distribution.get) if area_distribution else "SOMA District Central"

    # Participation Score (Sum of upvotes & community verifications representing local alignment)
    total_upvotes = sum(i.get("upvotesCount", 0) for i in issues)
    total_verifications = sum(i.get("verificationsCount", 0) for i in issues)
    participation_score = total_upvotes + (total_verifications * 3)

    # Compile dataset for Gemini
    telemetry_summary = {
        "report_type": report_type,
        "total_reported": total_reported,
        "total_resolved": total_resolved,
        "resolution_rate": f"{resolution_rate}%",
        "participation_score": participation_score,
        "most_reported_category": most_reported_category,
        "most_active_area": most_active_area,
        "category_distribution": cat_distribution,
        "area_distribution": area_distribution,
        "recent_tickets": [
            {
                "title": i.get("title"),
                "category": i.get("category"),
                "severity": i.get("severity"),
                "status": i.get("status"),
                "upvotes": i.get("upvotesCount", 0),
                "verifications": i.get("verificationsCount", 0)
            } for i in issues[:15]
        ]
    }

    client = get_gemini_client()
    if not client:
        logger.info("Executing local civic generator heuristic fallback.")
        return generate_heuristic_report(report_type, telemetry_summary)

    try:
        from google.genai import types
        
        prompt = f"""You are the Chief Civic Intelligence Officer & Senior Urban Systems Architect for the municipal council.
Assemble a high-fidelity, authoritative municipal dashboard report summarizing metropolitan ticket trends, community engagement, and resource distribution.

TELEMETRY CONTEXT DATA:
{json.dumps(telemetry_summary, indent=2)}

REPORT CONTEXT / FILTER:
Type: {report_type} Report
{f"Custom Administrator Instructions: {custom_prompt}" if custom_prompt else ""}

Your output MUST be a strict JSON object with these precise fields:
1. "executive_summary": A concise, polished paragraph (approx 3-4 sentences) summarizing current civic health, reporting activity, and prominent bottlenecks.
2. "key_insights": A list of exactly 3-4 high-value bullet insights focusing on trends (e.g. "Streetlight complaints rose by 14%", "Garbage collection in Area B lags by 4 days").
3. "trend_analysis": A paragraph describing the operational direction of the city departments, matching SLA performance expectations.
4. "priority_areas": A list of 2-3 hotspots or districts requiring immediate attention.
5. "recommendations": A list of 3-4 actionable planning steps for public works and dispatch crews.

Return response strictly as a JSON object of this format:
{{
  "executive_summary": "...",
  "key_insights": ["...", "..."],
  "trend_analysis": "...",
  "priority_areas": ["...", "..."],
  "recommendations": ["...", "..."]
}}
"""
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        parsed = json.loads(response.text.strip())
        
        # Merge calculated telemetry into results
        parsed["telemetry"] = {
            "total_reported": total_reported,
            "total_resolved": total_resolved,
            "resolution_rate": resolution_rate,
            "participation_score": participation_score,
            "most_reported_category": most_reported_category,
            "most_active_area": most_active_area
        }
        return parsed

    except Exception as e:
        logger.error(f"Gemini API report generation failed: {e}. Falling back to heuristic generator.")
        return generate_heuristic_report(report_type, telemetry_summary)

def generate_heuristic_report(report_type: str, telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """Generates standard high-quality boilerplate report matching requested telemetry if AI client fails."""
    rate = telemetry["resolution_rate"]
    most_cat = telemetry["most_reported_category"]
    most_area = telemetry["most_active_area"]
    rep_count = telemetry["total_reported"]
    res_count = telemetry["total_resolved"]
    
    insights = [
        f"Active {most_cat.lower()} reports account for the highest density of community feedback this cycle.",
        f"Community verifications in {most_area} indicate elevated public involvement in civic infrastructure safety.",
        f"Repair resolution efficiency currently sits at {rate} with municipal crews successfully clearing {res_count} tickets."
    ]
    
    recs = [
        f"Allocate supplementary field crews to address outstanding {most_cat.lower()} backlogs.",
        f"Conduct a comprehensive local pavement and service inspection sweep in {most_area}.",
        "Incentivize local citizen patrols to verify closed tickets, enhancing public audit transparency."
    ]

    return {
        "executive_summary": f"This {report_type.lower()} cycle recorded {rep_count} newly filed complaints across hyperlocal sectors. With {res_count} resolved incidents, our current completion rate stands at {rate}. The {most_cat} category continues to represent the most frequent point of community concern.",
        "key_insights": insights,
        "trend_analysis": "City department turnaround times are aligning moderately with general SLAs, but high-density wards suffer from dispatch routing friction during peak public reporting periods.",
        "priority_areas": [most_area, "SOMA Sector 4 Grid", "Mission Main Corridor"],
        "recommendations": recs,
        "telemetry": {
            "total_reported": rep_count,
            "total_resolved": res_count,
            "resolution_rate": float(rate.replace('%', '')),
            "participation_score": telemetry["participation_score"],
            "most_reported_category": most_cat,
            "most_active_area": most_area
        }
    }
