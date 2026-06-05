from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import sys, os

sys.path.append(os.path.dirname(__file__))

from ai_engine.state_space import formulate_state_space, calculate_utility, get_state_space_summary
from ai_engine.search import run_algorithm_race
from ai_engine.csp_solver import apply_constraints, arc_consistency, backtrack_solve
from ai_engine.decision_agent import minimax, calculate_confidence, sensitivity_analysis, pareto_analysis
from database import create_tables, get_db, User
from security import hash_password, verify_password, create_access_token

app = FastAPI(title="MCDSS API", version="1.0.0")

# Create DB tables on startup
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Models ─────────────────────────────────────────────────
class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# ── Signup ──────────────────────────────────────────────────────
@app.post("/api/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")

    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Create new user
    user = User(
        full_name=request.full_name,
        email=request.email,
        hashed_password=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token({"sub": user.email, "name": user.full_name, "id": user.id})

    return {
        "success": True,
        "message": f"Welcome to MCDSS, {user.full_name}!",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }

# ── Login ────────────────────────────────────────────────────────
@app.post("/api/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email.")

    # Check password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    # Generate token
    token = create_access_token({"sub": user.email, "name": user.full_name, "id": user.id})

    return {
        "success": True,
        "message": f"Welcome back, {user.full_name}!",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }

# ── Decision Models ─────────────────────────────────────────────
class AlternativeInput(BaseModel):
    name: str
    scores: Dict[str, float]

class DecisionRequest(BaseModel):
    alternatives: List[AlternativeInput]
    criteria: List[str]
    weights: Dict[str, float]
    constraints: Optional[List[Dict]] = []
    pareto_criteria: Optional[List[str]] = []

# ── Main Analyse Endpoint ────────────────────────────────────────
@app.post("/api/analyse")
async def analyse_decision(request: DecisionRequest):
    try:
        data = {
            "alternatives": [{"name": a.name, "scores": a.scores} for a in request.alternatives],
            "criteria": request.criteria,
            "weights": request.weights,
            "constraints": request.constraints or []
        }

        problem = formulate_state_space(data)
        state_space_summary = get_state_space_summary(problem)

        alternatives_with_constraints, violation_report = apply_constraints(
            problem.alternatives, problem.constraints
        )
        arc_result = arc_consistency(problem.alternatives, problem.constraints)
        backtrack_result = backtrack_solve(problem.alternatives, problem.constraints, problem.weights)

        utility_results = []
        for alt in problem.alternatives:
            score, trace = calculate_utility(alt, problem.weights)
            alt.utility_score = score
            utility_results.append({
                "name": alt.name,
                "utility_score": score,
                "trace": trace,
                "passed_constraints": alt.constraints_passed,
                "failed_constraints": alt.failed_constraints
            })

        search_results = run_algorithm_race(problem.alternatives, problem.weights)
        minimax_result = minimax(problem.alternatives, problem.weights)
        confidence_result = calculate_confidence(problem.alternatives, problem.weights)
        sensitivity_result = sensitivity_analysis(problem.alternatives, problem.weights)

        pareto_result = None
        criteria_for_pareto = request.pareto_criteria if request.pareto_criteria else request.criteria[:2]
        if len(criteria_for_pareto) >= 2:
            pareto_result = pareto_analysis(problem.alternatives, criteria_for_pareto)

        winner_name = minimax_result.get("recommended") or (confidence_result["ranking"][0]["name"] if confidence_result.get("ranking") else None)

        reasoning_trace = [
            f"Step 1 ✅ CO1: Formulated {len(problem.alternatives)} alternatives as state space with {len(problem.criteria)} criteria",
            f"Step 2 ✅ CO3: CSP eliminated {sum(1 for r in violation_report if not r['passed'])} alternative(s) that violated constraints",
            f"Step 3 ✅ CO2: A* searched {len(problem.alternatives)} nodes — found '{search_results['astar']['best']}' as top candidate in {search_results['astar']['time_ms']}ms",
            f"Step 4 ✅ CO4: Minimax agent confirmed '{minimax_result['recommended']}' under worst-case scenario analysis",
            f"Step 5 ✅ CO4: Confidence score = {confidence_result['confidence']}% — {confidence_result['explanation']}",
            f"Result: '{winner_name}' recommended with {confidence_result['confidence']}% confidence"
        ]

        return {
            "success": True,
            "recommendation": {
                "winner": winner_name,
                "confidence": confidence_result["confidence"],
                "utility_score": minimax_result["utility_score"],
                "warning": confidence_result.get("warning")
            },
            "co1_state_space": state_space_summary,
            "co1_utility_scores": utility_results,
            "co2_search_results": search_results,
            "co3_constraints": {
                "violation_report": violation_report,
                "arc_consistency": arc_result,
                "backtrack_result": backtrack_result
            },
            "co4_decision": {
                "minimax": minimax_result,
                "confidence": confidence_result,
                "sensitivity": sensitivity_result,
                "pareto": pareto_result
            },
            "reasoning_trace": reasoning_trace
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates")
async def get_templates():
    return {
        "templates": [
            { "id": "laptop", "name": "Buy a Laptop", "icon": "💻", "description": "Compare laptops on price, performance, battery and build", "criteria": ["price","performance","battery","build_quality","weight"], "weights": {"price":0.30,"performance":0.30,"battery":0.20,"build_quality":0.10,"weight":0.10}, "alternatives": [{"name":"Dell Inspiron","scores":{"price":8,"performance":7,"battery":6,"build_quality":7,"weight":6}},{"name":"HP Pavilion","scores":{"price":7,"performance":8,"battery":7,"build_quality":7,"weight":7}},{"name":"MacBook Air","scores":{"price":3,"performance":10,"battery":9,"build_quality":10,"weight":9}},{"name":"Lenovo IdeaPad","scores":{"price":9,"performance":6,"battery":7,"build_quality":6,"weight":8}}], "constraints":[{"criteria":"price","operator":">=","value":5,"priority":2}] },
            { "id": "job", "name": "Choose a Job Offer", "icon": "💼", "description": "Evaluate job offers on salary, growth, culture and location", "criteria": ["salary","growth","work_life_balance","culture","location"], "weights": {"salary":0.30,"growth":0.25,"work_life_balance":0.20,"culture":0.15,"location":0.10}, "alternatives": [{"name":"Startup A","scores":{"salary":6,"growth":9,"work_life_balance":5,"culture":9,"location":7}},{"name":"MNC Corp B","scores":{"salary":9,"growth":6,"work_life_balance":7,"culture":6,"location":8}},{"name":"Mid-size Co C","scores":{"salary":7,"growth":7,"work_life_balance":8,"culture":7,"location":6}}], "constraints":[] },
            { "id": "college", "name": "Pick a College", "icon": "🎓", "description": "Compare colleges on ranking, fees, placement and campus", "criteria": ["ranking","fees_affordability","placement","campus_life","location"], "weights": {"ranking":0.30,"fees_affordability":0.25,"placement":0.25,"campus_life":0.10,"location":0.10}, "alternatives": [{"name":"College A","scores":{"ranking":9,"fees_affordability":5,"placement":9,"campus_life":8,"location":7}},{"name":"College B","scores":{"ranking":7,"fees_affordability":8,"placement":7,"campus_life":7,"location":8}},{"name":"College C","scores":{"ranking":6,"fees_affordability":9,"placement":6,"campus_life":6,"location":9}}], "constraints":[] },
            { "id": "flat", "name": "Rent a Flat", "icon": "🏠", "description": "Compare flats on rent, location, size and amenities", "criteria": ["affordability","location","size","amenities","safety"], "weights": {"affordability":0.35,"location":0.25,"size":0.15,"amenities":0.15,"safety":0.10}, "alternatives": [{"name":"City Centre Flat","scores":{"affordability":4,"location":10,"size":6,"amenities":8,"safety":8}},{"name":"Suburbs Flat","scores":{"affordability":8,"location":6,"size":9,"amenities":6,"safety":9}},{"name":"Mid-town Flat","scores":{"affordability":6,"location":8,"size":7,"amenities":7,"safety":7}}], "constraints":[{"criteria":"affordability","operator":">=","value":5,"priority":1}] }
        ]
    }

@app.get("/")
async def root():
    return {"message": "MCDSS API is running!", "version": "1.0.0"}