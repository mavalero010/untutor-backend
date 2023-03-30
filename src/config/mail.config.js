const nodemailer = require('nodemailer');
const dotenv = require("dotenv")
dotenv.config() 

const mail = {
    user: process.env.EMAIL_APPLICATION_GMAIL,
    pass: process.env.PASSWORD_APPLICATION_GMAIL
}

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port:587,
  secure: false, // true for 465, false for other ports
    auth: {
      user: mail.user, 
      pass: mail.pass 
    },
  });

  const sendEmail = async (email, subject, html) => {
    try {
        
        await transporter.sendMail({
            from: `<${mail.user}>`, // sender address
            to: email, // list of receivers
            subject, // Subject line
            text: "Confirma tu cuenta de UNTutor:", // plain text body
            html, // html body
        });

    } catch (error) {
        console.log('Algo no va bien con el email', error);
    }
  }

  const getTemplate = (name, token) => {
    //TODO: Eliminar archivo style.styl una vez se obtenga el diseño final del correo de verificación
      return `
      <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mail</title>
      <style>
      body {
        padding: 0px;
        margin: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        justify-items: center;
        }
      body header {
        width: 70%;
        text-align: center;
        margin: 0px;
        font-size: 40px;
        background-color: #1e3050;
        padding: 40px 0px 40px 0px;
        }
      body header i {
        color: #fff;
        }
    body header .title {
      color: #fff;
      }
    body section {
      width: 70%;
      height: 50%;
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      margin-top: 100px;
    }
    body section p {
      width: 100%;
    }
    body section .account-confirmation {
      background-color: #f0f1f3;
      color:black;
      border-radius: 7px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      padding: 10px 20px 10px 20px;
      font-size: 15px;
      border: none;
      border: solid 1px #000;
      border-bottom: solid 4px #000;
      font-weight: bold;
      margin-top: 15px;
      text-decoration: none
      }
    body section .account-confirmation:hover {
      text-decoration: none;
      background-color: #9d9dff;
      color: #fff;
      border: none;
      border: solid 1px #000;
      border-bottom: solid 4px #000;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      padding: 10px 20px 10px 20px;
      border-radius: 7px;
      font-size: 15px;
      font-weight: bold;
      margin-top: 15px;
      }
    body section .border {
      display: flex;
      justify-content: center;
      width: 100%;
      margin-top: 20px;
      }
    body section .border p {
      border-bottom: 1px solid rgba(0,0,0,0.5);
      width: 100%;
      color: #fff;
      flex-grow: 3;
      }
    body section .border .uninorte {
      display: flex;
      flex-grow: 1;
      margin-left: 40px;
      margin-right: 40px;
      width: 35%;
      justify-content: center;
      align-items: center;
      }
    body section .border .uninorte .title-uninorte {
      border: none;
      color: #000;
      text-align: right;
      }
    body section .border .uninorte .uninortelogo {
      width: 30px;
      height: 30px;
      }
    body footer {
      width: 70%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      }
    body footer .info {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 25%;
      }
    body footer .info .whatsapp {
      display: flex;
      width: 60%;
      justify-content: space-between;
      align-items: center;
      }
    body footer .info .correo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 90%;
      }

  </style>
  </head>
  <body>
      <header>
          <i class="fa-sharp fa-solid fa-book"></i>
          <span class="title">UNTutor</span>
          <script src="https://kit.fontawesome.com/5a1b58b9ee.js" crossorigin="anonymous"></script>
      </header>
      <section>
          <p>Estimado usuario <span>UNTutor</span></p>
          <p>Para mejorar la calidad de nuestro servicio, queremos asegurarnos que la dirección de correo electrónico es correcto</p>
          
          <p>Estás invitado a ser parte de la mejor comunidad académica y de estudios, porfavor
               da clic en el botón de abajo para confirmar tu cuenta y acceder a toda nuestra gama de recursos:</p>
          
          
           <a class="account-confirmation" href='${process.env.HOST}${process.env.PORT}/api/user/confirm/${token}'>Confirmar Cuenta de Email</a>
          <div class="border">
          <p>.</p>
              <div class="uninorte">
                  <img class="uninortelogo" src="data:image/png;base64,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" alt="Logo Uninorte">
                  <p class="title-uninorte">Uninorte 2023</p>
                  
              </div>
          <p>.</p>
  
         </div>          
      </div>
      </section>
  
      <footer>
          <div class="copyrights">Todos los derechos reservados</div>
          <div class="info">
              Contactos
              <div class="whatsapp">
                  <i class="fa-brands fa-whatsapp"></i>
                  <p>+57 11111111</p>
              </div>
              <div class="correo">
                  <i class="fa-regular fa-envelope"></i>
                  <p>asdaa@gmail.com</p>
              </div>
          </div>
      </footer>
  `;
  }

  module.exports = {
    sendEmail,
    getTemplate
  }