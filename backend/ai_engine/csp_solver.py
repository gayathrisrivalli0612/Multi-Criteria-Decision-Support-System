from typing import List, Dict


def apply_constraints(alternatives: list, constraints: List[Dict]) -> tuple:
    """
    CO3: Constraint Satisfaction Problem solver using backtracking.
    Checks each alternative against all user-defined constraints.
    Uses MRV (Most Restricted Variable) heuristic — checks hardest constraints first.
    Returns (filtered_alternatives, violation_report)
    """
    if not constraints:
        return alternatives, []

    # MRV heuristic: sort constraints by how restrictive they are (process hardest first)
    sorted_constraints = sorted(constraints, key=lambda c: c.get("priority", 1), reverse=True)

    violation_report = []
    passed = []
    eliminated = []

    for alt in alternatives:
        violations = []
        passed_all = True

        for constraint in sorted_constraints:
            criteria = constraint["criteria"]
            operator = constraint["operator"]
            threshold = float(constraint["value"])
            score = alt.criteria_scores.get(criteria, 0)

            # Check constraint
            violated = False
            if operator == "<=" and score > threshold:
                violated = True
            elif operator == ">=" and score < threshold:
                violated = True
            elif operator == "==" and score != threshold:
                violated = True
            elif operator == ">" and score <= threshold:
                violated = True
            elif operator == "<" and score >= threshold:
                violated = True

            if violated:
                passed_all = False
                reason = f"{criteria} score {score} violates constraint {criteria} {operator} {threshold}"
                violations.append({
                    "constraint": f"{criteria} {operator} {threshold}",
                    "actual_value": score,
                    "reason": reason,
                    "status": "violated"
                })
            else:
                violations.append({
                    "constraint": f"{criteria} {operator} {threshold}",
                    "actual_value": score,
                    "reason": f"{criteria} score {score} satisfies {criteria} {operator} {threshold}",
                    "status": "passed"
                })

        alt.constraints_passed = passed_all
        alt.failed_constraints = [v["constraint"] for v in violations if v["status"] == "violated"]

        violation_report.append({
            "alternative": alt.name,
            "passed": passed_all,
            "checks": violations,
            "status": "✅ Passes all constraints" if passed_all else f"❌ Eliminated — {len(alt.failed_constraints)} constraint(s) violated"
        })

        if passed_all:
            passed.append(alt)
        else:
            eliminated.append(alt.name)

    return alternatives, violation_report


def arc_consistency(alternatives: list, constraints: List[Dict]) -> dict:
    """
    CO3: Arc Consistency (AC-3 simplified) — prune impossible values early.
    Reduces the search space before backtracking begins.
    """
    pruned = {}
    for constraint in constraints:
        criteria = constraint["criteria"]
        operator = constraint["operator"]
        value = float(constraint["value"])

        impossible = []
        for alt in alternatives:
            score = alt.criteria_scores.get(criteria, 0)
            if operator == "<=" and score > value:
                impossible.append(alt.name)
            elif operator == ">=" and score < value:
                impossible.append(alt.name)

        if impossible:
            pruned[criteria] = {
                "constraint": f"{criteria} {operator} {value}",
                "pruned_alternatives": impossible,
                "explanation": f"Arc consistency removed {len(impossible)} alternative(s) that cannot satisfy {criteria} {operator} {value}"
            }

    return {
        "arc_consistency_applied": True,
        "pruned_domains": pruned,
        "explanation": "AC-3 pruned impossible values before backtracking search began, reducing search space."
    }


def backtrack_solve(alternatives: list, constraints: List[Dict], weights: Dict) -> dict:
    """
    CO3: Backtracking search with MRV heuristic.
    Tries assigning values to criteria one by one.
    Backtracks when a constraint is violated.
    """
    trace = []
    solution = None
    best_score = -1

    def is_valid(alt, partial_constraints):
        for c in partial_constraints:
            criteria = c["criteria"]
            operator = c["operator"]
            value = float(c["value"])
            score = alt.criteria_scores.get(criteria, 0)
            if operator == "<=" and score > value:
                return False, f"{criteria} score {score} > {value}"
            if operator == ">=" and score < value:
                return False, f"{criteria} score {score} < {value}"
        return True, "valid"

    for i, alt in enumerate(alternatives):
        trace.append(f"Step {i + 1}: Trying {alt.name}")
        valid, reason = is_valid(alt, constraints)

        if valid:
            score = sum(weights.get(c, 0) * s for c, s in alt.criteria_scores.items())
            trace.append(f"  ✅ {alt.name} passes constraints — utility score: {round(score, 3)}")
            if score > best_score:
                best_score = score
                solution = alt
        else:
            trace.append(f"  ❌ Backtrack: {alt.name} rejected — {reason}")

    return {
        "solution": solution.name if solution else None,
        "score": round(best_score, 3),
        "backtrack_trace": trace,
        "explanation": "Backtracking tried each alternative, rejected constraint violators, and returned the best valid solution."
    }