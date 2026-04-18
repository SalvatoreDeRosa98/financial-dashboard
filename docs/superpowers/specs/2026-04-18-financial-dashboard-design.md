# Financial Dashboard — Design Spec
**Date:** 2026-04-18  
**Status:** Approved

---

## Overview

Personal financial dashboard web app. Visualizza patrimonio, conti, investimenti e spese con dati mock realistici. Desktop-first con layout responsive mobile.

---

## Stack

| Layer | Scelta |
|-------|--------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui |
| Charts | Recharts |
| Routing | React Router v6 |
| Theme | next-themes (dark/light toggle) |

---

## Layout & Navigazione

**Sidebar fissa** a sinistra (200px desktop). Contiene:
- Logo "FinTrack"
- 4 voci di navigazione con icona + label
- Toggle dark/light in fondo

Su mobile: sidebar collassa, hamburger menu in header.

**Header** per ogni pagina: saluto utente + data corrente + pulsante aggiorna.

---

## Pagine

### 1. Panoramica (`/`)

**KPI Cards** (griglia 4 colonne):
- Saldo totale — variazione % vs mese scorso
- Entrate mese corrente — breakdown fonte
- Uscite mese corrente — variazione vs media
- Patrimonio netto — variazione assoluta mensile

**Grafico andamento patrimonio** (Recharts `LineChart`, area fill):
- Serie: 12 mesi
- Larghezza: 2/3 layout

**Ripartizione saldi** (barre progresso, 1/3 layout):
- Conto corrente, Investimenti, Contanti, Wallet
- Percentuale + valore assoluto per ognuno

---

### 2. Dove sono i soldi (`/accounts`)

**Donut chart** (Recharts `PieChart` innerRadius):
- 4 categorie: Conto, Investimenti, Contanti, Wallet
- Legenda inline con percentuali

**Lista conti** (card per conto):
- Icona · Nome conto · Tipo · Saldo
- Conti mock: BancaSella, N26, Contanti, PayPal+Crypto

**Grafico multi-linea** (Recharts `LineChart` con più `Line`):
- Andamento saldi per conto — ultimi 6 mesi
- Linee tratteggiate distinte per colore

---

### 3. Investimenti (`/investments`)

**Badge rendimento** (3 card):
- Valore portafoglio totale + gain assoluto
- Rendimento YTD %
- Rendimento mese corrente %

**Grafico portafoglio** (Recharts `AreaChart`):
- Filtro temporale: 1M · 3M · YTD · 1A (state locale)
- Dati mock per ogni intervallo in `mock.ts`

**Lista asset allocation**:
- Per ogni asset: nome, valore, % allocazione, rendimento %
- Barra progresso % allocazione
- Badge verde/rosso per rendimento
- Asset mock: ETF S&P500, ETF World, Bitcoin, BTP Italia

---

### 4. Spese (`/expenses`)

**Navigazione mese** (frecce ◀ ▶ con state locale):
- Mostra dati del mese selezionato

**Bar chart mensile** (Recharts `BarChart`):
- Ultimi 6 mesi, barra mese corrente evidenziata
- Linea media come `ReferenceLine`

**Categorie** (lista con barre progresso):
- Affitto, Cibo & Ristoranti, Trasporti, Shopping, Abbonamenti, Altro
- Importo + % sul totale mese

**Lista transazioni recenti**:
- Icona categoria · Nome · Data · Categoria · Importo (rosso/verde)
- 10 transazioni mock per mese

---

## Struttura File

```
financial-dashboard/
  src/
    components/
      layout/
        Sidebar.tsx
        Header.tsx
        ThemeToggle.tsx
        MobileMenu.tsx
      overview/
        KpiCards.tsx
        NetWorthChart.tsx
        AllocationBars.tsx
      accounts/
        DonutChart.tsx
        AccountList.tsx
        BalanceTrendChart.tsx
      investments/
        ReturnBadges.tsx
        PortfolioChart.tsx
        AssetList.tsx
      expenses/
        MonthlyBarChart.tsx
        CategoryList.tsx
        TransactionList.tsx
      ui/               ← shadcn/ui components (auto-generati)
    data/
      mock.ts           ← tutti i dati mock tipizzati
      types.ts          ← interfacce TypeScript
    pages/
      Overview.tsx
      Accounts.tsx
      Investments.tsx
      Expenses.tsx
    App.tsx             ← Router + ThemeProvider
    main.tsx
  index.html
  tailwind.config.ts
  vite.config.ts
  tsconfig.json
```

---

## Dati Mock

Tutti in `src/data/mock.ts`. Tipizzati via `src/data/types.ts`.

**Entità principali:**
- `Account[]` — conti con saldo e storico mensile
- `Investment[]` — asset con valore, rendimento, serie temporale
- `Expense[]` — transazioni con categoria, importo, data
- `MonthlySnapshot[]` — patrimonio netto mensile 12 mesi

Valori realistici italiani: stipendio ~€ 2.800, affitto ~€ 750, ecc.

---

## Theme / Dark-Light Toggle

`next-themes` con `class` strategy su `<html>`. Tailwind `dark:` prefix per varianti. Toggle in sidebar (icona 🌗). Preferenza salvata in `localStorage`.

---

## Responsive / Mobile

| Breakpoint | Comportamento |
|------------|---------------|
| `< 768px` | Sidebar nascosta, hamburger in header |
| `768–1024px` | Sidebar collassata (solo icone) |
| `> 1024px` | Sidebar completa |

Griglie KPI: 4 col → 2 col → 1 col su mobile.  
Grafici: `ResponsiveContainer` Recharts per adattamento automatico.

---

## Decisioni chiave

- **Nessuna API esterna** — solo dati mock, zero backend
- **Nessun state manager** — React state locale + props, nessun Redux/Zustand
- **shadcn/ui copiato** nel progetto — zero vendor lock-in runtime
- **Un file mock** centralizzato — facile da aggiornare con dati reali in futuro
