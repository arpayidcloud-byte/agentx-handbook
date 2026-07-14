# Module Interaction Matrix

> **Related:** Volume 01 (Architecture Overview), Volume 02–14  
> **Scope:** All core modules and their communication patterns

This diagram shows which modules communicate with each other, and whether the interaction is synchronous (direct call) or asynchronous (event bus / queue).

```mermaid
graph LR
    subgraph Sync["Synchronous (HTTP/gRPC)"]
        direction TB
        S1[CLI → Orchestrator]
        S2[CLI → Agent Platform]
        S3[Agent Platform → Provider Platform]
        S4[Agent Platform → Tool SDK]
        S5[Orchestrator → Memory Engine]
        S6[Plugin Registry → Tool SDK]
    end

    subgraph Async["Asynchronous (Event Bus / BullMQ)"]
        direction TB
        A1[Orchestrator →→ Agent Platform<br/>task.dispatched]
        A2[Agent Platform →→ Orchestrator<br/>task.completed / task.failed]
        A3[Agent Platform →→ Tool SDK<br/>tool.invoked (event)]
        A4[Tool SDK →→ Orchestrator<br/>approval.required]
        A5[Any Module →→ Memory Engine<br/>audit event]
        A6[Provider Platform →→ Orchestrator<br/>provider.called]
    end

    Sync --- Async

    style S1 fill:#c8e6c9,stroke:#2e7d32
    style S2 fill:#c8e6c9,stroke:#2e7d32
    style S3 fill:#c8e6c9,stroke:#2e7d32
    style S4 fill:#c8e6c9,stroke:#2e7d32
    style S5 fill:#c8e6c9,stroke:#2e7d32
    style S6 fill:#c8e6c9,stroke:#2e7d32
    style A1 fill:#bbdefb,stroke:#1565c0
    style A2 fill:#bbdefb,stroke:#1565c0
    style A3 fill:#bbdefb,stroke:#1565c0
    style A4 fill:#bbdefb,stroke:#1565c0
    style A5 fill:#bbdefb,stroke:#1565c0
    style A6 fill:#bbdefb,stroke:#1565c0
```

## Interaction Permission Matrix

| Source ↓ / Target → | Orchestrator | Agent Platform | Provider Platform | Tool SDK | Memory Engine | Plugin Registry |
|---------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **CLI** | Sync ✅ | Sync ✅ | — | — | Sync (query) ✅ | Sync ✅ |
| **Orchestrator** | — | Async ✅ | — | — | Sync (read) ✅ | — |
| **Agent Platform** | Async ✅ | — | Sync ✅ | Sync ✅ | Async ✅ | — |
| **Provider Platform** | Async ✅ | — | — | — | Async ✅ | — |
| **Tool SDK** | Async ✅ | — | — | — | Async ✅ | — |
| **Plugin Registry** | — | — | — | Sync ✅ | — | — |
| **Memory Engine** | — | — | — | — | — | — |

**Legend:**
- **Sync ✅** = Direct HTTP/gRPC call (request-response)
- **Async ✅** = Event bus publish/subscribe (fire-and-forget)
- **—** = No direct interaction

**Key rules:**
- All async interactions flow through the BullMQ-backed event bus (Redis).
- Memory Engine is a write-only sink for events — no module queries it synchronously except CLI (read-only audit queries).
- Provider Platform is only called synchronously by Agent Platform (never directly by Orchestrator or Tool SDK).