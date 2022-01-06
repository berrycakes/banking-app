const indexedDB = window.indexedDB
const request = indexedDB.open('AccountsDatabase', 1)

request.onerror = (event) => {
  console.error('An error occured with indexedDB')
  console.error(event)
}

request.onupgradeneeded = () => {
  const db = request.result
  const store = db.createObjectStore('accounts', {
    keypath: 'id',
    autoIncrement: true,
  })
  store.createIndex('firstName', ['firstName'], { unique: false })
  store.createIndex('middleName', ['middleName'], { unique: false })
  store.createIndex('lastName', ['lastName'], { unique: false })
  store.createIndex('emailAddress', ['emailAddress'], { unique: true })
  store.createIndex('password', ['password'], { unique: false })
}

request.onsuccess = () => {
  console.log('successfully loaded indexedDB')
}

const form = document.querySelector('.form')
const submitBtn = document.querySelector('#submit-signup-button')

form.addEventListener('submit', (e) => {
  e.preventDefault()
})

submitBtn.addEventListener('click', (e) => {
  const db = request.result
  const transaction = db.transaction('accounts', 'readwrite')
  const store = transaction.objectStore('accounts')
  const firstNameIndex = store.index('firstName')
  const middleNameIndex = store.index('middleName')
  const lastNameIndex = store.index('lastName')
  const emailAddress = store.index('emailAddress')
  const password = store.index('password')

  let fName = document.querySelector('#first-name').value
  let mName = document.querySelector('#middle-name').value
  let lName = document.querySelector('#last-name').value
  let emailAd = document.querySelector('#email').value
  let pword = document.querySelector('#password').value

  store.put({
    firstName: fName,
    middleName: mName,
    lastName: lName,
    emailAddress: emailAd,
    password: pword,
  })
})
