# Boundaries · agent-home-recipes M0

| Concern | Owner | Notes |
|---------|-------|-------|
| Credential store / `resolve` | Host DSH (`dsh-credentials-local`) | `$DSH_HOME/.credentials.yaml` + env layers; re-resolve per op; no cross-op cache |
| Same-provider key pool | **One** resolve-wrap | Default: `@omdp/dsh-key-fallback`. Optional alt: `@goodandready/dsh-key-rotation` **instead**, never both |
| Model / provider degrade | `dsh-llm-fallbacks` | Agent request chain; not a second credential store |
| Retry | Host `dsh-llm-retry` | Wrap/fallback change key or model, then hand back to retry |
| Teams / activity | `@nanmicoder/dsh-agent-teams` | Temporary stand-in while progress/bridges lag 0.2.1 |
| Soul docs | `dsh-soul-md` | User docs under `$DSH_HOME`; stub in `profiles/default/soul.md` |
| Quota router | This repo skeleton only | Schema + example YAML; **no engine** in M0 |
| progress / bridges | Upstream | **Not** installed on 0.2.1-rc.5 |

## Compliance

Multi-account / multi-key rotation may be restricted by vendor ToS. Get legal review (open official ToS pages) before production. This project does **not** document bypass steps.

If you configure multiple credentials/accounts, each must comply with that provider’s current Terms and AUP (including multi-account, account-sharing, rate-limit, and billing rules). This project does **not** help or recommend using multiple accounts to circumvent usage limits or billing obligations.
