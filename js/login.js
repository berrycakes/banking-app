const userName = 'berrycake'

export const loadAvatar = () => {
  console.log('Hello')
  const avatarHolder = document.querySelector('#avatar')
  avatarHolder.src = 'https://avatars.dicebear.com/api/bottts/hello.svg'
}

loadAvatar()
export const submitBtn = document.querySelector('#submitBtn')
export const submitForm = () => {
  console.log('ok')
  Email.send({
    Host: 'smtp.elasticemail.com',
    Username: 'jellybellycake@gmail.com',
    Password: '6E2DD4EBDC7CA706514B9CB6A5F47019E19B',
    To: 'nebab.johncarl@gmail.com',
    From: 'jellybellycake@gmail.com',
    Subject: 'This is the subject',
    Body: 'And this is the body',
  }).then((message) => alert(message))
}

submitBtn.addEventListener('click', submitForm)
