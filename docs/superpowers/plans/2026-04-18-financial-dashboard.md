# Financial Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Personal financial dashboard with 4 pages — Overview, Accounts, Investments, Expenses — with sidebar navigation, dark/light toggle, and static mock data.

**Architecture:** React Router v6 SPA with 4 routes. All data in `src/data/mock.ts`. Fixed sidebar on desktop (200px), hamburger on mobile. Recharts wrapped in `ResponsiveContainer`. next-themes for dark/light via CSS class on `<html>`.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS v3, shadcn/ui, Recharts, React Router v6, next-themes, Vitest, React Testing Library

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/data/types.ts` | TypeScript interfaces for all data |
| `src/data/mock.ts` | All static mock data + CURRENT_MONTH_INDEX |
| `src/lib/utils.ts` | cn, formatCurrency, formatPercent |
| `src/lib/utils.test.ts` | Tests for utility functions |
| `src/components/layout/ThemeToggle.tsx` | Dark/light toggle button |
| `src/components/layout/Sidebar.tsx` | Fixed sidebar with NavLinks + toggle |
| `src/components/layout/Header.tsx` | Page title + date + mobile hamburger |
| `src/components/layout/MobileMenu.tsx` | Full-screen nav overlay for mobile |
| `src/components/overview/KpiCards.tsx` | 4 KPI metric cards |
| `src/components/overview/NetWorthChart.tsx` | 12-month net worth area chart |
| `src/components/overview/AllocationBars.tsx` | Balance breakdown progress bars |
| `src/components/accounts/DonutChart.tsx` | Pie/donut chart for account split |
| `src/components/accounts/AccountList.tsx` | List of accounts with balances |
| `src/components/accounts/BalanceTrendChart.tsx` | Multi-line balance trend |
| `src/components/investments/ReturnBadges.tsx` | 3 return metric cards |
| `src/components/investments/PortfolioChart.tsx` | Area chart with period filter |
| `src/components/investments/AssetList.tsx` | Asset allocation list with badges |
| `src/components/expenses/MonthlyBarChart.tsx` | Bar chart with active month highlight |
| `src/components/expenses/CategoryList.tsx` | Expense categories with bars |
| `src/components/expenses/TransactionList.tsx` | Recent transactions list |
| `src/pages/Overview.tsx` | Overview page layout |
| `src/pages/Accounts.tsx` | Accounts page layout |
| `src/pages/Investments.tsx` | Investments page layout |
| `src/pages/Expenses.tsx` | Expenses page layout with month nav |
| `src/App.tsx` | Router + ThemeProvider + layout shell |
| `src/main.tsx` | Entry point |

---

### Task 1: Project Scaffold & Configuration

**Files:**
- Create: project root (via vite scaffold)
- Create: `tailwind.config.ts`
- Create: `src/index.css`
- Create: `vite.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /c/Users/salva/Documents/financial-dashboard
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, confirm with `y`.

- [ ] **Step 2: Install all dependencies**

```bash
npm install
npm install react-router-dom recharts next-themes
npm install -D tailwindcss postcss autoprefixer vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

Replace `tailwind.config.ts` (rename from `.js` if needed):

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted: Style = Default, Base color = Slate, CSS variables = Yes.

- [ ] **Step 5: Add shadcn components**

```bash
npx shadcn@latest add card badge button tabs
```

- [ ] **Step 6: Configure Vitest**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `tsconfig.json` under `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Server at `http://localhost:5173`, default Vite page visible.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TS + Tailwind + shadcn/ui + Vitest"
```

---

### Task 2: Types, Mock Data & Utils

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/mock.ts`
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: Write failing tests for utils**

Create `src/lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercent } from './utils'

describe('formatCurrency', () => {
  it('formats positive EUR amount', () => {
    const result = formatCurrency(1234.5)
    expect(result).toContain('1.234')
    expect(result).toContain('€')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })
  it('formats negative amount', () => {
    const result = formatCurrency(-42.5)
    expect(result).toContain('42')
    expect(result).toContain('€')
  })
})

describe('formatPercent', () => {
  it('adds + sign for positive', () => {
    expect(formatPercent(3.2)).toBe('+3.20%')
  })
  it('no + sign for negative', () => {
    expect(formatPercent(-1.5)).toBe('-1.50%')
  })
  it('omits sign when includeSign false', () => {
    expect(formatPercent(5.0, false)).toBe('5.00%')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module './utils'`

- [ ] **Step 3: Create utils**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatPercent(value: number, includeSign = true): string {
  const sign = includeSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/lib/utils.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Create types**

Create `src/data/types.ts`:

```ts
export type AccountType = 'checking' | 'savings' | 'cash' | 'wallet'
export type InvestmentPeriod = '1M' | '3M' | 'YTD' | '1A'

export interface Account {
  id: string
  name: string
  institution: string
  type: AccountType
  icon: string
  balance: number
  color: string
  history: { month: string; balance: number }[]
}

export interface Investment {
  id: string
  name: string
  symbol: string
  icon: string
  value: number
  costBasis: number
  allocationPct: number
  returnPct: number
  color: string
  series: Record<InvestmentPeriod, { date: string; value: number }[]>
}

export interface Transaction {
  id: string
  description: string
  category: string
  categoryIcon: string
  date: string
  amount: number
}

export interface MonthlyExpense {
  month: string
  total: number
  categories: { name: string; icon: string; amount: number; color: string }[]
  transactions: Transaction[]
}

export interface MonthlySnapshot {
  month: string
  netWorth: number
  income: number
  expenses: number
}
```

- [ ] **Step 6: Create mock data**

Create `src/data/mock.ts`:

```ts
import type { Account, Investment, MonthlyExpense, MonthlySnapshot } from './types'

export const accounts: Account[] = [
  {
    id: 'banca-sella',
    name: 'BancaSella',
    institution: 'Banca Sella',
    type: 'checking',
    icon: '🏦',
    balance: 14200,
    color: '#6366f1',
    history: [
      { month: 'Nov', balance: 11800 },
      { month: 'Dic', balance: 12400 },
      { month: 'Gen', balance: 12900 },
      { month: 'Feb', balance: 13200 },
      { month: 'Mar', balance: 13700 },
      { month: 'Apr', balance: 14200 },
    ],
  },
  {
    id: 'n26',
    name: 'N26',
    institution: 'N26',
    type: 'savings',
    icon: '💳',
    balance: 8050,
    color: '#22c55e',
    history: [
      { month: 'Nov', balance: 6900 },
      { month: 'Dic', balance: 7100 },
      { month: 'Gen', balance: 7300 },
      { month: 'Feb', balance: 7600 },
      { month: 'Mar', balance: 7800 },
      { month: 'Apr', balance: 8050 },
    ],
  },
  {
    id: 'contanti',
    name: 'Contanti',
    institution: 'Portafoglio fisico',
    type: 'cash',
    icon: '💵',
    balance: 380,
    color: '#f59e0b',
    history: [
      { month: 'Nov', balance: 420 },
      { month: 'Dic', balance: 350 },
      { month: 'Gen', balance: 400 },
      { month: 'Feb', balance: 360 },
      { month: 'Mar', balance: 410 },
      { month: 'Apr', balance: 380 },
    ],
  },
  {
    id: 'wallet',
    name: 'PayPal + Crypto',
    institution: 'Wallet digitali',
    type: 'wallet',
    icon: '🔮',
    balance: 320,
    color: '#a78bfa',
    history: [
      { month: 'Nov', balance: 290 },
      { month: 'Dic', balance: 310 },
      { month: 'Gen', balance: 305 },
      { month: 'Feb', balance: 315 },
      { month: 'Mar', balance: 330 },
      { month: 'Apr', balance: 320 },
    ],
  },
]

export const investments: Investment[] = [
  {
    id: 'sp500',
    name: 'ETF S&P500',
    symbol: 'CSPX',
    icon: '🇺🇸',
    value: 6200,
    costBasis: 5236,
    allocationPct: 46,
    returnPct: 18.4,
    color: '#6366f1',
    series: {
      '1M': [
        { date: '1 Mar', value: 5900 }, { date: '8 Mar', value: 5980 },
        { date: '15 Mar', value: 6050 }, { date: '22 Mar', value: 6100 },
        { date: '1 Apr', value: 6120 }, { date: '8 Apr', value: 6160 },
        { date: '15 Apr', value: 6200 },
      ],
      '3M': [
        { date: 'Gen', value: 5600 }, { date: 'Feb', value: 5750 },
        { date: 'Mar', value: 5980 }, { date: 'Apr', value: 6200 },
      ],
      'YTD': [
        { date: 'Gen', value: 5400 }, { date: 'Feb', value: 5750 },
        { date: 'Mar', value: 5980 }, { date: 'Apr', value: 6200 },
      ],
      '1A': [
        { date: 'Apr 25', value: 5236 }, { date: 'Lug 25', value: 5500 },
        { date: 'Ott 25', value: 5700 }, { date: 'Gen 26', value: 5900 },
        { date: 'Apr 26', value: 6200 },
      ],
    },
  },
  {
    id: 'world',
    name: 'ETF World',
    symbol: 'SWRD',
    icon: '🌍',
    value: 4080,
    costBasis: 3669,
    allocationPct: 31,
    returnPct: 11.2,
    color: '#22c55e',
    series: {
      '1M': [
        { date: '1 Mar', value: 3900 }, { date: '8 Mar', value: 3950 },
        { date: '15 Mar', value: 4000 }, { date: '22 Mar', value: 4020 },
        { date: '1 Apr', value: 4040 }, { date: '8 Apr', value: 4060 },
        { date: '15 Apr', value: 4080 },
      ],
      '3M': [
        { date: 'Gen', value: 3750 }, { date: 'Feb', value: 3850 },
        { date: 'Mar', value: 3970 }, { date: 'Apr', value: 4080 },
      ],
      'YTD': [
        { date: 'Gen', value: 3669 }, { date: 'Feb', value: 3850 },
        { date: 'Mar', value: 3970 }, { date: 'Apr', value: 4080 },
      ],
      '1A': [
        { date: 'Apr 25', value: 3669 }, { date: 'Lug 25', value: 3800 },
        { date: 'Ott 25', value: 3900 }, { date: 'Gen 26', value: 4000 },
        { date: 'Apr 26', value: 4080 },
      ],
    },
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    value: 1900,
    costBasis: 1981,
    allocationPct: 14,
    returnPct: -4.1,
    color: '#f59e0b',
    series: {
      '1M': [
        { date: '1 Mar', value: 2100 }, { date: '8 Mar', value: 2050 },
        { date: '15 Mar', value: 2000 }, { date: '22 Mar', value: 1960 },
        { date: '1 Apr', value: 1930 }, { date: '8 Apr', value: 1910 },
        { date: '15 Apr', value: 1900 },
      ],
      '3M': [
        { date: 'Gen', value: 2200 }, { date: 'Feb', value: 2150 },
        { date: 'Mar', value: 2000 }, { date: 'Apr', value: 1900 },
      ],
      'YTD': [
        { date: 'Gen', value: 1981 }, { date: 'Feb', value: 2150 },
        { date: 'Mar', value: 2000 }, { date: 'Apr', value: 1900 },
      ],
      '1A': [
        { date: 'Apr 25', value: 1981 }, { date: 'Lug 25', value: 2300 },
        { date: 'Ott 25', value: 2100 }, { date: 'Gen 26', value: 2200 },
        { date: 'Apr 26', value: 1900 },
      ],
    },
  },
  {
    id: 'btp',
    name: 'BTP Italia',
    symbol: 'BTP',
    icon: '🏛️',
    value: 1100,
    costBasis: 1059,
    allocationPct: 9,
    returnPct: 3.8,
    color: '#a78bfa',
    series: {
      '1M': [
        { date: '1 Mar', value: 1080 }, { date: '8 Mar', value: 1085 },
        { date: '15 Mar', value: 1090 }, { date: '22 Mar', value: 1092 },
        { date: '1 Apr', value: 1095 }, { date: '8 Apr', value: 1098 },
        { date: '15 Apr', value: 1100 },
      ],
      '3M': [
        { date: 'Gen', value: 1070 }, { date: 'Feb', value: 1078 },
        { date: 'Mar', value: 1090 }, { date: 'Apr', value: 1100 },
      ],
      'YTD': [
        { date: 'Gen', value: 1059 }, { date: 'Feb', value: 1078 },
        { date: 'Mar', value: 1090 }, { date: 'Apr', value: 1100 },
      ],
      '1A': [
        { date: 'Apr 25', value: 1059 }, { date: 'Lug 25', value: 1065 },
        { date: 'Ott 25', value: 1075 }, { date: 'Gen 26', value: 1085 },
        { date: 'Apr 26', value: 1100 },
      ],
    },
  },
]

export const monthlySnapshots: MonthlySnapshot[] = [
  { month: 'Apr 25', netWorth: 31200, income: 2800, expenses: 1580 },
  { month: 'Mag 25', netWorth: 32400, income: 3200, expenses: 1620 },
  { month: 'Giu 25', netWorth: 33100, income: 2800, expenses: 1700 },
  { month: 'Lug 25', netWorth: 34000, income: 3400, expenses: 1650 },
  { month: 'Ago 25', netWorth: 34800, income: 2800, expenses: 1580 },
  { month: 'Set 25', netWorth: 35600, income: 3200, expenses: 1720 },
  { month: 'Ott 25', netWorth: 36200, income: 2800, expenses: 1600 },
  { month: 'Nov 25', netWorth: 36900, income: 3200, expenses: 1640 },
  { month: 'Dic 25', netWorth: 37200, income: 2800, expenses: 1900 },
  { month: 'Gen 26', netWorth: 37600, income: 3200, expenses: 1580 },
  { month: 'Feb 26', netWorth: 38000, income: 2800, expenses: 1620 },
  { month: 'Mar 26', netWorth: 38250, income: 3200, expenses: 1720 },
  { month: 'Apr 26', netWorth: 38950, income: 3200, expenses: 1847 },
]

export const monthlyExpenses: MonthlyExpense[] = [
  {
    month: 'Nov 25',
    total: 1640,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 320, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 180, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 165, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 82, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 143, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Affitto novembre', category: 'Affitto', categoryIcon: '🏠', date: '1 Nov', amount: -750 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Nov', amount: 2800 },
      { id: 't3', description: 'Esselunga', category: 'Cibo', categoryIcon: '🛒', date: '18 Nov', amount: -87 },
      { id: 't4', description: 'Netflix', category: 'Abbonamenti', categoryIcon: '📺', date: '20 Nov', amount: -17.99 },
      { id: 't5', description: 'Ristorante Da Luigi', category: 'Ristoranti', categoryIcon: '🍽️', date: '23 Nov', amount: -42 },
    ],
  },
  {
    month: 'Dic 25',
    total: 1900,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 420, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 210, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 320, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 82, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 118, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Affitto dicembre', category: 'Affitto', categoryIcon: '🏠', date: '1 Dic', amount: -750 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Dic', amount: 2800 },
      { id: 't3', description: 'Amazon (regali)', category: 'Shopping', categoryIcon: '📦', date: '10 Dic', amount: -185 },
      { id: 't4', description: 'Cena di Natale', category: 'Ristoranti', categoryIcon: '🍽️', date: '24 Dic', amount: -95 },
      { id: 't5', description: 'Netflix', category: 'Abbonamenti', categoryIcon: '📺', date: '20 Dic', amount: -17.99 },
    ],
  },
  {
    month: 'Gen 26',
    total: 1580,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 290, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 180, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 148, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 82, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 130, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Affitto gennaio', category: 'Affitto', categoryIcon: '🏠', date: '1 Gen', amount: -750 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Gen', amount: 3200 },
      { id: 't3', description: 'Palestra', category: 'Sport', categoryIcon: '🏋️', date: '5 Gen', amount: -49 },
      { id: 't4', description: 'Treno Milano-Roma', category: 'Trasporti', categoryIcon: '🚄', date: '12 Gen', amount: -68 },
      { id: 't5', description: 'Spotify', category: 'Abbonamenti', categoryIcon: '🎵', date: '18 Gen', amount: -10.99 },
    ],
  },
  {
    month: 'Feb 26',
    total: 1620,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 310, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 195, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 170, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 82, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 113, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Affitto febbraio', category: 'Affitto', categoryIcon: '🏠', date: '1 Feb', amount: -750 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Feb', amount: 2800 },
      { id: 't3', description: 'Valentino ristorante', category: 'Ristoranti', categoryIcon: '🍽️', date: '14 Feb', amount: -72 },
      { id: 't4', description: 'Decathlon', category: 'Shopping', categoryIcon: '🛒', date: '20 Feb', amount: -89 },
      { id: 't5', description: 'Netflix', category: 'Abbonamenti', categoryIcon: '📺', date: '20 Feb', amount: -17.99 },
    ],
  },
  {
    month: 'Mar 26',
    total: 1720,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 350, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 220, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 200, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 82, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 118, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Affitto marzo', category: 'Affitto', categoryIcon: '🏠', date: '1 Mar', amount: -750 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Mar', amount: 3200 },
      { id: 't3', description: 'Zara', category: 'Shopping', categoryIcon: '👕', date: '8 Mar', amount: -120 },
      { id: 't4', description: 'ATM Milano abbonamento', category: 'Trasporti', categoryIcon: '🚇', date: '1 Mar', amount: -35 },
      { id: 't5', description: 'Trattoria del Porto', category: 'Ristoranti', categoryIcon: '🍽️', date: '22 Mar', amount: -58 },
    ],
  },
  {
    month: 'Apr 26',
    total: 1847,
    categories: [
      { name: 'Affitto', icon: '🏠', amount: 750, color: '#6366f1' },
      { name: 'Cibo & Ristoranti', icon: '🍔', amount: 380, color: '#22c55e' },
      { name: 'Trasporti', icon: '🚗', amount: 210, color: '#f59e0b' },
      { name: 'Shopping', icon: '🛒', amount: 195, color: '#a78bfa' },
      { name: 'Abbonamenti', icon: '📱', amount: 142, color: '#f43f5e' },
      { name: 'Altro', icon: '📦', amount: 170, color: '#94a3b8' },
    ],
    transactions: [
      { id: 't1', description: 'Pizzeria da Mario', category: 'Ristoranti', categoryIcon: '🍕', date: '17 Apr', amount: -28.5 },
      { id: 't2', description: 'Stipendio', category: 'Entrata', categoryIcon: '💼', date: '15 Apr', amount: 2800 },
      { id: 't3', description: 'Freelance progetto X', category: 'Entrata', categoryIcon: '💻', date: '10 Apr', amount: 400 },
      { id: 't4', description: 'ATM Milano', category: 'Trasporti', categoryIcon: '🚇', date: '14 Apr', amount: -35 },
      { id: 't5', description: 'Netflix', category: 'Abbonamenti', categoryIcon: '📺', date: '12 Apr', amount: -17.99 },
      { id: 't6', description: 'Affitto aprile', category: 'Affitto', categoryIcon: '🏠', date: '1 Apr', amount: -750 },
      { id: 't7', description: 'Esselunga', category: 'Cibo', categoryIcon: '🛒', date: '9 Apr', amount: -92 },
      { id: 't8', description: 'Spotify', category: 'Abbonamenti', categoryIcon: '🎵', date: '1 Apr', amount: -10.99 },
      { id: 't9', description: 'Amazon Prime', category: 'Abbonamenti', categoryIcon: '📦', date: '3 Apr', amount: -4.99 },
      { id: 't10', description: 'Geox scarpe', category: 'Shopping', categoryIcon: '👟', date: '5 Apr', amount: -89 },
    ],
  },
]

export const CURRENT_MONTH_INDEX = 5
```

- [ ] **Step 7: Commit**

```bash
git add src/data/types.ts src/data/mock.ts src/lib/utils.ts src/lib/utils.test.ts src/test-setup.ts
git commit -m "feat: types, mock data, utility functions"
```

---

### Task 3: Layout Shell

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MobileMenu.tsx`
- Create: `src/components/layout/Header.tsx`
- Modify: `src/index.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update index.css with CSS variables**

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 7%;
    --foreground: 213 31% 91%;
    --card: 222 47% 11%;
    --card-foreground: 213 31% 91%;
    --muted: 223 47% 15%;
    --muted-foreground: 215 20% 65%;
    --border: 216 34% 17%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --radius: 0.75rem;
  }

  .light {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 2: Create ThemeToggle**

Create `src/components/layout/ThemeToggle.tsx`:

```tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
```

- [ ] **Step 3: Create Sidebar**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: '📊', label: 'Panoramica' },
  { to: '/accounts', icon: '💰', label: 'Dove sono i soldi' },
  { to: '/investments', icon: '📈', label: 'Investimenti' },
  { to: '/expenses', icon: '🧾', label: 'Spese' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-52 bg-card border-r border-border h-screen sticky top-0 p-4 shrink-0">
      <div className="text-primary font-bold text-lg mb-6 px-2">FinTrack</div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-foreground border-l-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <ThemeToggle />
    </aside>
  )
}
```

- [ ] **Step 4: Create MobileMenu**

Create `src/components/layout/MobileMenu.tsx`:

```tsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/', icon: '📊', label: 'Panoramica' },
  { to: '/accounts', icon: '💰', label: 'Dove sono i soldi' },
  { to: '/investments', icon: '📈', label: 'Investimenti' },
  { to: '/expenses', icon: '🧾', label: 'Spese' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground text-xl"
        aria-label="Menu"
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col p-6 pt-16">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
          <div className="text-primary font-bold text-xl mb-8">FinTrack</div>
          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create Header**

Create `src/components/layout/Header.tsx`:

```tsx
import { MobileMenu } from './MobileMenu'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>
      <MobileMenu />
    </div>
  )
}
```

- [ ] **Step 6: Update main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 7: Update App.tsx**

Replace `src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Overview } from './pages/Overview'
import { Accounts } from './pages/Accounts'
import { Investments } from './pages/Investments'
import { Expenses } from './pages/Expenses'

export default function App() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/expenses" element={<Expenses />} />
        </Routes>
      </main>
    </div>
  )
}
```

- [ ] **Step 8: Create placeholder pages so App compiles**

Create `src/pages/Overview.tsx`:
```tsx
export function Overview() { return <div className="text-foreground">Overview</div> }
```

Create `src/pages/Accounts.tsx`:
```tsx
export function Accounts() { return <div className="text-foreground">Accounts</div> }
```

Create `src/pages/Investments.tsx`:
```tsx
export function Investments() { return <div className="text-foreground">Investments</div> }
```

Create `src/pages/Expenses.tsx`:
```tsx
export function Expenses() { return <div className="text-foreground">Expenses</div> }
```

- [ ] **Step 9: Verify in browser**

```bash
npm run dev
```

Expected: Dark background, sidebar with "FinTrack" + 4 nav links + theme toggle at bottom. Clicking links shows placeholder text. Toggle switches dark/light.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/ src/App.tsx src/main.tsx src/pages/ src/index.css
git commit -m "feat: layout shell — sidebar, header, theme toggle, mobile menu, routing"
```

---

### Task 4: Overview Page

**Files:**
- Create: `src/components/overview/KpiCards.tsx`
- Create: `src/components/overview/NetWorthChart.tsx`
- Create: `src/components/overview/AllocationBars.tsx`
- Modify: `src/pages/Overview.tsx`

- [ ] **Step 1: Create KpiCards**

Create `src/components/overview/KpiCards.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { accounts, monthlySnapshots } from '@/data/mock'

export function KpiCards() {
  const latest = monthlySnapshots[monthlySnapshots.length - 1]
  const previous = monthlySnapshots[monthlySnapshots.length - 2]
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const netWorthChange = latest.netWorth - previous.netWorth
  const netWorthChangePct = (netWorthChange / previous.netWorth) * 100
  const expenseChangePct = ((latest.expenses / previous.expenses) - 1) * 100

  const cards = [
    {
      label: 'Saldo Totale',
      value: formatCurrency(totalBalance),
      sub: `${formatPercent(netWorthChangePct)} vs mese scorso`,
      positive: netWorthChangePct >= 0,
    },
    {
      label: 'Entrate',
      value: formatCurrency(latest.income),
      sub: 'Stipendio + freelance',
      positive: true,
    },
    {
      label: 'Uscite',
      value: formatCurrency(latest.expenses),
      sub: `${formatPercent(expenseChangePct)} vs mese scorso`,
      positive: latest.expenses <= previous.expenses,
    },
    {
      label: 'Patrimonio Netto',
      value: formatCurrency(latest.netWorth),
      sub: `${formatPercent(netWorthChangePct)} · ${formatCurrency(netWorthChange)} questo mese`,
      positive: netWorthChange >= 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, positive }) => (
        <Card key={label}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-xs mt-1 ${positive ? 'text-green-500' : 'text-red-400'}`}>{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create NetWorthChart**

Create `src/components/overview/NetWorthChart.tsx`:

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { monthlySnapshots } from '@/data/mock'

export function NetWorthChart() {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Andamento Patrimonio — 12 mesi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlySnapshots} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={45}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Patrimonio']}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2} fill="url(#netWorthGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create AllocationBars**

Create `src/components/overview/AllocationBars.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { accounts } from '@/data/mock'

export function AllocationBars() {
  const total = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <Card className="w-full lg:w-64 shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ripartizione
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {accounts.map((a) => {
          const pct = Math.round((a.balance / total) * 100)
          return (
            <div key={a.id}>
              <div className="flex justify-between text-sm mb-1">
                <span>{a.icon} {a.name}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: a.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(a.balance)}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Build Overview page**

Replace `src/pages/Overview.tsx`:

```tsx
import { Header } from '@/components/layout/Header'
import { KpiCards } from '@/components/overview/KpiCards'
import { NetWorthChart } from '@/components/overview/NetWorthChart'
import { AllocationBars } from '@/components/overview/AllocationBars'

export function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <Header title="Panoramica" />
      <KpiCards />
      <div className="flex gap-4 flex-col lg:flex-row">
        <NetWorthChart />
        <AllocationBars />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify in browser at /**

```bash
npm run dev
```

Expected: 4 KPI cards in 2×2 grid (mobile) or 1×4 row (desktop), area chart with 12 months, allocation bars on right.

- [ ] **Step 6: Commit**

```bash
git add src/components/overview/ src/pages/Overview.tsx
git commit -m "feat: Overview page — KPI cards, net worth chart, allocation bars"
```

---

### Task 5: Accounts Page

**Files:**
- Create: `src/components/accounts/DonutChart.tsx`
- Create: `src/components/accounts/AccountList.tsx`
- Create: `src/components/accounts/BalanceTrendChart.tsx`
- Modify: `src/pages/Accounts.tsx`

- [ ] **Step 1: Create DonutChart**

Create `src/components/accounts/DonutChart.tsx`:

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { accounts } from '@/data/mock'

export function DonutChart() {
  const data = accounts.map((a) => ({ name: a.name, value: a.balance, color: a.color }))

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ripartizione Patrimonio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
              {data.map(({ name, color }) => (
                <Cell key={name} fill={color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [formatCurrency(v)]}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <Legend formatter={(value) => <span style={{ color: 'hsl(var(--foreground))', fontSize: 12 }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create AccountList**

Create `src/components/accounts/AccountList.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { accounts } from '@/data/mock'

export function AccountList() {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Conti & Carte
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">{account.icon}</span>
              <div>
                <p className="text-sm font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">{account.institution}</p>
              </div>
            </div>
            <span className="text-sm font-semibold" style={{ color: account.color }}>
              {formatCurrency(account.balance)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create BalanceTrendChart**

Create `src/components/accounts/BalanceTrendChart.tsx`:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { accounts } from '@/data/mock'

export function BalanceTrendChart() {
  const months = accounts[0].history.map((h) => h.month)
  const data = months.map((month) => {
    const row: Record<string, string | number> = { month }
    accounts.forEach((a) => {
      const entry = a.history.find((x) => x.month === month)
      if (entry) row[a.id] = entry.balance
    })
    return row
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Andamento Saldi — ultimi 6 mesi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={45}
            />
            <Tooltip
              formatter={(v: number, name: string) => [formatCurrency(v), accounts.find((a) => a.id === name)?.name ?? name]}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <Legend formatter={(value) => accounts.find((a) => a.id === value)?.name ?? value} />
            {accounts.map((a) => (
              <Line key={a.id} type="monotone" dataKey={a.id} stroke={a.color} strokeWidth={2} strokeDasharray="4 2" dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Build Accounts page**

Replace `src/pages/Accounts.tsx`:

```tsx
import { Header } from '@/components/layout/Header'
import { DonutChart } from '@/components/accounts/DonutChart'
import { AccountList } from '@/components/accounts/AccountList'
import { BalanceTrendChart } from '@/components/accounts/BalanceTrendChart'

export function Accounts() {
  return (
    <div className="flex flex-col gap-6">
      <Header title="Dove sono i soldi" />
      <div className="flex gap-4 flex-col lg:flex-row">
        <DonutChart />
        <AccountList />
      </div>
      <BalanceTrendChart />
    </div>
  )
}
```

- [ ] **Step 5: Verify at /accounts**

Expected: Donut chart + account list side by side, multi-line trend chart below with 4 colored dashed lines.

- [ ] **Step 6: Commit**

```bash
git add src/components/accounts/ src/pages/Accounts.tsx
git commit -m "feat: Accounts page — donut chart, account list, balance trend"
```

---

### Task 6: Investments Page

**Files:**
- Create: `src/components/investments/ReturnBadges.tsx`
- Create: `src/components/investments/PortfolioChart.tsx`
- Create: `src/components/investments/AssetList.tsx`
- Modify: `src/pages/Investments.tsx`

- [ ] **Step 1: Create ReturnBadges**

Create `src/components/investments/ReturnBadges.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { investments } from '@/data/mock'

export function ReturnBadges() {
  const total = investments.reduce((s, i) => s + i.value, 0)
  const costBasis = investments.reduce((s, i) => s + i.costBasis, 0)
  const totalGain = total - costBasis
  const totalReturnPct = (totalGain / costBasis) * 100

  const monthlyGain = investments.reduce((s, i) => {
    const series = i.series['1M']
    return s + (series[series.length - 1].value - series[0].value)
  }, 0)
  const monthReturnPct = (monthlyGain / (total - monthlyGain)) * 100

  const cards = [
    { label: 'Valore Portafoglio', value: formatCurrency(total), sub: `${formatCurrency(totalGain)} guadagno totale`, positive: totalGain >= 0 },
    { label: 'Rendimento YTD', value: formatPercent(totalReturnPct), sub: 'da inizio anno', positive: totalReturnPct >= 0 },
    { label: 'Rendimento Mensile', value: formatPercent(monthReturnPct), sub: 'aprile 2026', positive: monthReturnPct >= 0 },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, sub, positive }) => (
        <Card key={label}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${positive ? 'text-green-500' : 'text-red-400'}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create PortfolioChart**

Create `src/components/investments/PortfolioChart.tsx`:

```tsx
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { investments } from '@/data/mock'
import type { InvestmentPeriod } from '@/data/types'

const PERIODS: InvestmentPeriod[] = ['1M', '3M', 'YTD', '1A']

export function PortfolioChart() {
  const [period, setPeriod] = useState<InvestmentPeriod>('1M')

  const dates = investments[0].series[period].map((p) => p.date)
  const data = dates.map((date, i) => ({
    date,
    total: investments.reduce((s, inv) => s + (inv.series[period][i]?.value ?? 0), 0),
  }))

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Andamento Portafoglio
          </CardTitle>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  period === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={45}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Portafoglio']}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} fill="url(#portfolioGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create AssetList**

Create `src/components/investments/AssetList.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { investments } from '@/data/mock'

export function AssetList() {
  return (
    <Card className="w-full lg:w-72 shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Asset Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {investments.map((inv) => (
          <div key={inv.id} className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{inv.icon} {inv.name}</span>
              <Badge
                variant="outline"
                className={inv.returnPct >= 0 ? 'text-green-500 border-green-500/30' : 'text-red-400 border-red-400/30'}
              >
                {formatPercent(inv.returnPct)}
              </Badge>
            </div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{formatCurrency(inv.value)}</span>
              <span className="text-xs text-muted-foreground">{inv.allocationPct}%</span>
            </div>
            <div className="h-1.5 bg-background rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: `${inv.allocationPct}%`, backgroundColor: inv.color }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Build Investments page**

Replace `src/pages/Investments.tsx`:

```tsx
import { Header } from '@/components/layout/Header'
import { ReturnBadges } from '@/components/investments/ReturnBadges'
import { PortfolioChart } from '@/components/investments/PortfolioChart'
import { AssetList } from '@/components/investments/AssetList'

export function Investments() {
  return (
    <div className="flex flex-col gap-6">
      <Header title="Investimenti" />
      <ReturnBadges />
      <div className="flex gap-4 flex-col lg:flex-row">
        <PortfolioChart />
        <AssetList />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify at /investments**

Expected: 3 green return cards, area chart with 1M/3M/YTD/1A filter buttons that update chart data on click, asset list with colored allocation bars and return badges.

- [ ] **Step 6: Commit**

```bash
git add src/components/investments/ src/pages/Investments.tsx
git commit -m "feat: Investments page — return badges, portfolio chart with period filter, asset list"
```

---

### Task 7: Expenses Page

**Files:**
- Create: `src/components/expenses/MonthlyBarChart.tsx`
- Create: `src/components/expenses/CategoryList.tsx`
- Create: `src/components/expenses/TransactionList.tsx`
- Modify: `src/pages/Expenses.tsx`

- [ ] **Step 1: Create MonthlyBarChart**

Create `src/components/expenses/MonthlyBarChart.tsx`:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { monthlyExpenses } from '@/data/mock'

interface Props {
  activeIndex: number
}

export function MonthlyBarChart({ activeIndex }: Props) {
  const data = monthlyExpenses.map((m) => ({ month: m.month.split(' ')[0], total: m.total }))
  const avg = Math.round(data.reduce((s, d) => s + d.total, 0) / data.length)

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Spese Mensili — ultimi 6 mesi
          </CardTitle>
          <span className="text-xs text-muted-foreground">Media: {formatCurrency(avg)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={45}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Spese']}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === activeIndex ? '#6366f1' : 'hsl(var(--muted))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create CategoryList**

Create `src/components/expenses/CategoryList.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyExpense } from '@/data/types'

interface Props {
  month: MonthlyExpense
}

export function CategoryList({ month }: Props) {
  return (
    <Card className="w-full lg:w-64 shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Categorie
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {month.categories.map(({ name, icon, amount, color }) => {
          const pct = Math.round((amount / month.total) * 100)
          return (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{icon} {name}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create TransactionList**

Create `src/components/expenses/TransactionList.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyExpense } from '@/data/types'

interface Props {
  month: MonthlyExpense
}

export function TransactionList({ month }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ultime Transazioni
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {month.transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">{tx.categoryIcon}</span>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-400'}`}>
              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Build Expenses page**

Replace `src/pages/Expenses.tsx`:

```tsx
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { MonthlyBarChart } from '@/components/expenses/MonthlyBarChart'
import { CategoryList } from '@/components/expenses/CategoryList'
import { TransactionList } from '@/components/expenses/TransactionList'
import { monthlyExpenses, CURRENT_MONTH_INDEX } from '@/data/mock'

export function Expenses() {
  const [activeIndex, setActiveIndex] = useState(CURRENT_MONTH_INDEX)
  const activeMonth = monthlyExpenses[activeIndex]

  return (
    <div className="flex flex-col gap-6">
      <Header title="Spese" />
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          ◀
        </button>
        <span className="text-sm font-medium min-w-16 text-center">{activeMonth.month}</span>
        <button
          onClick={() => setActiveIndex((i) => Math.min(monthlyExpenses.length - 1, i + 1))}
          disabled={activeIndex === monthlyExpenses.length - 1}
          className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          ▶
        </button>
      </div>
      <div className="flex gap-4 flex-col lg:flex-row">
        <MonthlyBarChart activeIndex={activeIndex} />
        <CategoryList month={activeMonth} />
      </div>
      <TransactionList month={activeMonth} />
    </div>
  )
}
```

- [ ] **Step 5: Verify at /expenses**

Expected: Month navigator shows "Apr 26", arrows navigate months, bar chart highlights active month in purple, category bars + transactions update when month changes.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/expenses/ src/pages/Expenses.tsx
git commit -m "feat: Expenses page — monthly chart, categories, transactions, month navigation"
```

---

### Task 8: Final Verification & Polish

- [ ] **Step 1: Check all 4 pages in browser**

```bash
npm run dev
```

Visit each route and verify:
- `/` — 4 KPI cards, area chart, allocation bars
- `/accounts` — donut chart, account list, trend chart
- `/investments` — 3 return cards, portfolio chart (period filter works), asset list
- `/expenses` — bar chart, categories, transactions (month nav works)

- [ ] **Step 2: Test dark/light toggle**

Click theme toggle in sidebar. Expected: All backgrounds, text, borders switch cleanly between dark and light. Charts tooltips match theme.

- [ ] **Step 3: Test mobile layout**

Open DevTools → Toggle device toolbar → 375px width. Expected:
- Sidebar hidden
- Hamburger button appears in top-right of header
- Tapping opens full-screen nav overlay
- KPI cards show 2×2 grid
- Charts fill full width

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass with no errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification — all pages, dark/light, mobile confirmed"
```
