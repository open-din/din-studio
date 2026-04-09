# Product guide screenshots

PNG captures used by the [user guide](../README.md). Regenerate after major UI changes:

```bash
cd din-studio
npx playwright install chromium   # once per machine
CAPTURE_PRODUCT_DOCS=1 npx playwright test tests/e2e/product-docs-screenshots.spec.ts
```

`launcher.png` is captured separately from a real **web** dev session (`npm run dev:web`); replace it manually if the launcher layout changes.

Tests use the same **Electron bridge seed** as other e2e specs (fake project with Oscillator → Gain → Output on the canvas).
