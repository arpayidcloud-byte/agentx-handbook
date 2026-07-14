# Provider Failover — Sequence Diagram

> **Related:** Volume 04 — Provider Platform (Ch. 4–5), ADR-0005  
> **Actors:** Agent, Provider Platform, Primary Provider, Secondary Provider, Orchestrator

This diagram shows the provider call failure → retry → failover sequence when the primary LLM provider is unavailable or returns an error.

```mermaid
sequenceDiagram
    participant Agent as Agent Platform
    participant PP as Provider Platform
    participant P1 as Primary Provider<br/>(e.g. OpenAI)
    participant P2 as Secondary Provider<br/>(e.g. Anthropic)
    participant Orch as Orchestrator

    Agent->>PP: CompletionRequest { providerId: "openai" }
    PP->>P1: POST /v1/chat/completions

    alt HTTP 429 (Rate Limited)
        P1-->>PP: 429 Too Many Requests
        PP->>PP: Parse Retry-After header
        PP->>PP: Attempt 1 failed — schedule retry

        PP->>P1: Retry after delay (backoff: 1s)
        P1-->>PP: 429 Too Many Requests
        PP->>PP: Attempt 2 failed — schedule retry

        PP->>P1: Retry after delay (backoff: 2s)
        P1-->>PP: 429 Too Many Requests
        PP->>PP: Attempt 3 failed — max attempts reached

        PP->>PP: Initiate failover to secondary
        PP->>P2: CompletionRequest (normalized)
        P2-->>PP: 200 OK { text, toolCalls, usage }
        PP->>PP: Normalize response (providerId: "anthropic")
        PP-->>Agent: CompletionResponse
        PP-->>Orch: ProviderCallEvent { success: true, providerId: "anthropic" }
    else HTTP 500 (Server Error)
        P1-->>PP: 500 Internal Server Error
        PP->>PP: Attempt 1 failed — server error

        PP->>P1: Retry with backoff
        P1-->>PP: 500 Internal Server Error
        PP->>PP: Attempt 2 failed

        PP->>P1: Retry with backoff
        P1-->>PP: 503 Service Unavailable
        PP->>PP: Attempt 3 failed — failover

        PP->>P2: CompletionRequest (normalized)
        P2-->>PP: 200 OK
        PP-->>Agent: CompletionResponse (from secondary)
    else HTTP 200 (Success on first try)
        P1-->>PP: 200 OK { text, toolCalls, usage }
        PP->>PP: Validate response against schema
        PP-->>Agent: CompletionResponse
        PP-->>Orch: ProviderCallEvent { success: true, providerId: "openai" }
    else All providers fail
        P1-->>PP: 500 Error
        PP->>P2: CompletionRequest (normalized)
        P2-->>PP: 503 Error
        PP->>PP: All providers exhausted
        PP-->>Agent: ProviderError (all failed)
        PP-->>Orch: ProviderCallEvent { success: false }
        Orch->>Orch: Transition task → Failed
    end
```

**Key flows illustrated:**
- Exponential backoff retry against primary (RetryPolicy: 3 attempts, 2x multiplier)
- Automatic failover to secondary provider after primary exhaustion
- Response normalization across providers
- ProviderCallEvent audit logging on every attempt
- Graceful degradation when all providers fail (task → Failed)