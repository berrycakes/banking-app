const indexedDB = window.indexedDB
const request = indexedDB.open('AccountsDatabase', 1)

const form = document.querySelector('.form')
const submitBtn = document.querySelector('#submit-login-button')

const handleLogin = (e) => {
  let emailAd = document.querySelector('#email').value
  let pword = document.querySelector('#password').value

  const db = request.result
  const transaction = db.transaction('accounts', 'readwrite')
  const store = transaction.objectStore('accounts')

  const emailAddress = store.index('emailAddress')
  const password = store.index('password')

  const emailQuery = emailAddress.get([emailAd])

  emailQuery.onerror = () => console.log('account does not exist')
  emailQuery.onsuccess = () => {
    if (emailQuery.result.password === pword) {
      sessionStorage.setItem('user', emailAd)

      location.href = '/html/dashboard.html'
    } else {
      alert('wrong password')
    }
  }

  transaction.oncomplete = () => db.close()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
})

submitBtn.addEventListener('click', handleLogin)

const showPassBtn = document.querySelector('#show-password')
const hidePassBtn = document.querySelector('#hide-password')

const showPassword = (e) => {
  e.preventDefault()
  let password = document.querySelector('#password')
  if (password.type === 'password') {
    hidePassBtn.classList.remove('invisible')
    showPassBtn.classList.add('invisible')
    password.type = 'text'
  } else {
    password.type === 'password'
  }
}

const hidePassword = (e) => {
  e.preventDefault()
  let password = document.querySelector('#password')
  hidePassBtn.classList.add('invisible')
  showPassBtn.classList.remove('invisible')
  password.type = 'password'
}

showPassBtn.addEventListener('click', showPassword)
hidePassBtn.addEventListener('click', hidePassword)
