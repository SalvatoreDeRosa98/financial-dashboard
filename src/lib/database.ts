import { defaultFinanceState, emptyFinanceState, type FinanceState } from '../data/state'

const DB_NAME = 'financial-dashboard-db'
const DB_VERSION = 1

const LEGACY_STATE_KEY = 'fintracker-pro-state-v2'
const LEGACY_USER_NAME_KEY = 'fintracker-user-name'

const DATA_STORES = [
  'accounts',
  'budgets',
  'transactions',
  'positions',
  'watchlist',
  'calendarItems',
  'taxCredits',
  'strategyTargets',
] as const

type DataStoreName = (typeof DATA_STORES)[number]
type MetaKey = 'baseCurrency' | 'userName'

interface MetaEntry<T = string> {
  key: MetaKey
  value: T
}

interface BootstrapPayload {
  state: FinanceState
  userName: string
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
  })
}

function openFinanceDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' })
      }

      const storesWithIdKey = [
        'accounts',
        'budgets',
        'transactions',
        'positions',
        'watchlist',
        'calendarItems',
        'taxCredits',
      ]

      for (const storeName of storesWithIdKey) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      }

      if (!database.objectStoreNames.contains('strategyTargets')) {
        database.createObjectStore('strategyTargets', { keyPath: 'assetType' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
  })
}

function replaceStore<Item>(transaction: IDBTransaction, storeName: DataStoreName, items: Item[]) {
  const store = transaction.objectStore(storeName)
  store.clear()

  for (const item of items) {
    store.put(item)
  }
}

function buildStateFromLegacyStorage(rawState: string | null, userName: string) {
  if (!rawState) {
    return userName ? emptyFinanceState : defaultFinanceState
  }

  try {
    return { ...defaultFinanceState, ...JSON.parse(rawState) } as FinanceState
  } catch {
    return userName ? emptyFinanceState : defaultFinanceState
  }
}

function clearLegacyStorage() {
  try {
    window.localStorage.removeItem(LEGACY_STATE_KEY)
    window.localStorage.removeItem(LEGACY_USER_NAME_KEY)
  } catch {
    // Ignore cleanup failures: data is already safe in IndexedDB at this point.
  }
}

async function readStoredData() {
  const database = await openFinanceDatabase()
  const transaction = database.transaction([...DATA_STORES, 'meta'], 'readonly')

  const [
    accounts,
    budgets,
    transactions,
    positions,
    watchlist,
    calendarItems,
    taxCredits,
    strategyTargets,
    baseCurrencyEntry,
    userNameEntry,
  ] = await Promise.all([
    requestToPromise(transaction.objectStore('accounts').getAll()),
    requestToPromise(transaction.objectStore('budgets').getAll()),
    requestToPromise(transaction.objectStore('transactions').getAll()),
    requestToPromise(transaction.objectStore('positions').getAll()),
    requestToPromise(transaction.objectStore('watchlist').getAll()),
    requestToPromise(transaction.objectStore('calendarItems').getAll()),
    requestToPromise(transaction.objectStore('taxCredits').getAll()),
    requestToPromise(transaction.objectStore('strategyTargets').getAll()),
    requestToPromise(transaction.objectStore('meta').get('baseCurrency')),
    requestToPromise(transaction.objectStore('meta').get('userName')),
  ])

  await transactionToPromise(transaction)

  const hasRecords =
    accounts.length > 0 ||
    budgets.length > 0 ||
    transactions.length > 0 ||
    positions.length > 0 ||
    watchlist.length > 0 ||
    calendarItems.length > 0 ||
    taxCredits.length > 0 ||
    strategyTargets.length > 0 ||
    Boolean(baseCurrencyEntry) ||
    Boolean(userNameEntry)

  if (!hasRecords) {
    return null
  }

  return {
    state: {
      baseCurrency: (baseCurrencyEntry as MetaEntry<FinanceState['baseCurrency']> | undefined)?.value ?? 'EUR',
      accounts,
      budgets,
      transactions,
      positions,
      watchlist,
      calendarItems,
      taxCredits,
      strategyTargets,
    } satisfies FinanceState,
    userName: (userNameEntry as MetaEntry<string> | undefined)?.value ?? '',
  } satisfies BootstrapPayload
}

export async function saveFinanceState(state: FinanceState) {
  if (typeof window === 'undefined') return

  const database = await openFinanceDatabase()
  const transaction = database.transaction([...DATA_STORES, 'meta'], 'readwrite')

  replaceStore(transaction, 'accounts', state.accounts)
  replaceStore(transaction, 'budgets', state.budgets)
  replaceStore(transaction, 'transactions', state.transactions)
  replaceStore(transaction, 'positions', state.positions)
  replaceStore(transaction, 'watchlist', state.watchlist)
  replaceStore(transaction, 'calendarItems', state.calendarItems)
  replaceStore(transaction, 'taxCredits', state.taxCredits)
  replaceStore(transaction, 'strategyTargets', state.strategyTargets)
  transaction.objectStore('meta').put({
    key: 'baseCurrency',
    value: state.baseCurrency,
  } satisfies MetaEntry<FinanceState['baseCurrency']>)

  await transactionToPromise(transaction)
}

export async function saveUserName(userName: string) {
  if (typeof window === 'undefined') return

  const database = await openFinanceDatabase()
  const transaction = database.transaction(['meta'], 'readwrite')

  await requestToPromise(
    transaction.objectStore('meta').put({
      key: 'userName',
      value: userName,
    } satisfies MetaEntry<string>),
  )

  await transactionToPromise(transaction)
}

export async function bootstrapFinanceState(): Promise<BootstrapPayload> {
  if (typeof window === 'undefined') {
    return { state: defaultFinanceState, userName: '' }
  }

  const storedData = await readStoredData()
  if (storedData) {
    return storedData
  }

  const legacyUserName = window.localStorage.getItem(LEGACY_USER_NAME_KEY) ?? ''
  const legacyState = window.localStorage.getItem(LEGACY_STATE_KEY)
  const initialState = buildStateFromLegacyStorage(legacyState, legacyUserName)
  const payload = {
    state: initialState,
    userName: legacyUserName,
  } satisfies BootstrapPayload

  await saveFinanceState(payload.state)
  await saveUserName(payload.userName)

  if (legacyState !== null || legacyUserName) {
    clearLegacyStorage()
  }

  return payload
}
