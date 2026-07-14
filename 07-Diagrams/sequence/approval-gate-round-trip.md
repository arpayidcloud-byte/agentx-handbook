# Approval Gate Round-Trip — Sequence Diagram

> **Related:** Volume 02 (Ch. 3), Volume 07 (Ch. 3), SECURITY_STANDARDS §4.3  
> **Actors:** Operator, CLI, Orchestrator, Tool SDK, Agent

This diagram shows the full round-trip when a destructive tool requires operator approval before execution can proceed.

```mermaid
sequenceDiagram
    participant Agent as Agent
    participant TS as Tool SDK
    participant Orch as Orchestrator
    participant Bus as Event Bus
    participant CLI as CLI
    participant Op as Operator

    Agent->>TS: Invoke tool "git.push" { args }
    TS->>TS: PermissionCheckRequest { agentRole, category: "git.write" }
    TS->>TS: Check permission matrix
    TS-->>Agent: PermissionCheckResult { allowed: false, reason: "Destructive — requires approval" }

    TS->>Orch: ApprovalRequiredEvent<br/>{ taskId, agentRole, toolName: "git.push", reason }

    Orch->>Bus: Publish approval.required
    Bus->>Orch: Persist event to audit log

    Orch->>Orch: Transition task → AwaitingApproval
    Orch-->>CLI: WebSocket push: { type: "approval.required", taskId, toolName, reason }

    CLI-->>Op: ⚠️ Approval required:<br/>git.push on branch main<br/>[Approve] [Reject]

    alt Operator approves
        Op->>CLI: Click "Approve"
        CLI->>Orch: POST /api/v1/tasks/{id}/approval { decision: "Approved" }
        Orch->>Orch: Validate approval request
        Orch->>Bus: Publish approval.resolved { taskId, decision: "Approved" }
        Orch->>Orch: Transition task → Running
        Orch-->>TS: Resume tool execution (approved)
        TS->>TS: Execute "git.push"
        TS-->>Agent: ToolResult { success: true, output: "Pushed to origin/main" }
    else Operator rejects
        Op->>CLI: Click "Reject"
        CLI->>Orch: POST /api/v1/tasks/{id}/approval { decision: "Rejected" }
        Orch->>Bus: Publish approval.resolved { taskId, decision: "Rejected" }
        Orch->>Orch: Transition task → Failed
        Orch-->>Agent: TaskFailedError { reason: "Operator rejected tool: git.push" }
    else Operator ignores (timeout)
        Note over Orch: 30-minute timeout (configurable)
        Orch->>Bus: Publish approval.resolved { taskId, decision: "Rejected" }
        Orch->>Orch: Transition task → Failed (timeout)
        Orch-->>CLI: WebSocket: { type: "approval.timeout", taskId }
    end
```

**Key flows illustrated:**
- Permission guard blocks destructive tool, returns denial with reason
- Task pauses in AwaitingApproval state
- Real-time notification to operator via WebSocket
- Operator approves, rejects, or times out
- All approval decisions are audit-logged via event bus
- Task resumes or fails based on operator decision