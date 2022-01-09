onload = () => {
  displayUser()
  displayTransactions()
}

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB

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

const displayTransactions = () => {
  const request = indexedDB.open('TransactionsDatabase', 1)
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('transactions', 'readwrite')
    const store = transaction.objectStore('transactions')

    const emailAddress = store.index('emailAddress')

    const emailQuery = emailAddress.getAll([user])

    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
      emailQuery.result.forEach((element) => {
        const activities = document.querySelector('#activities')
        let li = document.createElement('li')
        activities.appendChild(li)
        li.innerHTML = element.timestamp
      })
    }
    transaction.oncomplete = () => db.close()
  }
}

// CHOOSE TRANSACTION
const transactionTypeSelector = document.querySelector('#transaction-type')
const formTransfer = document.querySelector('#transfer-form')
const formDeposit = document.querySelector('#deposit-form')
const formPayment = document.querySelector('#payment-form')

const selectTransactionType = (event) => {
  let value = event.target.value
  if (value === 'deposit') {
    formDeposit.classList.remove('invisible')
    formTransfer.classList.add('invisible')
    formPayment.classList.add('invisible')
  }
  if (value === 'transfer') {
    formDeposit.classList.add('invisible')
    formTransfer.classList.remove('invisible')
    formPayment.classList.add('invisible')
  }
  if (value === 'payment') {
    formDeposit.classList.add('invisible')
    formTransfer.classList.add('invisible')
    formPayment.classList.remove('invisible')
  }
}

transactionTypeSelector.addEventListener('change', selectTransactionType)

const addDepositTransaction = () => {
  let amount = parseFloat(document.querySelector('#deposit-amount').value)
  const request = indexedDB.open('TransactionsDatabase', 1)

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('transactions', {
      keypath: 'id',
      autoincrement: true,
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
      amount: amount,
      type: transactionTypeSelector.value,
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

    const depositorKey = emailAddress.getKey([user])
    depositorKey.onsuccess = () => {
      const depositorQuery = store.get(depositorKey.result)
      depositorQuery.onsuccess = () => {
        const depositorData = depositorQuery.result
        depositorData.balance += amount
        const requestUpdate = store.put(depositorData, depositorKey.result)
        requestUpdate.onsuccess = () => {
          document.querySelector('#account-balance-container').innerText =
            depositorData.balance
        }
      }
    }
  }
}

const addTransferTransaction = () => {
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
      type: transactionTypeSelector.value,
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

const addPaymentTransaction = () => {
  let amount = parseFloat(document.querySelector('#payment-amount').value)
  const request = indexedDB.open('TransactionsDatabase', 1)
  const biller = document.querySelector('#biller').value

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('transactions', {
      keypath: 'id',
      autoincrement: true,
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
      recipientAddress: biller,
      amount: amount,
      type: transactionTypeSelector.value,
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

    const payorKey = emailAddress.getKey([user])
    payorKey.onsuccess = () => {
      const payorQuery = store.get(payorKey.result)
      payorQuery.onsuccess = () => {
        const payorData = payorQuery.result
        payorData.balance -= amount
        const requestUpdate = store.put(payorData, payorKey.result)
        requestUpdate.onsuccess = () => {
          document.querySelector('#account-balance-container').innerText =
            payorData.balance
        }
      }
    }
  }
}

formDeposit.addEventListener('submit', (e) => {
  e.preventDefault()
})
formTransfer.addEventListener('submit', (e) => {
  e.preventDefault()
})
formPayment.addEventListener('submit', (e) => {
  e.preventDefault()
})

// TODO: Submit Transactions
const submitDepositBtn = document.querySelector('#submit-deposit-btn')
const submitTransferBtn = document.querySelector('#submit-transfer-btn')
const submitPaymentBtn = document.querySelector('#submit-payment-btn')

submitDepositBtn.addEventListener('click', addDepositTransaction)
submitTransferBtn.addEventListener('click', addTransferTransaction)
submitPaymentBtn.addEventListener('click', addPaymentTransaction)
