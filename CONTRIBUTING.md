# Contributing · agent-home-recipes

## Scope

M0 is a **recipe kit** (profile plugins, docs, health-check, empty quota-router contract). Do not expand into a full agent UI or fake rotation engine without a new milestone.

## Clean-room

Do not copy competitor UI, strings, or assets. Do not put vendor brand names in the product title (technical “compatible with DSH” in docs is OK).

## Secrets

Never commit API keys, tokens, or `.credentials.yaml`. Use `.env.example` with empty values only.

## AI-assisted development

Human (or maintaining agent) must review every line. Run `npm run check` before claiming done. Disclose AI tools in PR text when contributing publicly.

## Checks

```bash
npm run check
```

## License

MIT. By contributing you agree your changes are MIT-licensed.
