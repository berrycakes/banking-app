onload = () => {
  displayUser()
  fetchAvatar()
  displayTransactions()
}

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB

// const displayUser = () => {
//   const request = indexedDB.open('AccountsDatabase', 1)
//   request.onsuccess = () => {
//     const db = request.result
//     const transaction = db.transaction('accounts', 'readwrite')
//     const store = transaction.objectStore('accounts')

//     const emailAddress = store.index('emailAddress')

//     const emailQuery = emailAddress.get([user])

//     emailQuery.onerror = () => console.log('cannot fetch account data')
//     emailQuery.onsuccess = () => {
//       const account = emailQuery.result
//       document.querySelector(
//         '#user-name'
//       ).innerText = `Hello, ${account.firstName}`
//       document.querySelector('#account-balance-container').innerHTML =
//         parseFloat(account.balance).toFixed(2)
//       document.querySelector(
//         '#account-name-container'
//       ).innerHTML = `${account.firstName} ${account.lastName}`
//     }
//     transaction.oncomplete = () => db.close()
//   }
// }

const fetchAvatar = () => {
  let url = `https://avatars.dicebear.com/api/big-smile/admin.svg?`
  document.querySelector('#avatar').src = url
}

const displayTransactions = () => {
  const request = indexedDB.open('TransactionsDatabase', 1)
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('transactions', 'readwrite')
    const store = transaction.objectStore('transactions')

    const emailAddress = store.index('emailAddress')

    const emailQuery = emailAddress.getAll()

    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
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
        ).toFixed(2)}</td>`
      })
    }
    transaction.oncomplete = () => db.close()
  }
}

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
            depositorData.balance.toFixed(2)
        }
      }
    }
  }
}

const addTransferTransaction = () => {
  let recipientAddress = document.querySelector('#recipient').value
  let amount = parseFloat(
    document.querySelector('#transfer-amount').value
  ).toFixed(2)
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
            parseFloat(senderData.balance).toFixed(2)
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
  let amount = parseFloat(
    document.querySelector('#payment-amount').value
  ).toFixed(2)
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
            parseFloat(payorData.balance).toFixed(2)
        }
      }
    }
  }
}

const showTransactionContainer = () => {
  document.querySelector('#transaction-container').classList.remove('invisible')
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
const newTransactionBtn = document.querySelector('#add-transaction-btn')
const submitDepositBtn = document.querySelector('#submit-deposit-btn')
const submitTransferBtn = document.querySelector('#submit-transfer-btn')
const submitPaymentBtn = document.querySelector('#submit-payment-btn')

newTransactionBtn.addEventListener('click', showTransactionContainer)
submitDepositBtn.addEventListener('click', addDepositTransaction)
submitTransferBtn.addEventListener('click', addTransferTransaction)
submitPaymentBtn.addEventListener('click', addPaymentTransaction)

const ctx = document.getElementById('myChart').getContext('2d')
const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [
      {
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
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

// TODO: 1. Sort table
// 2. query TX for expense tracker
// 3. create bank employee page
// 4. add validation for all inputs
// 5.
