<!--
  SYNC IMPACT REPORT
  ==================
  Version change: N/A (initial template) → 1.0.0
  Added sections:
    - Core Principles: I. KISS, II. Clean Code, III. TDD, IV. Minimum Code, V. Minimal Comments
    - Code Quality Standards
    - Development Workflow
    - Governance
  Modified principles: none (first ratification)
  Removed sections: none
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (Constitution Check gate is generic — no changes needed)
    - .specify/templates/spec-template.md ✅ (no structural changes required)
    - .specify/templates/tasks-template.md ✅ (TDD write-tests-first ordering already reflected)
    - .specify/templates/checklist-template.md ✅ (no changes required)
  Follow-up TODOs: none
-->

# Angular PocketBase POC Constitution

## Core Principles

### I. KISS — Keep It Simple

Every solution MUST choose the simplest design that satisfies the requirement.
Prefer flat structures over nested hierarchies, built-in Angular primitives over custom
abstractions, and inline logic over premature extraction. Complexity MUST be explicitly
justified before introduction.

### II. Clean Code

Code MUST read as prose. Names MUST be intention-revealing. Functions MUST do one thing.
Classes MUST have a single responsibility. Formatting MUST follow the configured Prettier
rules (`printWidth: 100`, `singleQuote: true`). TypeScript strict mode is non-negotiable;
type assertions (`as`) MUST be avoided unless demonstrably unavoidable.

### III. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written before implementation. The Red-Green-Refactor cycle MUST be enforced:
write a failing test, make it pass with the minimum code necessary, then refactor.
All tests use Vitest with Angular's `TestBed`. No production code may be written without
a corresponding failing test first.

### IV. Minimum Code

Only code required to satisfy a current, explicit requirement MUST be written. YAGNI
applies at all times. Unused code, dead branches, and speculative abstractions MUST NOT
be introduced. Every added line requires justification against a concrete requirement.

### V. Minimal Comments

Code MUST be self-documenting through clear naming and structure. Comments MUST only
appear where reasoning is not evident from the code itself (e.g., a non-obvious algorithm,
a regulatory constraint, or a framework workaround). Docstrings, section headers, and
comments that re-state what the code does are prohibited.

## Code Quality Standards

- Angular standalone components only — no NgModules.
- State MUST use Angular Signals (`signal()`, `computed()`, `effect()`). RxJS subjects are
  not permitted for new state; use observables only where Angular APIs require them.
- TypeScript strict settings (`strictTemplates`, `noImplicitOverride`, `noImplicitReturns`,
  `noPropertyAccessFromIndexSignature`) MUST remain enabled. Violations MUST NOT be suppressed.
- Prettier formatting MUST be applied on every commit. `// prettier-ignore` requires a
  documented reason.

## Development Workflow

- TDD cycle is mandatory for all feature code: failing test → minimum implementation → refactor.
- Each task MUST be independently testable and committed as a logical unit.
- Run `npm test` before marking any task complete. No failing tests may be committed.
- PocketBase integration MUST follow the same TDD and simplicity principles as Angular code.
- Complexity violations MUST be documented in the plan's Complexity Tracking table.

## Governance

This constitution supersedes all other development practices and preferences. Amendments
require: (1) identifying the principle to change, (2) documenting rationale, (3) incrementing
the version per semantic versioning rules (MAJOR: principle removal/redefinition; MINOR: new
principle or section; PATCH: wording/clarification), and (4) propagating changes to dependent
templates. All feature plans MUST include a Constitution Check gate before implementation begins.
Compliance is reviewed at each pull request.

**Version**: 1.0.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-18
