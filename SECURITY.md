# Security · agent-home-recipes

## Reporting

Email the KINFX maintainer privately for vulnerabilities. Do not open public issues with exploit details or leaked secrets.

## Secrets policy

- No real credentials in git, CI logs, recipes, or examples.
- Runtime keys: `$DSH_HOME/.credentials.yaml` or user secret store.
- This M0 does not implement network auth or a router engine.

## Supply chain

Pin host `@deepseek-ai/dsh@0.2.1-rc.5` when following the default recipe. Re-verify plugin peers before upgrading.
