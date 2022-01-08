onload = () => displayUser()

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB

const transactionTypeSelector = document.querySelector('#transaction-type')
const formTransfer = document.querySelector('#transfer-form')
const formDeposit = document.querySelector('#deposit-form')
const formPayment = document.querySelector('#payment-form')
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

const selectTransactionType = () => {
  if (transactionTypeSelector.value === 'Deposit') {
    formDeposit.classList.remove('invisible')
  }
}

const addTransaction = () => {
  let recipientAddress = document.querySelector('#recipient').value
  let amount = parseFloat(document.querySelector('#transfer-amount').value)
  const request = indexedDB.open('TransactionsDatabase', 1)

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('transactions', {
      keypath: 'id',
      autoIncrement: true,
    })
    store.createIndex('type', ['type'], { unique: false })
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

    store.put({
      timestamp: new Date(),
      emailAddress: user,
      recipientAddress: recipientAddress,
      amount: amount,
    })
    transaction.oncomplete = () => {
      console.log('added transaction')
      db.close()
    }
  }

  const requestAccount = indexedDB.open('AccountsDatabase', 1)
  requestAccount.onsuccess = () => {
    const db = requestAccount.result
    const transaction = db.transaction('accounts', 'readwrite')
    const store = transaction.objectStore('accounts')

    const emailAddress = store.index('emailAddress')

    const senderKey = emailAddress.getKey([user])
    senderKey.onsuccess = () => {
      console.log(senderKey.result)
      const senderQuery = store.get(senderKey.result)
      senderQuery.onsuccess = () => {
        const senderData = senderQuery.result
        senderData.balance -= amount
        const requestUpdateSender = store.put(senderData, senderKey.result)
        requestUpdateSender.onsuccess = () => {
          document.querySelector('#account-balance-container').innerText =
            senderData.balance
        }
      }
    }

    const recipientKey = emailAddress.getKey([recipientAddress])
    recipientKey.onsuccess = () => {
      console.log(recipientKey.result)
      const recipientQuery = store.get(recipientKey.result)
      recipientQuery.onsuccess = () => {
        const recipientData = recipientQuery.result
        recipientData.balance += amount
        const requestUpdateRecipient = store.put(
          recipientData,
          recipientKey.result
        )
        requestUpdateRecipient.onsucess = () => {
          console.log(recipientData)
        }
      }
    }
  }
}

const addIncome = () => {
  let recipientAddress = document.querySelector('#recipient').value
  let amount = parseFloat(document.querySelector('#transfer-amount').value)
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

    store.put({
      timestamp: new Date(),
      emailAddress: user,
      recipientAddress: recipientAddress,
      amount: amount,
    })
    transaction.oncomplete = () => {
      console.log('added transaction')
      db.close()
    }
  }

  const requestAccount = indexedDB.open('AccountsDatabase', 1)
  requestAccount.onsuccess = () => {
    const db = requestAccount.result
    const transaction = db.transaction('accounts', 'readwrite')
    const store = transaction.objectStore('accounts')

    const emailAddress = store.index('emailAddress')

    const senderKey = emailAddress.getKey([user])
    senderKey.onsuccess = () => {
      console.log(senderKey.result)
      const senderQuery = store.get(senderKey.result)
      senderQuery.onsuccess = () => {
        const senderData = senderQuery.result
        senderData.balance -= amount
        const requestUpdateSender = store.put(senderData, senderKey.result)
        requestUpdateSender.onsuccess = () => {
          document.querySelector('#account-balance-container').innerText =
            senderData.balance
        }
      }
    }

    const recipientKey = emailAddress.getKey([recipientAddress])
    recipientKey.onsuccess = () => {
      console.log(recipientKey.result)
      const recipientQuery = store.get(recipientKey.result)
      recipientQuery.onsuccess = () => {
        const recipientData = recipientQuery.result
        recipientData.balance += amount
        const requestUpdateRecipient = store.put(
          recipientData,
          recipientKey.result
        )
        requestUpdateRecipient.onsucess = () => {
          console.log(recipientData)
        }
      }
    }
  }
}

formTransfer.addEventListener('submit', (e) => {
  e.preventDefault()
})
submitTransactionBtn.addEventListener('click', addTransaction)
