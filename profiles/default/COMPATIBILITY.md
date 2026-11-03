# Compatibility matrix · agent-home-recipes M0

| Component | Pin / note | On `@deepseek-ai/dsh@0.2.1-rc.5` |
|-----------|------------|----------------------------------|
| Host | `@deepseek-ai/dsh@0.2.1-rc.5` | Required tip |
| `dsh-soul-md` | soul docs | Install |
| `@omdp/dsh-key-fallback` | **default** resolve-wrap (exactly one) | Install |
| `dsh-llm-fallbacks` | model/provider degrade | Install |
| `@nanmicoder/dsh-agent-teams` | teams / activity | Install |
| `@goodandready/dsh-key-rotation` | optional **alternative** wrap | Do **not** co-install with key-fallback |
| `dsh-subagent-progress` | peer/gate reject | **Blocked** |
| `dsh-bridges` | peer locked 0.1.5 line | **Blocked** |
| Host `dsh-llm-retry` | shipped with dsh | Leave to host |

Box-verified 2026-11-03. Re-verify before production.
