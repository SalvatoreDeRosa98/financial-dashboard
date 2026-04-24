import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatDateLabel, safeNumber } from '../lib/utils'
import {
  TransactionEditorModal,
  TransactionFormPanel,
  TransactionRowButton,
  type TransactionFormState,
} from '../components/money/MoneyPanels'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
}

export function TransactionsPage() {
  const { accounts, addTransaction, baseCurrency, transactions, updateTransaction } = useFinanceData()
  const [form, setForm] = useState<TransactionFormState>({
    title: '',
    category: 'Cibo',
    amount: '',
    currency: baseCurrency,
    date: todayKey(),
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TransactionFormState>(form)

  const selectedTransaction =
    transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !search ||
      transaction.title.toLowerCase().includes(search.toLowerCase()) ||
      transaction.category.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter

    return matchesSearch && matchesType && matchesAccount
  })

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId)
    return account ? `${account.institution} · ${account.name}` : 'Conto non trovato'
  }

  const openEditor = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return

    setEditForm({
      title: transaction.title,
      category: transaction.category,
      amount: String(transaction.amount),
      currency: transaction.currency,
      date: transaction.date,
      type: transaction.type,
      accountId: transaction.accountId,
    })
    setSelectedTransactionId(transactionId)
  }

  return (
    <div className="stack gap-lg">
      <section className="grid content-grid">
        <TransactionFormPanel
          accounts={accounts}
          form={form}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onSubmit={() => {
            addTransaction({
              title: form.title,
              category: form.category,
              amount: safeNumber(form.amount),
              currency: form.currency,
              date: form.date,
              type: form.type,
              accountId: form.accountId,
            })
            setForm((current) => ({ ...current, title: '', amount: '' }))
          }}
        />

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Movimenti</p>
              <h2>Storico completo</h2>
            </div>
          </div>

          <div className="grid tri-grid">
            <input
              className="input"
              placeholder="Cerca per descrizione o categoria"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="input"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            >
              <option value="all">Tutti i tipi</option>
              <option value="income">Solo entrate</option>
              <option value="expense">Solo spese</option>
            </select>
            <select
              className="input"
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
            >
              <option value="all">Tutti i conti</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution} · {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="stack gap-sm">
            {filteredTransactions.length ? (
              filteredTransactions.map((transaction) => (
                <TransactionRowButton
                  key={transaction.id}
                  accountLabel={`${getAccountLabel(transaction.accountId)} · ${formatDateLabel(transaction.date)}`}
                  transaction={transaction}
                  onClick={() => openEditor(transaction.id)}
                />
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessun movimento trovato</strong>
                <p>Prova a cambiare i filtri oppure registra un nuovo movimento.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <TransactionEditorModal
        accounts={accounts}
        form={editForm}
        isOpen={Boolean(selectedTransaction)}
        onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
        onClose={() => setSelectedTransactionId(null)}
        onSave={() => {
          if (!selectedTransaction) return
          updateTransaction(selectedTransaction.id, {
            title: editForm.title,
            category: editForm.category,
            amount: safeNumber(editForm.amount),
            currency: editForm.currency,
            date: editForm.date,
            type: editForm.type,
            accountId: editForm.accountId,
          })
          setSelectedTransactionId(null)
        }}
        title={selectedTransaction?.title ?? 'Movimento'}
      />
    </div>
  )
}
