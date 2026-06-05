from typing import List, Dict


def utility(alt, weights: Dict) -> float:
    """CO4: Utility function — calculates how good an alternative is"""
    return sum(weights.get(c, 0) * s for c, s in alt.criteria_scores.items())


def minimax(alternatives: list, weights: Dict, depth: int = 2, maximizing: bool = True) -> dict:
    """
    CO4: Minimax algorithm for decision making.
    MAX player = the user (wants the best alternative)
    MIN player = the environment/worst-case (simulates adversarial conditions)
    Explores the decision tree to find the safest best choice.
    """
    tree_nodes = []

    def minimax_recursive(alts, d, is_max, alpha=-999, beta=999):
        if d == 0 or len(alts) == 1:
            scores = [(a, utility(a, weights)) for a in alts if a.constraints_passed]
            if not scores:
                return None, -999
            if is_max:
                best = max(scores, key=lambda x: x[1])
            else:
                best = min(scores, key=lambda x: x[1])
            return best[0], round(best[1], 3)

        valid_alts = [a for a in alts if a.constraints_passed]
        if not valid_alts:
            return None, -999

        if is_max:
            best_alt = None
            best_val = -999
            for alt in valid_alts:
                score = utility(alt, weights)
                tree_nodes.append({
                    "name": alt.name,
                    "score": round(score, 3),
                    "depth": d,
                    "player": "MAX",
                    "selected": False
                })
                if score > best_val:
                    best_val = score
                    best_alt = alt
                alpha = max(alpha, best_val)
                if beta <= alpha:
                    break  # Alpha-beta pruning
            return best_alt, round(best_val, 3)
        else:
            best_alt = None
            best_val = 999
            for alt in valid_alts:
                score = utility(alt, weights)
                tree_nodes.append({
                    "name": alt.name,
                    "score": round(score, 3),
                    "depth": d,
                    "player": "MIN",
                    "selected": False
                })
                if score < best_val:
                    best_val = score
                    best_alt = alt
                beta = min(beta, best_val)
                if beta <= alpha:
                    break  # Alpha-beta pruning
            return best_alt, round(best_val, 3)

    best_alt, best_score = minimax_recursive(alternatives, depth, maximizing)

    # Mark the winning node
    for node in tree_nodes:
        if best_alt and node["name"] == best_alt.name:
            node["selected"] = True

    return {
        "recommended": best_alt.name if best_alt else None,
        "utility_score": best_score,
        "tree_nodes": tree_nodes,
        "explanation": f"Minimax explored {len(tree_nodes)} nodes in the decision tree and selected {best_alt.name if best_alt else 'none'} as the optimal choice under worst-case assumptions."
    }


def calculate_confidence(alternatives: list, weights: Dict) -> dict:
    """
    CO4: Calculate confidence score for the recommendation.
    Confidence = how far ahead the winner is from the second-best option.
    """
    valid = [(a, utility(a, weights)) for a in alternatives if a.constraints_passed]
    if not valid:
        return {"confidence": 0, "explanation": "No valid alternatives after constraints"}

    valid.sort(key=lambda x: x[1], reverse=True)
    winner = valid[0]

    if len(valid) == 1:
        confidence = 95.0
        margin = winner[1]
        explanation = "Only one valid alternative remains after constraints."
    else:
        second = valid[1]
        margin = winner[1] - second[1]
        max_possible = 10.0
        confidence = round(min(95, 50 + (margin / max_possible) * 500), 1)
        explanation = f"{winner[0].name} leads by {round(margin, 3)} points over {second[0].name}. {'Strong lead — high confidence.' if confidence > 75 else 'Close race — consider reviewing weights.'}"

    return {
        "confidence": confidence,
        "margin": round(margin, 3),
        "ranking": [{"name": a.name, "score": round(s, 3)} for a, s in valid],
        "explanation": explanation,
        "warning": "⚠️ Very close scores — small weight changes may flip the result." if confidence < 65 else None
    }


def sensitivity_analysis(alternatives: list, weights: Dict) -> dict:
    """
    CO4: Sensitivity Analysis — finds the 'flip point'.
    How much would weights need to change to get a different winner?
    """
    valid = [(a, utility(a, weights)) for a in alternatives if a.constraints_passed]
    if len(valid) < 2:
        return {"analysis": "Not enough alternatives for sensitivity analysis"}

    valid.sort(key=lambda x: x[1], reverse=True)
    winner = valid[0][0]
    runner_up = valid[1][0]
    margin = valid[0][1] - valid[1][1]

    insights = []
    for criteria in weights:
        w = weights[criteria]
        winner_score = winner.criteria_scores.get(criteria, 0)
        runner_score = runner_up.criteria_scores.get(criteria, 0)
        diff = winner_score - runner_score

        if diff != 0:
            # How much weight change needed to flip result
            flip_change = round((margin / abs(diff)) * 100, 1) if diff != 0 else 999
            insights.append({
                "criteria": criteria,
                "current_weight_pct": round(w * 100, 1),
                "flip_change_pct": flip_change,
                "favors": winner.name if diff > 0 else runner_up.name,
                "insight": f"If '{criteria}' weight changes by {flip_change}%, '{runner_up.name}' could become the winner."
            })

    insights.sort(key=lambda x: x["flip_change_pct"])

    return {
        "winner": winner.name,
        "runner_up": runner_up.name,
        "margin": round(margin, 3),
        "most_sensitive_criteria": insights[0]["criteria"] if insights else None,
        "insights": insights,
        "summary": f"'{winner.name}' is most vulnerable to changes in '{insights[0]['criteria']}' — a {insights[0]['flip_change_pct']}% weight shift could change the result." if insights else "Result is stable."
    }


def pareto_analysis(alternatives: list, criteria_pair: list) -> dict:
    """
    CO4: Pareto front analysis — finds alternatives where you can't improve
    one criteria without worsening another (true trade-off frontier).
    """
    if len(criteria_pair) < 2:
        return {"pareto_front": [], "dominated": []}

    c1, c2 = criteria_pair[0], criteria_pair[1]
    pareto_front = []
    dominated = []

    for alt in alternatives:
        if not alt.constraints_passed:
            continue
        is_dominated = False
        for other in alternatives:
            if other.name == alt.name or not other.constraints_passed:
                continue
            # other dominates alt if it's better in both criteria
            if (other.criteria_scores.get(c1, 0) >= alt.criteria_scores.get(c1, 0) and
                    other.criteria_scores.get(c2, 0) >= alt.criteria_scores.get(c2, 0) and
                    (other.criteria_scores.get(c1, 0) > alt.criteria_scores.get(c1, 0) or
                     other.criteria_scores.get(c2, 0) > alt.criteria_scores.get(c2, 0))):
                is_dominated = True
                break

        if is_dominated:
            dominated.append(alt.name)
        else:
            pareto_front.append({
                "name": alt.name,
                "x": alt.criteria_scores.get(c1, 0),
                "y": alt.criteria_scores.get(c2, 0),
                "x_label": c1,
                "y_label": c2
            })

    return {
        "pareto_front": pareto_front,
        "dominated": dominated,
        "x_axis": c1,
        "y_axis": c2,
        "explanation": f"Pareto-optimal alternatives on the {c1} vs {c2} trade-off frontier. These cannot be improved on one criteria without sacrificing the other."
    }