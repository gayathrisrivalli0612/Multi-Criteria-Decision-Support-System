from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class Alternative:
    """Represents one option the user wants to evaluate (e.g. HP Laptop)"""
    name: str
    criteria_scores: Dict[str, float]  # {"price": 8, "performance": 7}
    constraints_passed: bool = True
    failed_constraints: List[str] = field(default_factory=list)
    utility_score: float = 0.0


@dataclass
class DecisionProblem:
    """The full decision problem formatted as a state space (CO1)"""
    alternatives: List[Alternative]
    criteria: List[str]
    weights: Dict[str, float]  # {"price": 0.35, "performance": 0.30}
    constraints: List[Dict]  # [{"criteria": "price", "operator": "<=", "value": 8}]
    goal: str = "maximize_utility"


def formulate_state_space(data: dict) -> DecisionProblem:
    """
    CO1: Convert raw user input into a formal state space representation.
    This is the first step — turning the problem into something the AI can process.
    """
    alternatives = []
    for alt in data["alternatives"]:
        alternatives.append(Alternative(
            name=alt["name"],
            criteria_scores=alt["scores"]
        ))

    return DecisionProblem(
        alternatives=alternatives,
        criteria=data["criteria"],
        weights=data["weights"],
        constraints=data.get("constraints", []),
        goal="maximize_utility"
    )


def calculate_utility(alternative: Alternative, weights: Dict[str, float]) -> tuple:
    """
    CO1: Calculate weighted utility score for one alternative.
    Formula: score = sum(weight_i * criteria_score_i)
    Returns (final_score, trace) where trace explains every step.
    """
    trace = []
    total = 0.0

    for criteria, weight in weights.items():
        score = alternative.criteria_scores.get(criteria, 0)
        contribution = weight * score
        total += contribution
        trace.append({
            "criteria": criteria,
            "weight": round(weight, 3),
            "score": score,
            "contribution": round(contribution, 3),
            "explanation": f"{criteria}: {score}/10 × {round(weight * 100)}% weight = {round(contribution, 3)}"
        })

    return round(total, 3), trace


def get_state_space_summary(problem: DecisionProblem) -> dict:
    """Returns a summary of the state space for display in the UI"""
    return {
        "total_states": len(problem.alternatives),
        "total_criteria": len(problem.criteria),
        "goal": problem.goal,
        "actions": ["assign_weight", "score_criteria", "apply_constraint", "evaluate_utility"],
        "transitions": f"{len(problem.alternatives)} alternatives × {len(problem.criteria)} criteria = {len(problem.alternatives) * len(problem.criteria)} state transitions",
        "representation": {
            "states": [a.name for a in problem.alternatives],
            "criteria": problem.criteria,
            "weights": problem.weights
        }
    }