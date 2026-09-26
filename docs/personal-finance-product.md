# FINIX — Personal Finance Product Architecture

This document defines the product foundation for the personal-finance experience. The social product remains available at `/social`; `/dashboard` is now the financial home and redirects are kept compatible with existing sessions.

## 1. UX architecture and sitemap

```text
Finanzas
├── Resumen                         /finanzas
├── Cuentas                         /finanzas/cuentas
├── Movimientos                     /finanzas/movimientos
├── Presupuestos                    /finanzas/presupuestos
├── Objetivos                       /finanzas/objetivos
├── Inversiones                     /finanzas/inversiones
├── Tarjetas                        /finanzas/tarjetas
├── Calendario                      /finanzas/calendario
├── Analytics                       /finanzas/analytics
└── Configuración                   /finanzas/configuracion

Comunidad                           /social
Mercados                            /market, /portfolio, /news, /analysis
```

The desktop sidebar groups navigation by task. Mobile uses a finance-specific bottom navigation: Inicio, Movimientos, Nuevo, Analytics and Perfil.

## 2. Product hierarchy

The dashboard follows three information levels:

1. **Decisión inmediata:** patrimonio neto, variación, disponibilidad y privacidad de importes.
2. **Diagnóstico:** ingresos, gastos, ahorro, distribución, actividad y presupuestos.
3. **Planificación:** compromisos próximos, objetivos, inversiones e insights.

The layout is intentionally asymmetric: one dominant net-worth panel, secondary financial indicators, then operational lists and planning modules. Cards are used as containers with different densities, not as a repeated grid pattern.

## 3. Design system direction

The finance UI reuses the existing FINIX token system and adds finance-specific rules:

| Dimension | Rule |
|---|---|
| Typography | Inter/system sans; financial numbers use tabular figures |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Surfaces | background, surface, elevated surface and bordered data regions |
| Radius | compact controls 10–12px; primary panels 16–20px; avoid universal rounding |
| Color | neutral-first; green/red are paired with labels, arrows or signs |
| Motion | 150–250ms for state changes; no decorative motion in data views |
| Privacy | one global eye control masks sensitive amounts with `••••••••` |

Dark mode is built from separate surface and border layers rather than a pure-black inversion. ARS, USD and EUR are represented by explicit currency metadata instead of hardcoded formatting assumptions.

## 4. Shared component model

The first finance vertical is organized under `apps/web/src/features/finance/`:

- `types.ts`: domain contracts for accounts, transactions, budgets, goals, investments and commitments.
- `demoData.ts`: realistic seed data used until the finance API is connected.
- `financePreferences.ts`: persisted privacy and reference-currency preferences.
- `FinanceComponents.tsx`: amount display, privacy, period selector, chart, progress, search and page-frame primitives.

Page-level compositions live in `apps/web/src/pages/Finance*.tsx`. This keeps display primitives separate from feature composition and leaves a clear path to API-backed hooks.

## 5. States required by every data module

Every finance surface must support loading/skeleton, empty, partial data, syncing, offline, error, disabled and success states. Empty states should explain the value of the module and provide one action, for example “Todavía no tenés inversiones cargadas” → “Agregar inversión”.

## 6. Screen compositions

- **Resumen:** dominant net-worth chart; income/expense/savings strip; recent activity; budgets; upcoming payments; goals; investment allocation.
- **Cuentas:** consolidated balance, account cards, sync status, last update and account-level activity.
- **Movimientos:** searchable/filterable table on desktop and touch-optimized list on mobile; category, account, type, currency and date filters.
- **Analytics:** patrimony trend, savings rate, category mix, income vs. expenses and data-backed insights.
- **Inversiones:** portfolio KPIs, ARS/USD selector, assets table, PnL and allocation by class/sector.
- **Presupuestos / Objetivos / Tarjetas / Calendario:** planning modules with progress, commitments, payment dates and actionable empty states.

## 7. Responsive rules

| Breakpoint | Behavior |
|---|---|
| `<640px` | single-column mobile composition, bottom sheets, list rows, sticky controls |
| `640–1024px` | tablet layout, two-column grids where useful, collapsible sidebar |
| `1024–1440px` | desktop dashboard with sidebar, tables and multi-panel composition |
| `>1440px` | capped content width with additional breathing room, never stretched cards |

Touch targets remain comfortable, tables collapse into lists, and charts preserve labels and tooltips without horizontal overflow.

## 8. Accessibility and trust

Interactive elements use semantic controls, visible focus states and labels. Financial meaning is not communicated by color alone. Destructive actions require confirmation; reversible actions should expose undo. “Última actualización”, sync state and demo-data labels are visible wherever freshness affects a decision.

## 9. Current implementation boundary

The frontend vertical is implemented with production-shaped components and realistic demo data so the product language can be validated across desktop, tablet and mobile. The next production phase is to replace `demoFinanceSnapshot` with authenticated API modules and Prisma models for accounts, transactions, budgets, goals, cards, investments and recurring payments; bank/broker synchronization must be added behind explicit provider adapters.

## 10. Verification

- `npm run build` passes for the web app.
- React Doctor was run after the finance navigation changes. Remaining findings are complexity warnings in existing large components (`BottomNav`, `Sidebar`, `Pricing`, `Settings`, `ProGate` and `CommunityPaymentModal`), not type or build failures.
