const indexedDB = window.indexedDB
const request = indexedDB.open('AccountsDatabase', 1)

const userForm = document.querySelector('#user-login-form')
const submitBtn = document.querySelector('#submit-login-button')
const showPassBtn = document.querySelector('#show-password')
const hidePassBtn = document.querySelector('#hide-password')
const showAdminPassBtn = document.querySelector('#show-admin-password')
const hideAdminPassBtn = document.querySelector('#hide-admin-password')
const emailAddressField = document.querySelector('#email')
const adminLoginBtn = document.querySelector('#admin-login')
const adminLoginForm = document.querySelector('#admin-login-form-container')
const loginContainer = document.querySelector('#login-form-container')
const userLoginBtn = document.querySelector('#user-login')
const submitAdminLoginBtn = document.querySelector('#submit-login-admin-button')
const adminForm = document.querySelector('#admin-form')

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

      location.href = './dashboard.html'
    } else {
      alert('wrong password!')
    }
  }

  transaction.oncomplete = () => db.close()
}

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

const checkExistingUser = () => {
  document.querySelector('#email-error-text').classList.remove('invisible')
  const db = request.result
  const transaction = db.transaction('accounts', 'readwrite')
  const store = transaction.objectStore('accounts')
  const emailQuery = store.index('emailAddress').getAll()
  emailQuery.onerror = () => console.log('cannot fetch account data')
  emailQuery.onsuccess = () => {
    const accounts = emailQuery.result
    accounts.forEach((element) => {
      if (emailAddressField.value === element.emailAddress) {
        document.querySelector('#email-error-text').classList.add('invisible')
      }
    })
  }
}

const handleAdminLogin = (e) => {
  let emailAd = document.querySelector('#email-admin').value
  let pword = document.querySelector('#password-admin').value
  if (emailAd === 'admin' && pword === 'admin123') {
    location.href = './admin.html'
  } else {
    alert('wrong login credentials!')
  }
}

const showAdminLogin = () => {
  adminLoginForm.classList.remove('invisible')
  loginContainer.classList.add('invisible')
}

const showUserLogin = () => {
  adminLoginForm.classList.add('invisible')
  loginContainer.classList.remove('invisible')
}

userForm.addEventListener('submit', (e) => e.preventDefault())
adminForm.addEventListener('submit', (e) => e.preventDefault())
submitBtn.addEventListener('click', handleLogin)
emailAddressField.addEventListener('change', checkExistingUser)
showPassBtn.addEventListener('click', showPassword)
hidePassBtn.addEventListener('click', hidePassword)
adminLoginBtn.addEventListener('click', showAdminLogin)
userLoginBtn.addEventListener('click', showUserLogin)
submitAdminLoginBtn.addEventListener('click', handleAdminLogin)
