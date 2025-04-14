# Active Context

**Current Focus:** Initial comprehensive review and refactoring of the Mercury Coder Protocol (MCP) Server.

**Problem:** The server is reported as not working as intended. The specific root causes are unknown.

**Objective:** 
1. Analyze the existing codebase to understand its structure and identify the root causes of the malfunction.
2. Develop a refactoring plan to fix the issues and align the server with the project goals (reliability, maintainability, correct functionality).

**Recent Activity:**
- Initiated the review process.
- Confirmed Memory Bank structure exists.
- Identified the task complexity as Level 3.
- Completed initial code review of `src/` (`index.ts`, `config/`, `tools/`).
- Identified key modules: `@modelcontextprotocol/sdk` usage, `MercuryCoderServer`, `ToolHandlerFactory`, `BaseToolHandler`.
- Formulated hypothesis for root cause: Server acts as a proxy for specific API calls, not as a general tool executor based on AI instructions.
- Identified secondary issues: Fragile parameter handling, potential prompt injection, basic chunking, lack of local tool execution.

**Next Steps:**
- Update Memory Bank (`systemPatterns.md`, `techContext.md`) with detailed findings.
- Finalize root cause analysis.
- Develop a refactoring plan (Planning Phase).
- Update `tasks.md`. 