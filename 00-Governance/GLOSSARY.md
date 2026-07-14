# Glossary

Canonical term definitions for the entire handbook. Originally Volume 1, Chapter 7;
split into its own file per Volume 1's Recommended Addition #1 so it can be updated
without bumping Volume 1's version. Every Volume must use these terms as defined here —
no local redefinitions.

| Term | Definition | Defined in |
|---|---|---|
| Orchestrator | The Core Runtime component that decomposes a goal into tasks and schedules agents to execute them. | Volume 2 |
| Agent | A specialist LLM-driven worker bound to a role (coding, review, test, security) with a restricted tool set. | Volume 3 |
| Tool | A discrete capability an agent can invoke (read file, run shell command, call git). | Volume 7 |
| Approval Gate | A synchronous human-confirmation checkpoint required before a classified-risky action executes. | Volume 5, 7 |
| Provider | An external LLM vendor accessed via the Provider Platform's normalized interface. | Volume 4 |
| Task Graph | A directed graph of tasks and their dependencies, produced for a given goal. | Volume 5 |
| Plugin | A third-party extension registered through defined extension points, without modifying core. | Volume 8 |
| Tenant | An isolated customer/organization boundary enforced at the data and authorization layer. | Volume 10 |
| Trace ID | A correlation identifier shared by every event belonging to one root goal submission. | Volume 2, 13 |
| Golden Set | A fixed set of representative goals with human-reviewed acceptable outputs, used to evaluate agent output quality. | Volume 14 |
| Contract Test | A test validating an interface's documented behavior, independent of which implementation satisfies it. | Volume 14 |
| Portfolio | An org-level view composing multiple projects' task graphs and budgets. | Volume 12 |

## Amendment process

Add or change a term here only when a Volume introduces or redefines it; note the owning
Volume in the table. If two Volumes need conflicting definitions of the same word, that is
itself a signal an RFC is needed to resolve the naming conflict — not a reason to let both
stand.
