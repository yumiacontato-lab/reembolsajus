---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-02-21
status: unfilled
scaffoldVersion: "2.0.0"
---
## Architecture Notes

<!-- Describe how the system is assembled and why the current design exists. -->

_Content to be added._

## System Architecture Overview

<!-- Summarize the top-level topology (monolith, modular service, microservices) and deployment model. Highlight how requests traverse the system and where control pivots between layers. -->

_Content to be added._

## Architectural Layers

- **Utils**: Shared utilities and helpers (`src/lib`)
- **Components**: UI components and views (`src/components/ui`, `src/pages`, `src/components`)

> See [`codebase-map.json`](./codebase-map.json) for complete symbol counts and dependency graphs.

## Detected Design Patterns

_No design patterns detected._

## Entry Points

- [`src/main.tsx`](../src/main.tsx)

## Public API

| Symbol | Type | Location |
|--------|------|----------|
| `BadgeProps` | interface | badge.tsx:23 |
| `Benefits` | function | Benefits.tsx:36 |
| `ButtonProps` | interface | button.tsx:37 |
| `CalendarProps` | type | calendar.tsx:8 |
| `ChartConfig` | type | chart.tsx:9 |
| `cn` | function | utils.ts:4 |
| `Footer` | function | Footer.tsx:4 |
| `Pricing` | function | Pricing.tsx:14 |
| `ReportItem` | type | report-session.ts:20 |
| `ReportSession` | type | report-session.ts:26 |
| `ReviewItem` | type | report-session.ts:3 |
| `ReviewItemStatus` | type | report-session.ts:1 |
| `TextareaProps` | interface | textarea.tsx:5 |
| `Toaster` | function | toaster.tsx:4 |
| `UploadSession` | type | report-session.ts:13 |

## Internal System Boundaries

<!-- Document seams between domains, bounded contexts, or service ownership. Note data ownership, synchronization strategies, and shared contract enforcement. -->

_Content to be added._

## External Service Dependencies

<!-- List SaaS platforms, third-party APIs, or infrastructure services. Describe authentication methods, rate limits, and failure considerations. -->

_Content to be added._

## Key Decisions & Trade-offs

<!-- Summarize architectural decisions, experiments, or ADR outcomes. Explain why selected approaches won over alternatives. -->

_Content to be added._

## Diagrams

<!-- Link architectural diagrams or add mermaid definitions showing system components and their relationships. -->

_Content to be added._

## Risks & Constraints

<!-- Document performance constraints, scaling considerations, or external system assumptions. -->

_Content to be added._

## Top Directories Snapshot

- `bun.lockb/` — _describe purpose_
- `components.json/` — _describe purpose_
- `db/` — _describe purpose_
- `eslint.config.js/` — _describe purpose_
- `index.html/` — _describe purpose_
- `package-lock.json/` — _describe purpose_
- `package.json/` — _describe purpose_
- `postcss.config.js/` — _describe purpose_
- `public/` — _describe purpose_
- `README.md/` — _describe purpose_

## Related Resources

<!-- Link to Project Overview and other relevant documentation. -->

_Content to be added._

## Related Resources

- [project-overview.md](./project-overview.md)
- [data-flow.md](./data-flow.md)
- [codebase-map.json](./codebase-map.json)
