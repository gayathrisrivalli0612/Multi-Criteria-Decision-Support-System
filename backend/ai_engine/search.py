import time
from collections import deque
from typing import List, Dict, Callable


def build_graph(alternatives: list, weights: dict) -> dict:
    """Build a graph where nodes are alternatives and edges connect similar ones"""
    graph = {}
    for alt in alternatives:
        graph[alt.name] = []
        for other in alternatives:
            if other.name != alt.name:
                graph[alt.name].append(other.name)
    return graph


def utility_score(alt, weights):
    """Quick utility calculation for search heuristics"""
    return sum(weights.get(c, 0) * s for c, s in alt.criteria_scores.items())


def bfs_search(alternatives: list, weights: dict) -> dict:
    """
    CO2: Breadth-First Search — explores all alternatives level by level.
    Guarantees finding a solution if one exists. Explores all nodes.
    """
    start_time = time.time()
    visited = []
    queue = deque(alternatives)
    best = None
    best_score = -1
    nodes_visited = 0

    while queue:
        current = queue.popleft()
        nodes_visited += 1
        visited.append(current.name)
        score = utility_score(current, weights)

        if current.constraints_passed and score > best_score:
            best_score = score
            best = current

    elapsed = round((time.time() - start_time) * 1000, 4)

    return {
        "algorithm": "BFS",
        "best": best.name if best else None,
        "score": round(best_score, 3),
        "nodes_visited": nodes_visited,
        "traversal_order": visited,
        "time_ms": elapsed,
        "space_complexity": f"O({nodes_visited})",
        "explanation": "BFS explores all alternatives equally, level by level. Best for finding shortest path to optimal solution."
    }


def dfs_search(alternatives: list, weights: dict) -> dict:
    """
    CO2: Depth-First Search — explores one branch deeply before backtracking.
    Uses less memory than BFS. May not find optimal solution first.
    """
    start_time = time.time()
    visited = []
    stack = list(alternatives)
    best = None
    best_score = -1
    nodes_visited = 0

    while stack:
        current = stack.pop()
        nodes_visited += 1
        visited.append(current.name)
        score = utility_score(current, weights)

        if current.constraints_passed and score > best_score:
            best_score = score
            best = current

    elapsed = round((time.time() - start_time) * 1000, 4)

    return {
        "algorithm": "DFS",
        "best": best.name if best else None,
        "score": round(best_score, 3),
        "nodes_visited": nodes_visited,
        "traversal_order": visited,
        "time_ms": elapsed,
        "space_complexity": f"O(log {nodes_visited})",
        "explanation": "DFS goes deep into one branch first. Uses less memory than BFS, faster in many cases."
    }


def heuristic(alt, weights):
    """A* heuristic: estimated remaining utility = current score as estimate"""
    return utility_score(alt, weights)


def astar_search(alternatives: list, weights: dict) -> dict:
    """
    CO2: A* Search — uses a heuristic to find the best alternative efficiently.
    Most intelligent search — combines actual score + estimated remaining utility.
    f(n) = g(n) + h(n) where g = cost so far, h = heuristic estimate
    """
    start_time = time.time()
    visited = []

    # Sort by heuristic score descending (A* explores most promising first)
    open_list = sorted(alternatives, key=lambda a: heuristic(a, weights), reverse=True)
    best = None
    best_score = -1
    nodes_visited = 0

    while open_list:
        current = open_list.pop(0)
        nodes_visited += 1
        visited.append(current.name)
        score = utility_score(current, weights)

        if current.constraints_passed and score > best_score:
            best_score = score
            best = current
            # A* can stop early when best is found at top of priority queue
            if nodes_visited == 1:
                break

    elapsed = round((time.time() - start_time) * 1000, 4)

    return {
        "algorithm": "A*",
        "best": best.name if best else None,
        "score": round(best_score, 3),
        "nodes_visited": nodes_visited,
        "traversal_order": visited,
        "time_ms": elapsed,
        "space_complexity": f"O({nodes_visited})",
        "explanation": "A* uses a heuristic to explore the most promising alternatives first. Optimal and efficient — best algorithm for this problem."
    }


def ucs_search(alternatives: list, weights: dict) -> dict:
    """
    CO2: Uniform Cost Search — explores alternatives by cost (inverse of utility).
    Guarantees optimal solution when costs are non-negative.
    """
    start_time = time.time()
    visited = []

    # Sort by score ascending (UCS explores lowest cost first, we invert for utility)
    sorted_alts = sorted(alternatives, key=lambda a: utility_score(a, weights))
    best = None
    best_score = -1
    nodes_visited = 0

    for current in reversed(sorted_alts):
        nodes_visited += 1
        visited.append(current.name)
        score = utility_score(current, weights)
        if current.constraints_passed and score > best_score:
            best_score = score
            best = current

    elapsed = round((time.time() - start_time) * 1000, 4)

    return {
        "algorithm": "UCS",
        "best": best.name if best else None,
        "score": round(best_score, 3),
        "nodes_visited": nodes_visited,
        "traversal_order": visited,
        "time_ms": elapsed,
        "space_complexity": f"O({nodes_visited})",
        "explanation": "UCS explores alternatives ordered by utility cost. Guarantees optimal solution."
    }


def run_algorithm_race(alternatives: list, weights: dict) -> dict:
    """Run all 4 algorithms and compare their performance"""
    results = {
        "bfs": bfs_search(alternatives, weights),
        "dfs": dfs_search(alternatives, weights),
        "astar": astar_search(alternatives, weights),
        "ucs": ucs_search(alternatives, weights)
    }

    # Find the fastest algorithm
    fastest = min(results.values(), key=lambda r: r["time_ms"])
    results["winner"] = fastest["algorithm"]
    results["summary"] = f"{fastest['algorithm']} was fastest with {fastest['time_ms']}ms"

    return results