<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: N/A → 1.0.0 (Initial creation)

Modified principles: N/A (new constitution)

Added sections:
- Core Principles (5 principles)
- Project Standards
- Development Workflow
- Governance

Removed sections: N/A

Templates requiring updates:
- .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
- .specify/templates/spec-template.md: ✅ Compatible (User stories & requirements align)
- .specify/templates/tasks-template.md: ✅ Compatible (Test-first workflow supported)

Follow-up TODOs: None
================================================================================
-->

# Algorithm Constitution

## Core Principles

### I. Clean Code & Readability

Every algorithm solution MUST prioritize clarity over cleverness. Code is read far more
often than it is written.

**Non-negotiable rules:**
- Variable names MUST be descriptive (`left_pointer` not `l`, `current_sum` not `cs`)
- Complex logic MUST include inline comments explaining the reasoning
- Each function MUST have a single, clear responsibility
- Magic numbers MUST be replaced with named constants
- Code structure MUST follow consistent formatting (PEP 8 for Python)

**Rationale:** Clean code accelerates learning, makes debugging easier, and builds habits
that transfer directly to production environments and technical interviews.

### II. Test-First Development

Tests MUST be written before implementation. This ensures correctness and documents
expected behavior.

**Non-negotiable rules:**
- Every solution MUST include test cases before the implementation
- Test cases MUST cover: basic examples, edge cases, and boundary conditions
- Tests MUST fail initially (Red), then pass after implementation (Green)
- Refactoring MUST only occur after tests pass

**Rationale:** Test-first development catches errors early, clarifies requirements before
coding, and provides confidence when optimizing solutions.

### III. Complexity Analysis

Every solution MUST include time and space complexity analysis. Understanding Big-O is
fundamental to algorithm mastery.

**Non-negotiable rules:**
- Time complexity MUST be documented using Big-O notation
- Space complexity MUST be documented (including auxiliary space)
- Analysis MUST explain the reasoning, not just state the result
- Multiple solutions MUST compare complexities to justify the optimal choice
- Trade-offs between time and space MUST be explicitly discussed

**Rationale:** Complexity analysis is essential for technical interviews, system design,
and choosing appropriate algorithms for real-world constraints.

### IV. Language Consistency

Python is the primary language for all algorithm implementations. Consistency enables
deeper mastery and pattern recognition.

**Non-negotiable rules:**
- All solutions MUST be implemented in Python 3.10+
- Pythonic idioms MUST be used (list comprehensions, generators, context managers)
- Standard library data structures MUST be preferred (collections, heapq, bisect)
- Type hints SHOULD be included for function signatures
- Solutions MUST NOT use external dependencies unless explicitly justified

**Rationale:** Mastering one language deeply builds transferable algorithmic thinking.
Python's readability aligns with the Clean Code principle and is widely accepted in
technical interviews.

### V. Problem Categorization & Documentation

Problems MUST be organized by algorithm pattern and include comprehensive documentation.
Pattern recognition is key to solving new problems efficiently.

**Non-negotiable rules:**
- Each solution MUST be categorized by primary algorithm/pattern (e.g., Two Pointers,
  Dynamic Programming, Graph Traversal)
- Problem source and difficulty MUST be documented (e.g., LeetCode #123, Medium)
- Solution approach MUST be explained in plain language before the code
- Alternative approaches SHOULD be noted with complexity trade-offs
- Common mistakes or gotchas SHOULD be documented for future reference

**Rationale:** Systematic categorization builds mental models for pattern matching.
Documentation reinforces learning and creates a personal reference library.

## Project Standards

**Directory Structure:**
```text
src/
├── arrays/           # Array manipulation problems
├── strings/          # String problems
├── linked_lists/     # Linked list problems
├── trees/            # Tree and BST problems
├── graphs/           # Graph algorithms
├── dynamic_programming/
├── sorting_searching/
├── two_pointers/
├── sliding_window/
└── utils/            # Shared utilities

tests/
├── arrays/
├── strings/
└── [mirrors src structure]
```

**File Naming Convention:**
- Problem files: `{problem_number}_{problem_name}.py` (e.g., `0001_two_sum.py`)
- Test files: `test_{problem_number}_{problem_name}.py`

**Solution File Template:**
Each solution file MUST include:
1. Problem description (brief)
2. Complexity analysis (Time & Space)
3. Approach explanation
4. Implementation
5. Test cases (at minimum)

## Development Workflow

**For each problem:**

1. **Understand** - Read problem, identify pattern category
2. **Plan** - Write approach in comments, determine complexity target
3. **Test** - Write test cases covering normal, edge, and boundary cases
4. **Implement** - Write solution to pass tests
5. **Analyze** - Verify complexity matches expectations
6. **Optimize** - If suboptimal, implement better solution and compare
7. **Document** - Add categorization, notes, and alternative approaches

**Commit Convention:**
```
feat(category): add problem_number problem_name
fix(category): correct edge case in problem_name
refactor(category): optimize problem_name from O(n²) to O(n)
docs(category): add explanation for problem_name
```

## Governance

This constitution establishes the foundational practices for the Algorithm project.
All contributions and solutions MUST comply with these principles.

**Amendment Process:**
1. Propose change with clear rationale
2. Document impact on existing solutions
3. Update constitution version following semantic versioning
4. Update dependent templates if affected

**Version Policy:**
- MAJOR: Principle removal or fundamental redefinition
- MINOR: New principle added or existing principle significantly expanded
- PATCH: Clarifications, wording improvements, non-breaking refinements

**Compliance:**
- Self-review against principles before committing
- Constitution Check in plan.md MUST verify alignment
- Deviations MUST be explicitly justified in Complexity Tracking

**Version**: 1.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12
