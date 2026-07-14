# Plugin Invocation — Sequence Diagram

> **Related:** Volume 08 — Plugin Platform (Ch. 2–4)  
> **Actors:** Plugin Registry, Manifest Validator, Sandbox Manager, Plugin Instance, Agent Platform

This diagram shows the plugin lifecycle from registration through manifest validation, invocation, sandboxing, and result return.

```mermaid
sequenceDiagram
    participant Dev as Plugin Developer
    participant Reg as Plugin Registry
    participant Val as Manifest Validator
    participant AP as Agent Platform
    participant SM as Sandbox Manager
    participant PI as Plugin Instance

    Note over Dev,Reg: Registration Phase
    Dev->>Reg: POST /api/v1/plugins (manifest + package)
    Reg->>Val: Validate manifest
    Val->>Val: Check schema compliance
    Val->>Val: Verify tool definitions
    Val->>Val: Check signature (v1.0)
    Val-->>Reg: ValidationResult { valid: true }

    Reg->>Reg: Persist plugin metadata
    Reg->>Reg: Register tools in Tool SDK
    Reg-->>Dev: 201 Created { pluginId, status: "active" }

    Note over AP,PI: Invocation Phase
    AP->>Reg: Resolve tool → plugin mapping
    Reg-->>AP: { pluginId, toolName, entrypoint }

    AP->>SM: Create sandbox for plugin
    SM->>SM: Allocate resources (CPU, memory, time limit)
    SM->>SM: Configure path allowlist
    SM->>PI: Spawn plugin process in sandbox
    PI-->>SM: Ready signal

    AP->>PI: Invoke tool { callId, args, context }
    PI->>PI: Execute tool logic
    PI-->>SM: ToolResult { success, output }
    SM->>SM: Validate output (schema check)
    SM->>SM: Enforce resource limits
    SM-->>AP: ToolResult

    alt Sandbox violation
        PI->>SM: Attempt restricted operation (e.g. network)
        SM->>SM: Terminate plugin process
        SM-->>AP: ToolResult { success: false, error: "sandbox violation" }
        SM-->>Reg: Flag plugin (strike count)
    end

    SM->>SM: Teardown sandbox
    AP-->>AP: Continue agent loop with result
```

**Key flows illustrated:**
- Plugin registration with manifest validation
- Tool registration in the shared Tool SDK registry
- Per-invocation sandbox creation with resource limits
- Output validation before returning to agent
- Sandbox violation detection and plugin flagging
- Sandbox teardown after invocation completes