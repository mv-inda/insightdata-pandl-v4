# InsightData Profit & Loss Statement v4

Custom Qlik Sense visualization that renders a hierarchical Profit & Loss statement with expandable rows, color logic, optional percentage lines, and export support.

## Features
- Pivot-style P&L with row expand/collapse and sticky headers/first column.
- Header and row selections to drive Qlik filters; optional percentage rows per dimension.
- Positive/negative or expression-based cell coloring with reversible palettes.
- Download to Excel via the built-in export action.
- Per-level and per-row styling controls from the property panel.

## Requirements
- Node.js 16+ (for build tooling).
- Qlik Sense (SaaS or Client-Managed) with rights to deploy custom extensions.

## Project Structure
- `src/insightdata-pandl-v4.js` — rendering logic, selections, toggling, export.
- `src/properties.js` — property panel (dimensions/measures, percentage lines, styling, visibility).
- `src/style.css` — sticky layout and table styling.
- `webpack.config.js` — builds AMD bundle from `.qext` name; optional obfuscation.
- `build.js` — production build + zip packaging into `insightdata-pandl-v4.zip`.

## Setup
1. Install deps: `npm install`
2. Dev watch build: `npm run dev` (outputs to `dist/`).
3. Prod build (minified/obfuscated): `npm run build`
4. Prod build without obfuscation: `npm run build:no-obf` or `NO_OBF=1 npm run build`
5. Package release zip (includes `.qext`): `npm run release`
   - Non-obfuscated zip: `npm run release:no-obf`

`dist/` will contain the extension folder; `insightdata-pandl-v4.zip` is created in the project root for import into Qlik.

## Using in Qlik
1. Import `insightdata-pandl-v4.zip` into the QMC or drop the folder into the extensions directory.
2. Add the visualization to a sheet.
3. Configure **Dimensions** (1–10):
   - Optionally enable totals per dimension (`Calculate total expression`, `Total label`, `Show total column`).
4. Configure **Measures** (1–20):
   - Mark as percentage, choose percentage calculation (divide by first row, subtract previous two, or skip).
   - Set coloring: off, positive/negative (with optional reverse and custom colors), or expression-driven.
5. **Additional calculations**:
   - `Percentage Line Dims`: semicolon-separated dimension labels that get an extra “%” row.
   - `Percentage Locale` and `Percentage Number of Decimals`.
6. **Visibility**:
   - Pre-collapse/expand levels or specific dimension labels via semicolon-separated lists.
7. **Styling**:
   - CSS snippets for first/base/sum/percentage rows and per-level rows; total-column styling.

Interactions:
- Click header cells to select dimension values; click row labels to select value plus its parent chain.
- Use row toggles to expand/collapse hierarchy; header/download icon exports to Excel.