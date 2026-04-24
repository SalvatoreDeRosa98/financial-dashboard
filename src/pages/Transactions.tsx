import { useMemo, useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatDateLabel, safeNumber } from '../lib/utils'
import {
  TransactionEditorModal,
  TransactionFormPanel,
  TransactionRowButton,
  type TransactionFormState,
} from '../components/money/MoneyPanels'
import type { TransactionItem, TransactionStatus } from '../data/types'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
}

function transactionToForm(transaction: TransactionItem): TransactionFormState {
  return {
    title: transaction.title,
    category: transaction.category,
    subcategory: transaction.subcategory ?? '',
    amount: String(transaction.amount),
    currency: transaction.currency,
    date: transaction.date,
    type: transaction.type,
    accountId: transaction.accountId,
    transferAccountId: transaction.transferAccountId ?? null,
    status: transaction.status ?? 'paid',
    tags: transaction.tags ?? [],
    notes: transaction.notes ?? '',
    attachmentName: transaction.attachmentName ?? '',
    attachmentUrl: transaction.attachmentUrl ?? '',
    linkedRecurringExpenseId: transaction.linkedRecurringExpenseId ?? null,
  }
}

export function TransactionsPage() {
  const {
    accounts,
    addTransaction,
    baseCurrency,
    categories,
    duplicateTransaction,
    transactions,
    updateTransaction,
  } = useFinanceData()
  const [form, setForm] = useState<TransactionFormState>({
    title: '',
    category: categories.find((category) => category.type === 'expense')?.name ?? 'Cibo',
    subcategory: '',
    amount: '',
    currency: baseCurrency,
    date: todayKey(),
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
    transferAccountId: accounts[1]?.id ?? null,
    status: 'paid',
    tags: [],
    notes: '',
    attachmentName: '',
    attachmentUrl: '',
    linkedRecurringExpenseId: null,
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TransactionFormState>(form)

  const selectedTransaction =
    transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null

  const filteredTransactions = useMemo(() => {
    const visible = transactions.filter((transaction) => {
      const searchableText = [
        transaction.title,
        transaction.category,
        transaction.subcategory ?? '',
        ...(transaction.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = !search || searchableText.includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesStatus = statusFilter === 'all' || (transaction.status ?? 'paid') === statusFilter
      const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter
      const matchesTag = !tagFilter || (transaction.tags ?? []).some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()))

      return matchesSearch && matchesType && matchesStatus && matchesAccount && matchesTag
    })

    return visible.sort((left, right) => {
      if (sortBy === 'date-asc') return left.date.localeCompare(right.date)
      if (sortBy === 'amount-desc') return right.amount - left.amount
      if (sortBy === 'amount-asc') return left.amount - right.amount
      return right.date.localeCompare(left.date)
    })
  }, [accountFilter, search, sortBy, statusFilter, tagFilter, transactions, typeFilter])

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId)
    return account ? `${account.institution} · ${account.name}` : 'Conto non trovato'
  }

  const openEditor = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    setEditForm(transactionToForm(transaction))
    setSelectedTransactionId(transactionId)
  }

  return (
    <div className="stack gap-lg">
      <section className="grid content-grid">
        <TransactionFormPanel
          accounts={accounts}
          categories={categories}
          form={form}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onSubmit={() => {
            addTransaction({
              title: form.title,
              category: form.type === 'transfer' ? 'Trasferimento interno' : form.category,
              subcategory: form.subcategory,
              amount: safeNumber(form.amount),
              currency: form.currency,
              date: form.date,
              type: form.type,
              accountId: form.accountId,
              transferAccountId: form.type === 'transfer' ? form.transferAccountId : null,
              status: form.status,
              tags: form.tags,
              notes: form.notes,
              attachmentName: form.attachmentName,
              attachmentUrl: form.attachmentUrl,
              linkedRecurringExpenseId: form.linkedRecurringExpenseId ?? null,
            })
            setForm((current) => ({
              ...current,
              title: '',
              amount: '',
              notes: '',
              tags: [],
              attachmentName: '',
              attachmentUrl: '',
            }))
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
              placeholder="Cerca per descrizione, categoria o tag"
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
              <option value="transfer">Solo trasferimenti</option>
            </select>
            <select
              className="input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="all">Tutti gli stati</option>
              <option value="planned">Previsti</option>
              <option value="confirmed">Confermati</option>
              <option value="paid">Pagati</option>
            </select>
          </div>

          <div className="grid tri-grid">
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
            <input
              className="input"
              placeholder="Filtra per tag"
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            />
            <select
              className="input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="date-desc">Data piu recente</option>
              <option value="date-asc">Data piu vecchia</option>
              <option value="amount-desc">Importo piu alto</option>
              <option value="amount-asc">Importo piu basso</option>
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
                  actions={
                    <>
                      <select
                        className="input compact-input"
                        value={transaction.status ?? 'paid'}
                        onChange={(event) =>
                          updateTransaction(transaction.id, {
                            title: transaction.title,
                            category: transaction.category,
                            subcategory: transaction.subcategory ?? '',
                            amount: transaction.amount,
                            currency: transaction.currency,
                            date: transaction.date,
                            type: transaction.type,
                            accountId: transaction.accountId,
                            transferAccountId: transaction.transferAccountId ?? null,
                            status: event.target.value as TransactionStatus,
                            tags: transaction.tags ?? [],
                            notes: transaction.notes ?? '',
                            attachmentName: transaction.attachmentName ?? '',
                            attachmentUrl: transaction.attachmentUrl ?? '',
                            linkedRecurringExpenseId: transaction.linkedRecurringExpenseId ?? null,
                          })
                        }
                      >
                        <option value="planned">Previsto</option>
                        <option value="confirmed">Confermato</option>
                        <option value="paid">Pagato</option>
                      </select>
                      <button className="ghost-button" onClick={() => duplicateTransaction(transaction.id)} type="button">
                        Duplica
                      </button>
                    </>
                  }
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
        categories={categories}
        form={editForm}
        isOpen={Boolean(selectedTransaction)}
        onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
        onClose={() => setSelectedTransactionId(null)}
        onDuplicate={() => {
          if (!selectedTransaction) return
          duplicateTransaction(selectedTransaction.id)
        }}
        onSave={() => {
          if (!selectedTransaction) return
          updateTransaction(selectedTransaction.id, {
            title: editForm.title,
            category: editForm.type === 'transfer' ? 'Trasferimento interno' : editForm.category,
            subcategory: editForm.subcategory,
            amount: safeNumber(editForm.amount),
            currency: editForm.currency,
            date: editForm.date,
            type: editForm.type,
            accountId: editForm.accountId,
            transferAccountId: editForm.type === 'transfer' ? editForm.transferAccountId : null,
            status: editForm.status,
            tags: editForm.tags,
            notes: editForm.notes,
            attachmentName: editForm.attachmentName,
            attachmentUrl: editForm.attachmentUrl,
            linkedRecurringExpenseId: editForm.linkedRecurringExpenseId ?? null,
          })
          setSelectedTransactionId(null)
        }}
        title={selectedTransaction?.title ?? 'Movimento'}
      />
    </div>
  )
}
