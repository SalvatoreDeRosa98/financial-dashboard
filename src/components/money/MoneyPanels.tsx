import { useState } from 'react'
import { formatCurrency, formatDateLabel, safeNumber } from '../../lib/utils'
import type { AccountItem, CurrencyCode, TransactionItem } from '../../data/types'

const transactionCategories = ['Cibo', 'Casa', 'Trasporti', 'Tempo libero', 'Abbonamenti', 'Entrate']

export interface TransactionFormState {
  title: string
  category: string
  amount: string
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense'
  accountId: string
}

export function AccountEditorCard({
  account,
  onSave,
}: {
  account: Pick<AccountItem, 'id' | 'institution' | 'name' | 'balance' | 'currency'>
  onSave: (id: string, patch: { institution?: string; name?: string; balance?: number }) => void
}) {
  const [institutionDraft, setInstitutionDraft] = useState(account.institution)
  const [nameDraft, setNameDraft] = useState(account.name)
  const [balanceDraft, setBalanceDraft] = useState(String(account.balance))

  return (
    <article className="panel soft-card">
      <input
        className="input"
        value={institutionDraft}
        onChange={(event) => setInstitutionDraft(event.target.value)}
        onBlur={() => onSave(account.id, { institution: institutionDraft })}
      />
      <input
        className="input"
        value={nameDraft}
        onChange={(event) => setNameDraft(event.target.value)}
        onBlur={() => onSave(account.id, { name: nameDraft })}
      />
      <div className="large-value">{formatCurrency(account.balance, account.currency)}</div>
      <div className="inline-editor">
        <label htmlFor={`account-${account.id}`}>Saldo attuale</label>
        <input
          id={`account-${account.id}`}
          className="input"
          value={balanceDraft}
          type="number"
          onChange={(event) => setBalanceDraft(event.target.value)}
          onBlur={() => {
            const nextBalance = safeNumber(balanceDraft, account.balance)
            setBalanceDraft(String(nextBalance))
            onSave(account.id, { balance: nextBalance })
          }}
        />
      </div>
    </article>
  )
}

export function TransactionFormPanel({
  accounts,
  form,
  onChange,
  onSubmit,
}: {
  accounts: Pick<AccountItem, 'id' | 'institution' | 'name'>[]
  form: TransactionFormState
  onChange: (patch: Partial<TransactionFormState>) => void
  onSubmit: () => void
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Nuova registrazione</p>
          <h2>Inserisci un movimento</h2>
        </div>
      </div>
      <form
        className="stack gap-sm"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <input
          className="input"
          placeholder="Descrizione"
          value={form.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <div className="grid split-grid">
          <select
            className="input"
            value={form.category}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            {transactionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Importo"
            value={form.amount}
            onChange={(event) => onChange({ amount: event.target.value })}
          />
        </div>
        <div className="grid split-grid">
          <select
            className="input"
            value={form.currency}
            onChange={(event) => onChange({ currency: event.target.value as CurrencyCode })}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CHF">CHF</option>
            <option value="CAD">CAD</option>
          </select>
          <select
            className="input"
            value={form.type}
            onChange={(event) => onChange({ type: event.target.value as 'income' | 'expense' })}
          >
            <option value="expense">Spesa</option>
            <option value="income">Entrata</option>
          </select>
        </div>
        <div className="grid split-grid">
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={(event) => onChange({ date: event.target.value })}
          />
          <select
            className="input"
            value={form.accountId}
            onChange={(event) => onChange({ accountId: event.target.value })}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.institution} · {account.name}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-button" type="submit">
          Salva movimento
        </button>
      </form>
    </article>
  )
}

export function TransactionRowButton({
  transaction,
  accountLabel,
  onClick,
}: {
  transaction: Pick<TransactionItem, 'id' | 'title' | 'category' | 'date' | 'accountId' | 'amount' | 'currency' | 'type'>
  accountLabel: string
  onClick: () => void
}) {
  return (
    <button className="list-card list-card-button" onClick={onClick} type="button">
      <div className="stack gap-xs">
        <strong>{transaction.title}</strong>
        <span className="muted-text">
          {transaction.category} - {formatDateLabel(transaction.date)}
        </span>
        <span className="muted-text">{accountLabel}</span>
      </div>
      <strong className={transaction.type === 'income' ? 'positive' : 'negative'}>
        {formatCurrency(transaction.amount, transaction.currency)}
      </strong>
    </button>
  )
}

export function TransactionEditorModal({
  accounts,
  isOpen,
  form,
  onChange,
  onClose,
  onSave,
  title,
}: {
  accounts: Pick<AccountItem, 'id' | 'institution' | 'name'>[]
  isOpen: boolean
  form: TransactionFormState
  onChange: (patch: Partial<TransactionFormState>) => void
  onClose: () => void
  onSave: () => void
  title: string
}) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Modifica movimento</p>
            <h2>{title}</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Chiudi
          </button>
        </div>

        <form
          className="stack gap-md"
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
        >
          <input className="input" value={form.title} onChange={(event) => onChange({ title: event.target.value })} />
          <div className="grid split-grid">
            <select className="input" value={form.category} onChange={(event) => onChange({ category: event.target.value })}>
              {transactionCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              value={form.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
            />
          </div>
          <div className="grid split-grid">
            <select
              className="input"
              value={form.currency}
              onChange={(event) => onChange({ currency: event.target.value as CurrencyCode })}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
            <select
              className="input"
              value={form.type}
              onChange={(event) => onChange({ type: event.target.value as 'income' | 'expense' })}
            >
              <option value="expense">Spesa</option>
              <option value="income">Entrata</option>
            </select>
          </div>
          <div className="grid split-grid">
            <input className="input" type="date" value={form.date} onChange={(event) => onChange({ date: event.target.value })} />
            <select
              className="input"
              value={form.accountId}
              onChange={(event) => onChange({ accountId: event.target.value })}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution} · {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="transaction-actions">
            <button className="primary-button" type="submit">
              Salva modifica
            </button>
            <button className="ghost-button" onClick={onClose} type="button">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
