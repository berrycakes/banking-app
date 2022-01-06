onload = () => displayUser()

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB

const form = document.querySelector('#transaction-form')
const submitTransactionBtn = document.querySelector(
  '#submit-add-transaction-btn'
)

const displayUser = () => {
  const request = indexedDB.open('AccountsDatabase', 1)
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('accounts', 'readwrite')
    const store = transaction.objectStore('accounts')

    const emailAddress = store.index('emailAddress')

    const emailQuery = emailAddress.get([user])

    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
      document.querySelector('#user-name').innerText =
        emailQuery.result.firstName
      document.querySelector('#account-balance-container').innerText =
        emailQuery.result.balance
    }
    transaction.oncomplete = () => db.close()
  }
}

const addTransaction = () => {
  const request = indexedDB.open('TransactionsDatabase', 1)

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('transactions', {
      keypath: 'id',
      autoIncrement: true,
    })
    store.createIndex('timestamp', ['timestamp'], { unique: true })
    store.createIndex('emailAddress', ['emailAddress'], { unique: false })
    store.createIndex('recipientAddress', ['recipientAddress'], {
      unique: false,
    })
    store.createIndex('amount', ['amount'], { unique: false })
  }
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('transactions', 'readwrite')
    const store = transaction.objectStore('transactions')
    let recipientAddress = document.querySelector('#recipient').value
    let amount = document.querySelector('#transfer-amount').value

    store.put({
      timestamp: new Date(),
      emailAddress: user,
      recipientAddress: recipientAddress,
      amount: parseFloat(amount),
    })
    transaction.oncomplete = () => db.close()
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
})
submitTransactionBtn.addEventListener('click', addTransaction)
