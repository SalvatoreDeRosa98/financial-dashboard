import { useState, type ReactNode } from 'react'
import { formatCurrency, formatDateLabel, safeNumber } from '../../lib/utils'
import type {
  AccountItem,
  CurrencyCode,
  TransactionCategory,
  TransactionItem,
  TransactionStatus,
} from '../../data/types'

const accountKindLabels = {
  checking: 'Conto corrente',
  cash: 'Contanti',
  card: 'Carta',
  broker: 'Broker',
  savings: 'Risparmio',
} as const

const transactionStatusLabels: Record<TransactionStatus, string> = {
  planned: 'Previsto',
  confirmed: 'Confermato',
  paid: 'Pagato',
}

export interface TransactionFormState {
  title: string
  category: string
  subcategory: string
  amount: string
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  transferAccountId: string | null
  status: TransactionStatus
  tags: string[]
  notes: string
  attachmentName: string
  attachmentUrl: string
  linkedRecurringExpenseId?: string | null
}

function tagsToDraft(tags: string[]) {
  return tags.join(', ')
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Impossibile leggere il file'))
    reader.readAsDataURL(file)
  })
}

export function AccountEditorCard({
  account,
  onSave,
}: {
  account: Pick<AccountItem, 'id' | 'institution' | 'name' | 'balance' | 'currency' | 'kind'>
  onSave: (id: string, patch: { institution?: string; name?: string; balance?: number; kind?: AccountItem['kind'] }) => void
}) {
  const [institutionDraft, setInstitutionDraft] = useState(account.institution)
  const [nameDraft, setNameDraft] = useState(account.name)
  const [balanceDraft, setBalanceDraft] = useState(String(account.balance))

  return (
    <article className="panel soft-card">
      <select
        className="input"
        value={account.kind ?? 'checking'}
        onChange={(event) => onSave(account.id, { kind: event.target.value as AccountItem['kind'] })}
      >
        {Object.entries(accountKindLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
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
  categories,
  form,
  onChange,
  onSubmit,
}: {
  accounts: Pick<AccountItem, 'id' | 'institution' | 'name'>[]
  categories: TransactionCategory[]
  form: TransactionFormState
  onChange: (patch: Partial<TransactionFormState>) => void
  onSubmit: () => void
}) {
  const categoryOptions = categories.filter((category) => category.type === form.type)
  const selectedCategory = categoryOptions.find((category) => category.name === form.category)

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
            value={form.type}
            onChange={(event) =>
              onChange({
                type: event.target.value as TransactionFormState['type'],
                category:
                  event.target.value === 'transfer'
                    ? 'Trasferimento interno'
                    : categories.find((category) => category.type === event.target.value)?.name ?? form.category,
                subcategory: '',
                transferAccountId: event.target.value === 'transfer' ? accounts[1]?.id ?? null : null,
              })
            }
          >
            <option value="expense">Spesa</option>
            <option value="income">Entrata</option>
            <option value="transfer">Trasferimento</option>
          </select>
          <input
            className="input"
            placeholder="Importo"
            value={form.amount}
            type="number"
            onChange={(event) => onChange({ amount: event.target.value })}
          />
        </div>
        {form.type === 'transfer' ? (
          <input className="input" value="Trasferimento interno" disabled />
        ) : (
          <div className="grid split-grid">
            <input
              className="input"
              list={`categories-${form.type}`}
              placeholder="Categoria"
              value={form.category}
              onChange={(event) => onChange({ category: event.target.value, subcategory: '' })}
            />
            <input
              className="input"
              list={`subcategories-${form.type}-${form.category}`}
              placeholder="Sottocategoria"
              value={form.subcategory}
              onChange={(event) => onChange({ subcategory: event.target.value })}
            />
            <datalist id={`categories-${form.type}`}>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.name} />
              ))}
            </datalist>
            <datalist id={`subcategories-${form.type}-${form.category}`}>
              {(selectedCategory?.subcategories ?? []).map((subcategory) => (
                <option key={subcategory} value={subcategory} />
              ))}
            </datalist>
          </div>
        )}
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
            value={form.status}
            onChange={(event) => onChange({ status: event.target.value as TransactionStatus })}
          >
            <option value="planned">Previsto</option>
            <option value="confirmed">Confermato</option>
            <option value="paid">Pagato</option>
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
        {form.type === 'transfer' ? (
          <select
            className="input"
            value={form.transferAccountId ?? ''}
            onChange={(event) => onChange({ transferAccountId: event.target.value || null })}
          >
            {accounts
              .filter((account) => account.id !== form.accountId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  Destinazione: {account.institution} · {account.name}
                </option>
              ))}
          </select>
        ) : null}
        <input
          className="input"
          placeholder="Tag separati da virgola"
          value={tagsToDraft(form.tags)}
          onChange={(event) =>
            onChange({
              tags: event.target.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        />
        <textarea
          className="input textarea"
          placeholder="Note o causale"
          value={form.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
        <div className="stack gap-xs">
          <label className="muted-label" htmlFor="transaction-attachment">
            Allegato ricevuta
          </label>
          <input
            id="transaction-attachment"
            className="input"
            type="file"
            accept="image/*,.pdf"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const attachmentUrl = await readFileAsDataUrl(file)
              onChange({ attachmentName: file.name, attachmentUrl })
            }}
          />
          {form.attachmentName ? <span className="muted-text">Allegato: {form.attachmentName}</span> : null}
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
  actions,
}: {
  transaction: Pick<
    TransactionItem,
    'id' | 'title' | 'category' | 'subcategory' | 'date' | 'accountId' | 'amount' | 'currency' | 'type' | 'status' | 'tags'
  >
  accountLabel: string
  onClick: () => void
  actions?: ReactNode
}) {
  return (
    <div className="list-card list-card-button-shell">
      <button className="list-card-button-main" onClick={onClick} type="button">
        <div className="stack gap-xs">
          <strong>{transaction.title}</strong>
          <span className="muted-text">
            {transaction.category}
            {transaction.subcategory ? ` · ${transaction.subcategory}` : ''} - {formatDateLabel(transaction.date)}
          </span>
          <span className="muted-text">{accountLabel}</span>
          <div className="inline-tags">
            <span className="status-pill">{transactionStatusLabels[transaction.status ?? 'paid']}</span>
            {(transaction.tags ?? []).slice(0, 3).map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <strong
          className={
            transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'muted-text'
          }
        >
          {transaction.type === 'transfer'
            ? `TR ${formatCurrency(transaction.amount, transaction.currency)}`
            : formatCurrency(transaction.amount, transaction.currency)}
        </strong>
      </button>
      {actions ? <div className="transaction-inline-actions">{actions}</div> : null}
    </div>
  )
}

export function TransactionEditorModal({
  accounts,
  categories,
  isOpen,
  form,
  onChange,
  onClose,
  onSave,
  onDuplicate,
  title,
}: {
  accounts: Pick<AccountItem, 'id' | 'institution' | 'name'>[]
  categories: TransactionCategory[]
  isOpen: boolean
  form: TransactionFormState
  onChange: (patch: Partial<TransactionFormState>) => void
  onClose: () => void
  onSave: () => void
  onDuplicate?: () => void
  title: string
}) {
  if (!isOpen) return null

  const categoryOptions = categories.filter((category) => category.type === form.type)
  const selectedCategory = categoryOptions.find((category) => category.name === form.category)

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
            <select
              className="input"
              value={form.type}
              onChange={(event) =>
                onChange({
                  type: event.target.value as TransactionFormState['type'],
                  category:
                    event.target.value === 'transfer'
                      ? 'Trasferimento interno'
                      : categories.find((category) => category.type === event.target.value)?.name ?? form.category,
                  subcategory: '',
                })
              }
            >
              <option value="expense">Spesa</option>
              <option value="income">Entrata</option>
              <option value="transfer">Trasferimento</option>
            </select>
            <input
              className="input"
              type="number"
              value={form.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
            />
          </div>
          {form.type === 'transfer' ? (
            <input className="input" value="Trasferimento interno" disabled />
          ) : (
            <div className="grid split-grid">
              <input
                className="input"
                list={`edit-categories-${form.type}`}
                value={form.category}
                onChange={(event) => onChange({ category: event.target.value, subcategory: '' })}
              />
              <input
                className="input"
                list={`edit-subcategories-${form.type}-${form.category}`}
                value={form.subcategory}
                onChange={(event) => onChange({ subcategory: event.target.value })}
              />
              <datalist id={`edit-categories-${form.type}`}>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
              <datalist id={`edit-subcategories-${form.type}-${form.category}`}>
                {(selectedCategory?.subcategories ?? []).map((subcategory) => (
                  <option key={subcategory} value={subcategory} />
                ))}
              </datalist>
            </div>
          )}
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
              value={form.status}
              onChange={(event) => onChange({ status: event.target.value as TransactionStatus })}
            >
              <option value="planned">Previsto</option>
              <option value="confirmed">Confermato</option>
              <option value="paid">Pagato</option>
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
          {form.type === 'transfer' ? (
            <select
              className="input"
              value={form.transferAccountId ?? ''}
              onChange={(event) => onChange({ transferAccountId: event.target.value || null })}
            >
              {accounts
                .filter((account) => account.id !== form.accountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    Destinazione: {account.institution} · {account.name}
                  </option>
                ))}
            </select>
          ) : null}
          <input
            className="input"
            value={tagsToDraft(form.tags)}
            onChange={(event) =>
              onChange({
                tags: event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          />
          <textarea
            className="input textarea"
            value={form.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
          <div className="stack gap-xs">
            <label className="muted-label" htmlFor="transaction-edit-attachment">
              Allegato ricevuta
            </label>
            <input
              id="transaction-edit-attachment"
              className="input"
              type="file"
              accept="image/*,.pdf"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const attachmentUrl = await readFileAsDataUrl(file)
                onChange({ attachmentName: file.name, attachmentUrl })
              }}
            />
            {form.attachmentName ? (
              <span className="muted-text">
                Allegato corrente: {form.attachmentName}
                {form.attachmentUrl ? (
                  <>
                    {' '}
                    ·{' '}
                    <a href={form.attachmentUrl} target="_blank" rel="noreferrer">
                      apri
                    </a>
                  </>
                ) : null}
              </span>
            ) : null}
          </div>
          <div className="transaction-actions">
            {onDuplicate ? (
              <button className="ghost-button" type="button" onClick={onDuplicate}>
                Duplica
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              Salva modifica
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
