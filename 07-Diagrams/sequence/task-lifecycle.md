# Task Lifecycle — Full Sequence Diagram

> **Related:** Volume 02 — Core Runtime (Ch. 2–4)  
> **Actors:** Operator, CLI, Orchestrator, Agent Platform, Agent, Provider Platform, LLM, Tool SDK, Tool

This diagram shows the complete lifecycle of a task from submission through decomposition, agent dispatch, provider call, tool execution, approval gating, and result composition.

```mermaid
sequenceDiagram
    actor Op as Operator
    participant CLI as CLI
    participant Orch as Orchestrator
    participant AP as Agent Platform
    participant Agent as Agent
    participant PP as Provider Platform
    participant LLM as LLM
    participant TS as Tool SDK
    participant Tool as Tool

    Op->>CLI: Submit task goal
    CLI->>Orch: POST /api/v1/tasks
    Orch->>Orch: Validate & persist Task (state: Queued)
    Orch-->>CLI: 202 Accepted { taskId, traceId }
    CLI-->>Op: Task submitted

    Note over Orch: Scheduler picks up task

    Orch->>Orch: Transition → Planning
    Orch->>AP: DecompositionRequest { taskId, goal }
    AP->>PP: CompletionRequest (decomposition prompt)
    PP->>LLM: API call (with tools)
    LLM-->>PP: CompletionResponse (decomposed subtasks)
    PP-->>AP: Normalized response
    AP-->>Orch: DecompositionResult { subtasks[] }
    Orch->>Orch: Persist subtasks, build DAG

    Note over Orch: Resolve dependencies, assign agents

    loop For each ready subtask
        Orch->>Orch: Transition → Running
        Orch->>AP: Dispatch { taskId, agentRole, context }
        AP->>Agent: Execute with context
        Agent->>PP: CompletionRequest (with tool specs)
        PP->>LLM: API call
        LLM-->>PP: CompletionResponse + toolCalls
        PP-->>Agent: Normalized response

        loop For each tool call
            Agent->>TS: PermissionCheckRequest { agentRole, category }
            TS-->>Agent: PermissionCheckResult { allowed }

            alt Destructive tool, requiresApproval
                TS-->>Orch: ApprovalRequiredEvent
                Orch-->>CLI: WS: approval.required
                CLI-->>Op: Prompt for approval
                Op->>CLI: Approve / Reject
                CLI->>Orch: POST /api/v1/tasks/{id}/approval
                Orch->>TS: Resume with decision
            end

            TS->>Tool: Execute { args, workingDir }
            Tool-->>TS: ToolResult { success, output }
            TS-->>Agent: ToolResult
            Agent->>PP: CompletionRequest (with tool result)
            PP->>LLM: Continue conversation
            LLM-->>PP: Next response or final
            PP-->>Agent: Normalized response
        end

        Agent-->>AP: Final result
        AP-->>Orch: TaskCompletedEvent
        Orch->>Orch: Transition → Completed
    end

    Orch-->>CLI: WS: task.completed
    CLI-->>Op: Task finished
```

**Key flows illustrated:**
- Task submission and async acceptance
- LLM-driven task decomposition with DAG construction
- Agent dispatch with tool-use loop
- Permission guard check before tool execution
- Approval gate for destructive tools (operator pause/resume)
- Tool result fed back to LLM for continued reasoning
- Event-driven state transitions throughout