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
    emailQuery.result.password === pword
      ? window.alert('logged in')
      : window.alert('wrong password')
  }
  console.log(emailQuery.result.password)

  transaction.oncomplete = () => db.close()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
})

submitBtn.addEventListener('click', handleLogin)

// const userName = 'berrycake'

// export const loadAvatar = () => {
//   console.log('Hello')
//   const avatarHolder = document.querySelector('#avatar')
//   avatarHolder.src = 'https://avatars.dicebear.com/api/bottts/hello.svg'
// }

// loadAvatar()
// export const submitBtn = document.querySelector('#submitBtn')
// export const submitForm = () => {
//   console.log('ok')
//   Email.send({
//     Host: 'smtp.elasticemail.com',
//     Username: 'jellybellycake@gmail.com',
//     Password: '6E2DD4EBDC7CA706514B9CB6A5F47019E19B',
//     To: 'nebab.johncarl@gmail.com',
//     From: 'jellybellycake@gmail.com',
//     Subject: 'This is the subject',
//     Body: 'And this is the body',
//   }).then((message) => alert(message))
// }

// submitBtn.addEventListener('click', submitForm)
