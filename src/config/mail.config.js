const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const mail = {
  user: process.env.EMAIL_APPLICATION_GMAIL,
  pass: process.env.PASSWORD_APPLICATION_GMAIL,
};

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: mail.user,
    pass: mail.pass,
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
    res.status(500).json({
      msg:"Error en el servidor"
    })
  }
};

const getTemplate = (name, token) => {
  //TODO: Eliminar archivo style.styl una vez se obtenga el diseño final del correo de verificación
  return `<!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
      <table width="100%">
          <tbody>
              <tr>
                  <td>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="left">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <img style="width: 100px;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005137/logo-header.png" alt="Imagen header">
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table align="right">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <h1 style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333;"><strong>UNTutor</strong></h1>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table>
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 20px;">Hola, <strong>${name}</strong><br>Estás recibiendo este correo porque te has registrado recientemente en una cuenta de <strong>UNTutor</strong>.<br>Confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.</br>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="center">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <a href="${process.env.HOST}/api/${process.env.VERSION_API}/user/confirm/${token}" target="_blank" style="padding: 10px 40px; background: #7896ff; border-radius: 25px; font-family: 'lucida sans unicode', 'lucida grande', sans-serif; font-size: 20px; color: #333333; text-decoration: none;">Confirma tu cuenta</a>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="left">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <img style="height: 64px; padding: 10px 10px 10px 10px;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005513/logo-caducar.png" alt="Imagen caducar">
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table align="right">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 16px;">Este enlace caduca en <strong>1 hora</strong>.<br>Si no has solicitado este correo, puedes ignorarlo.</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table>
                                          <tbody>
                                              <tr>
                                                  <td align="center">
                                                      <img style="width: 90px; padding: 10px 10px 5px 10px; text-align: center;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005513/logo-app.png" alt="Imagen logo">
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 16px; text-align: center;">UNTutor<br>Copyright © 2023</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
  </html>`;
};

const getAdminTemplate = (name, token) => {
  //TODO: Eliminar archivo style.styl una vez se obtenga el diseño final del correo de verificación
  return `<!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
      <table width="100%">
          <tbody>
              <tr>
                  <td>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="left">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <img style="width: 100px;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005137/logo-header.png" alt="Imagen header">
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table align="right">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <h1 style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333;"><strong>UNTutor</strong></h1>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table>
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 20px;">Hola, <strong>${name}</strong><br>Estás recibiendo este correo porque te has registrado recientemente como <strong>administrador</strong> en una cuenta de <strong>UNTutor</strong>.<br>Confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.</br>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="center">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <a href="${process.env.HOST}/api/${process.env.VERSION_API}/admin/confirm/${token}" target="_blank" style="padding: 10px 40px; background: #7896ff; border-radius: 25px; font-family: 'lucida sans unicode', 'lucida grande', sans-serif; font-size: 20px; color: #333333; text-decoration: none;">Confirma tu cuenta</a>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table align="left">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <img style="height: 64px; padding: 10px 10px 10px 10px;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005513/logo-caducar.png" alt="Imagen caducar">
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table align="right">
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 16px;">Este enlace caduca en <strong>1 hora</strong>.<br>Si no has solicitado este correo, puedes ignorarlo.</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                      <table align="center">
                          <tbody>
                              <tr>
                                  <tr>
                                      <table>
                                          <tbody>
                                              <tr>
                                                  <td align="center">
                                                      <img style="width: 90px; padding: 10px 10px 5px 10px; text-align: center;" src="https://res.cloudinary.com/dmkuekdlc/image/upload/v1681005513/logo-app.png" alt="Imagen logo">
                                                      <p style="font-family: 'lucida sans unicode', 'lucida grande', sans-serif; color: #333333; font-size: 16px; text-align: center;">UNTutor<br>Copyright © 2023</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </tr>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
  </html>`;
};
module.exports = {
  sendEmail,
  getAdminTemplate,
  getTemplate
};
