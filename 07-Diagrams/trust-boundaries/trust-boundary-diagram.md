# Trust Boundary Diagram

> **Related:** THREAT_MODEL.md §2, RFC-0021, ADR-0004  
> **Zones:** Operator-Trusted, Agent-Controlled, Tool-Executed, External Network

This diagram illustrates the four trust boundaries of the agentx platform and the data flows between them.

```mermaid
graph TB
    subgraph OZ["🔵 Operator-Trusted Zone"]
        direction TB
        CLI[CLI Client]
        Operator[Human Operator]
        WebUI[Web UI<br/>future]
        Operator --> CLI
        Operator --> WebUI
    end

    subgraph AZ["🟢 Agent-Controlled Zone"]
        direction TB
        Orch[Orchestrator / Scheduler]
        AP[Agent Platform]
        ME[Memory Engine]
        PP[Provider Platform]
        WP[Workflow Engine]
        Orch <--> AP
        Orch <--> ME
        AP <--> PP
        AP <--> WP
    end

    subgraph TZ["🟡 Tool-Executed Zone"]
        direction TB
        TS[Tool SDK]
        SB[Sandbox Runtime]
        FS[Filesystem]
        SH[Shell / Git]
        TS --> SB
        SB --> FS
        SB --> SH
    end

    subgraph EZ["🔴 External Network Zone"]
        direction TB
        LLM1[Cloud LLM Providers<br/>OpenAI, Anthropic]
        LLM2[Local LLM<br/>Ollama]
        PM[Plugin Marketplace<br/>future]
    end

    OZ ==>|"Auth + TLS 1.3<br/>Task submission / approval"| AZ
    AZ ==>|"Permission check<br/>Tool invocation"| TZ
    AZ ==>|"API key + TLS 1.3<br/>Prompt / completion"| EZ

    style OZ fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style AZ fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style TZ fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style EZ fill:#ffebee,stroke:#c62828,stroke-width:2px
```

**Trust boundaries explained:**

| Zone | Trust Level | Contains | Key Controls |
|------|------------|----------|--------------|
| Operator-Trusted | Highest | Human operator, CLI, Web UI | Authentication, RBAC, audit |
| Agent-Controlled | Medium | Orchestrator, Agent Platform, Memory Engine, Provider Platform | Schema validation, rate limits, task timeouts |
| Tool-Executed | Low | Tool SDK, Sandbox, Filesystem, Shell | Sandboxing, path allowlists, permission guards |
| External Network | Untrusted | Cloud LLMs, Local LLMs, Plugin Marketplace | TLS 1.3, certificate pinning, failover, prompt sanitization |

**Cross-boundary rules:**
- Data crossing from Agent→Tool requires permission check (Volume 07).
- Data crossing from Agent→External requires credential resolution and TLS.
- Data crossing from Operator→Agent requires authentication and task validation.
- Tool output crossing from Tool→Agent requires schema validation.