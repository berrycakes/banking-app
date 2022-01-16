onload = () => {
  displayUser()
  fetchAvatar()
  displayTransactions()
}

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB
let transactionKey = 1

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
      const account = emailQuery.result
      document.querySelector(
        '#user-name'
      ).innerText = `Hello, ${account.firstName}`
      document.querySelector('#account-balance-container').innerHTML =
        parseFloat(account.balance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      document.querySelector(
        '#account-name-container'
      ).innerHTML = `${account.firstName} ${account.lastName}`
    }
    transaction.oncomplete = () => db.close()
  }
}

const fetchAvatar = () => {
  let url = `https://avatars.dicebear.com/api/big-smile/${user}.svg?`
  document.querySelector('#avatar').src = url
}

const displayTransactions = () => {
  const request = indexedDB.open('TransactionsDatabase', 1)
  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('transactions', {
      keypath: 'id',
      autoincrement: true,
    })
    store.createIndex('type', ['type'], { unique: false })
    store.createIndex('timestamp', ['timestamp'], { unique: false })
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

    const emailAddress = store.index('emailAddress')

    const emailQuery = emailAddress.getAll([user])

    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
      let depositsAmount = 0
      let transfersAmount = 0
      let paymentsAmount = 0
      emailQuery.result.forEach((element) => {
        const activities = document.querySelector('#activities')
        let tr = document.createElement('tr')
        activities.appendChild(tr)
        const newTimestamp = new Date(element.timestamp)
        tr.innerHTML = `<td>${newTimestamp.toUTCString().substring(4)} </td>
                        <td>${element.type}</td>
                        <td>${element.recipientAddress}</td>
                        <td class="currency ${
                          element.type
                        }" id="amount-column">${parseFloat(
          element.amount
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>`
        if (element.type === 'deposit') {
          depositsAmount += parseFloat(element.amount)
        }
        if (element.type === 'transfer') {
          transfersAmount += parseFloat(element.amount)
        }
        if (element.type === 'payment') {
          paymentsAmount += parseFloat(element.amount)
        }
        console.log(depositsAmount)
      })
      document.querySelector('#account-income-container').innerHTML =
        parseFloat(depositsAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      document.querySelector('#account-expense-container').innerHTML =
        parseFloat(transfersAmount + paymentsAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      const ctx = document.getElementById('myChart').getContext('2d')
      const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['deposits', 'transfers', 'bills payment'],
          datasets: [
            {
              label: ['income'],
              data: [depositsAmount, transfersAmount, paymentsAmount],
              backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
      transaction.oncomplete = () => db.close()
    }
  }
  request.onerror = () => console.log('error tx db')
}

// CHOOSE TRANSACTION
const transactionTypeSelector = document.querySelector('#transaction-type')
const formTransfer = document.querySelector('#transfer-form')
const formDeposit = document.querySelector('#deposit-form')
const formPayment = document.querySelector('#payment-form')

const selectTransactionType = (event) => {
  document.querySelector('#transaction-type').classList.remove('invisible')
  let value = event.target.value
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

const addIncome = () => {
  document.querySelector('#transaction-type').classList.toggle('invisible')
  document.querySelector('#transaction-modal').classList.remove('invisible')
  formDeposit.classList.remove('invisible')
  formTransfer.classList.add('invisible')
  formPayment.classList.add('invisible')
}

transactionTypeSelector.addEventListener('change', selectTransactionType)

const addDepositTransaction = () => {
  let amount = parseFloat(document.querySelector('#deposit-amount').value)
  const request = indexedDB.open('TransactionsDatabase', 1)

  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains('transactions')) {
      const store = db.createObjectStore('transactions', {
        keypath: 'id',
        autoIncrement: true,
      })
      store.createIndex('type', ['type'], { unique: false })
      store.createIndex('timestamp', ['timestamp'], { unique: false })
      store.createIndex('emailAddress', ['emailAddress'], { unique: false })
      store.createIndex('recipientAddress', ['recipientAddress'], {
        unique: false,
      })
      store.createIndex('amount', ['amount'], { unique: false })
    }
  }

  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('transactions', 'readwrite')
    const store = transaction.objectStore('transactions')

    store.put({
      timestamp: new Date(),
      emailAddress: user,
      amount: amount,
      type: 'deposit',
      recipientAddress: 'cash-in',
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
            depositorData.balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
        }
      }
    }
  }
  modal.classList.add('invisible')
  alert('transaction successful')
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

    store.put(
      {
        timestamp: new Date(),
        emailAddress: user,
        recipientAddress: recipientAddress,
        amount: amount,
        type: 'transfer',
      },
      transactionKey
    )
    transaction.oncomplete = () => {
      console.log('added transaction')
      db.close()
      transactionKey++
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
            parseFloat(senderData.balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
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
  modal.classList.add('invisible')
  alert('transaction successful')
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

    store.put(
      {
        timestamp: new Date(),
        emailAddress: user,
        recipientAddress: biller,
        amount: amount,
        type: 'payment',
      },
      transactionKey
    )
    transaction.oncomplete = () => {
      console.log('added transaction')
      db.close()
      transactionKey++
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
            parseFloat(payorData.balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
        }
      }
    }
  }
  modal.classList.add('invisible')
  alert('transaction successful')
}

const showTransactionContainer = () => {
  document.querySelector('#transaction-modal').classList.remove('invisible')
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
const addExpenseBtn = document.querySelector('#add-transaction-btn')
const addIncomeBtn = document.querySelector('#add-income-btn')
const submitDepositBtn = document.querySelector('#submit-deposit-btn')
const submitTransferBtn = document.querySelector('#submit-transfer-btn')
const submitPaymentBtn = document.querySelector('#submit-payment-btn')

addExpenseBtn.addEventListener('click', showTransactionContainer)
addIncomeBtn.addEventListener('click', addIncome)
submitDepositBtn.addEventListener('click', addDepositTransaction)
submitTransferBtn.addEventListener('click', addTransferTransaction)
submitPaymentBtn.addEventListener('click', addPaymentTransaction)

const logoutBtn = document.querySelector('#logout')
const handleLogout = () => {
  sessionStorage.clear()
  document.location = '../index.html'
}
logoutBtn.addEventListener('click', handleLogout)

const modal = document.querySelector('#transaction-modal')
window.onclick = (event) => {
  if (event.target == modal) {
    modal.classList.add('invisible')
    document.location = './dashboard.html'
  }
}

// TODO: 1. Sort table
// 2. query TX for expense tracker
// 3. create bank employee page
// 4. add validation for all inputs
// 5.
