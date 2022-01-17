onload = () => {
  displayAccounts()
  fetchAvatar()
  displayTransactions()
}

const user = sessionStorage.getItem('user')
const indexedDB = window.indexedDB

const displayAccounts = () => {
  const request = indexedDB.open('AccountsDatabase', 1)
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('accounts', 'readwrite')
    const store = transaction.objectStore('accounts')
    const emailQuery = store.index('emailAddress').getAll()
    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
      const accounts = emailQuery.result
      document.querySelector('#account-summary').innerHTML =
        Object.keys(accounts).length
      document.querySelector('#account-balance-container').innerHTML = accounts
        .reduce((a, b) => parseFloat(a) + parseFloat(b.balance), 0)
        .toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })
      accounts.forEach((element, i) => {
        let key = store.index('emailAddress').getKey([element.emailAddress])
        key.onsuccess = () => {}
        // console.log(key)
        const accountsSummary = document.querySelector('#accounts-summary')
        let tr = document.createElement('tr')
        accountsSummary.appendChild(tr)
        tr.innerHTML = `<td>${i + 1}</td>
                        <td>${element.emailAddress}</td>
                        <td>${element.lastName}</td>
                        <td>${element.firstName}</td>
                        <td>${element.middleName}</td>
                        <td class="currency" id="amount-column">${parseFloat(
                          element.balance
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</td>`
        tr.addEventListener('click', (e) => {
          document
            .querySelector('#account-information')
            .classList.remove('invisible')

          const form = document.querySelector('#edit-account-form')
          form.addEventListener('submit', (e) => e.preventDefault())
          document.querySelector('#first-name-edit').value = element.firstName
          document.querySelector('#middle-name-edit').value = element.middleName
          document.querySelector('#last-name-edit').value = element.lastName
          document.querySelector('#email-edit').value = element.emailAddress
          document.querySelector('#password-edit').value = element.password

          const editExistingAccount = () => {
            const request = indexedDB.open('AccountsDatabase', 1)
            request.onsuccess = () => {
              const db = request.result
              const transaction = db.transaction('accounts', 'readwrite')
              const store = transaction.objectStore('accounts')
              store.put(
                {
                  firstName: document
                    .querySelector('#first-name-edit')
                    .value.toUpperCase(),
                  middleName: document
                    .querySelector('#middle-name-edit')
                    .value.toUpperCase(),
                  lastName: document
                    .querySelector('#last-name-edit')
                    .value.toUpperCase(),
                  emailAddress: document.querySelector('#email-edit').value,
                  password: document.querySelector('#password-edit').value,
                  balance: element.balance,
                },
                key.result
              )
            }
            alert('Updated Account Successfully')
            location.href = './admin.html'
          }
          document
            .querySelector('#submit-edit-account-button')
            .addEventListener('click', editExistingAccount)
        })
      })
      transaction.oncomplete = () => db.close()
    }
  }
}

const fetchAvatar = () => {
  // let url = `https://avatars.dicebear.com/api/big-smile/${user}.svg?`
  // document.querySelector('#avatar').src = url
}

const displayTransactions = () => {
  const request = indexedDB.open('TransactionsDatabase', 1)
  request.onupgradeneeded = () => {
    if (!db.objectStoreNames.contains('transactions')) {
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
  }

  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('transactions', 'readwrite')
    const store = transaction.objectStore('transactions')
    const emailQuery = store.index('amount').getAll()

    emailQuery.onerror = () => console.log('cannot fetch account data')
    emailQuery.onsuccess = () => {
      let monthlyBalance = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      const transactions = emailQuery.result
      document.querySelector('#transaction-summary').innerHTML =
        Object.keys(transactions).length

      transactions.reverse().forEach((element) => {
        const activities = document.querySelector('#activities')
        let tr = document.createElement('tr')
        activities.appendChild(tr)
        const newTimestamp = new Date(element.timestamp)
        tr.innerHTML = `<td>${newTimestamp
          .toUTCString()
          .substring(4)
          .replace('GMT', '')} </td>
                        <td>${element.emailAddress}</td>
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

        const date = element.timestamp.getMonth()
        if (element.type === 'deposit') {
          monthlyBalance[date] += parseFloat(element.amount)
        }
        if (element.type === ('withdraw' || 'payment')) {
          monthlyBalance[date] -= parseFloat(element.amount)
        }
      })
      console.log(monthlyBalance)
      const ctx = document.getElementById('myChart').getContext('2d')
      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
          datasets: [
            {
              label: ['Total Balance in PhP'],
              data: [
                monthlyBalance[7],
                monthlyBalance[8],
                monthlyBalance[9],
                monthlyBalance[10],
                monthlyBalance[11],
                monthlyBalance[0],
              ],
              fill: false,
              borderColor: ['rgba(129, 140, 248, 0.5)'],
              tension: 0.2,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              ticks: {
                // Include a dollar sign in the ticks
                callback: function (value, index, ticks) {
                  return '₱' + value
                },
              },
            },
          },
        },
      })
      transaction.oncomplete = () => db.close()
    }
  }
  request.onerror = () => console.log('error tx db')
}

const addNewAccount = () => {
  console.log('adding new account')
  const request = indexedDB.open('AccountsDatabase', 1)

  request.onerror = (event) => {
    console.error('An error occured with indexedDB')
    console.error(event)
  }

  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains('accounts')) {
      const store = db.createObjectStore('accounts', {
        keypath: 'id',
        autoIncrement: true,
      })
      store.createIndex('firstName', ['firstName'], { unique: false })
      store.createIndex('middleName', ['middleName'], { unique: false })
      store.createIndex('lastName', ['lastName'], { unique: false })
      store.createIndex('emailAddress', ['emailAddress'], { unique: true })
      store.createIndex('password', ['password'], { unique: false })
      store.createIndex('balance', ['balance'], { unique: false })
    }
  }

  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction('accounts', 'readwrite')
    const store = transaction.objectStore('accounts')

    const checkExistingUser = () => {
      document.querySelector('#email-error-text').classList.add('invisible')
      const db = request.result
      const transaction = db.transaction('accounts', 'readwrite')
      const store = transaction.objectStore('accounts')
      const emailQuery = store.index('emailAddress').getAll()
      emailQuery.onerror = () => console.log('cannot fetch account data')
      emailQuery.onsuccess = () => {
        const accounts = emailQuery.result
        accounts.forEach((element) => {
          if (emailAddressField.value === element.emailAddress) {
            document
              .querySelector('#email-error-text')
              .classList.remove('invisible')
          }
        })
      }
    }

    const emailAddressField = document.querySelector('#email')
    const form = document.querySelector('#signup')

    emailAddressField.addEventListener('change', checkExistingUser)
    form.addEventListener('submit', (e) => e.preventDefault())

    let fName = document.querySelector('#first-name').value
    let mName = document.querySelector('#middle-name').value
    let lName = document.querySelector('#last-name').value
    let emailAd = document.querySelector('#email').value
    let pword = document.querySelector('#password').value

    store.put({
      firstName: fName.toUpperCase(),
      middleName: mName.toUpperCase(),
      lastName: lName.toUpperCase(),
      emailAddress: emailAd,
      password: pword,
      balance: 0,
    })

    alert('Created Account Successfully')
    location.href = './admin.html'
  }
  transaction.oncomplete = () => db.close()
}

// CHOOSE TRANSACTION
const transactionTypeSelector = document.querySelector('#transaction-type')
const formTransfer = document.querySelector('#transfer-form')
const formDeposit = document.querySelector('#deposit-form')

const selectTransactionType = (event) => {
  document.querySelector('#transaction-type').classList.remove('invisible')
  let value = event.target.value
  if (value === 'transfer') {
    formDeposit.classList.add('invisible')
    formTransfer.classList.remove('invisible')
  }
  if (value === 'deposit') {
    formDeposit.classList.remove('invisible')
    formTransfer.classList.add('invisible')
  }
}

transactionTypeSelector.addEventListener('change', selectTransactionType)

const addDepositTransaction = () => {
  let depositDate = document.querySelector('#deposit-date').value
  let amount = parseFloat(document.querySelector('#deposit-amount').value)
  let depositee = document.querySelector('#depositee').value

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
      timestamp: new Date(depositDate),
      emailAddress: depositee,
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

    const depositorKey = emailAddress.getKey([depositee])
    depositorKey.onsuccess = () => {
      const depositorQuery = store.get(depositorKey.result)
      depositorQuery.onsuccess = () => {
        const depositorData = depositorQuery.result
        depositorData.balance += amount
        const requestUpdate = store.put(depositorData, depositorKey.result)
        requestUpdate.onsuccess = () => console.log('updated account balance')
      }
    }
  }
  transactionModal.classList.add('invisible')
  alert('transaction successful')
}

const addTransferTransaction = () => {
  let transferDate = document.querySelector('#transfer-date').value
  let sender = document.querySelector('#sender').value
  let recipient = document.querySelector('#recipient').value
  let amount = parseFloat(document.querySelector('#transfer-amount').value)
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
      timestamp: new Date(transferDate),
      emailAddress: sender,
      amount: amount,
      type: 'transfer',
      recipientAddress: recipient,
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

    const senderKey = emailAddress.getKey([sender])
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

    const recipientKey = emailAddress.getKey([recipient])
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
  transactionModal.classList.add('invisible')
  alert('transaction successful')
}

const showAddTransactionContainer = () => {
  document.querySelector('#transaction-modal').classList.remove('invisible')
}

const showAddAccountContainer = () => {
  document.querySelector('#account-modal').classList.remove('invisible')
}

formDeposit.addEventListener('submit', (e) => {
  e.preventDefault()
})
formTransfer.addEventListener('submit', (e) => {
  e.preventDefault()
})

const addTransactionBtn = document.querySelector('#add-transaction-btn')
const addAccountBtn = document.querySelector('#add-account-btn')
const submitDepositBtn = document.querySelector('#submit-deposit-btn')
const submitTransferBtn = document.querySelector('#submit-transfer-btn')
const submitCreateAcctBtn = document.querySelector('#submit-signup-button')

addTransactionBtn.addEventListener('click', showAddTransactionContainer)
addAccountBtn.addEventListener('click', showAddAccountContainer)
submitDepositBtn.addEventListener('click', addDepositTransaction)
submitTransferBtn.addEventListener('click', addTransferTransaction)
submitCreateAcctBtn.addEventListener('click', addNewAccount)

const logoutBtn = document.querySelector('#logout')
const handleLogout = () => {
  sessionStorage.clear()
  document.location = '../index.html'
}
logoutBtn.addEventListener('click', handleLogout)

const transactionModal = document.querySelector('#transaction-modal')
const accountModal = document.querySelector('#account-modal')
const accountInfoModal = document.querySelector('#account-information')
window.onclick = (event) => {
  if (
    event.target == accountModal ||
    event.target == transactionModal ||
    event.target == accountInfoModal
  ) {
    accountModal.classList.add('invisible')
    transactionModal.classList.add('invisible')
    document.location = './admin.html'
  }
}
