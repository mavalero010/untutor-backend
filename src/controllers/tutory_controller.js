const User = require("../models/user_model");
const Tutory = require("../models/tutory_model");
const Admin = require("../models/admin_model");
const Subject = require("../models/subject_model");
const firebase = require("firebase/app");
const moment = require("moment");
const { getAnalytics } = require("firebase/analytics");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const serviceAccount = require("../../untutor-notifications-firebase-adminsdk-xmbpo-01e725a99a.json");
const crons = [];
dotenv.config();
const cron = require("node-cron");
const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID,
  measurementId: process.env.MEASUREMENTID,
};
const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");

function getNumberDayWeek(date) {
  const day = new Date(date).getDay();
  return day === 0 ? 7 : day; // para ajustar la numeración del domingo de 0 a 7
}
const createTutory = async (req, res) => {
  try {
    /* // Inicializando Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging(app)
    console.log("messaging")
    messaging.requestPermission().then(() => {
      console.log("Permiso de notificación concedido");
      return messaging.getToken();
    }).then((token) => {
      return res.status(200).json({token})
    }).catch((error) => {
      return res.status(404).json({error})
    });
    res.status(200).json(user)
    */

    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }
    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida

    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    const {
      name,
      description,
      idtutor,
      idstudent_list,
      idsubject,
      date_start,
      date_end,
      duration,
      location,
      isVirtual,
      available,
    } = req.body;
    const tutory = new Tutory({
      name,
      description,
      idtutor,
      idstudent_list,
      idsubject,
      date_start,
      date_end,
      duration,
      location,
      isVirtual,
      available,
    });

    await tutory.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Tutoría creada",
      })
    );
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
};
function generateDatesBetween(initDate, finalDate) {
  const dates = [];

  let dateNow = moment(initDate);
  while (dateNow <= moment(finalDate)) {
    dates.push(dateNow.format("YYYY-MM-DD"));
    dateNow.add(1, "days");
  }

  return dates;
}
const getWeeklySchedule = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataUserDecoded = getTokenData(token);
    const mail = dataUserDecoded.data.email;
    //Lo busco en BD
    let user = (await User.findOne({ email: mail })) || null;

    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataUserDecoded, user);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }
    const { idsubject, date_start, date_end } = req.query;
    const tutories = await Tutory.find({ idsubject });
    let t = [];
    /*const diffTime = Math.abs(dateStartDate - todayDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
*/
    const days = generateDatesBetween(date_start, date_end);
    days.forEach((d) => {
      
      let tu = tutories
        .filter(
          (t) =>

            new Date(t.date_start.split(" ")[0]) <= new Date(d) &&
            new Date(t.date_end.split(" ")[0]) >= new Date(d) &&
            Math.abs(new Date(d).getTime() - new Date(t.date_start.split(" ")[0]).getTime()) %
              7 === 0
        )
        .map((e) => {
          return {
            start: e.date_start.split(" ")[1],
            end: e.date_end.split(" ")[1],
            available: e.available,
            _id:e._id
          };
        });
      t.push({ date: d, tutories: tu });
    });
    res.json(t);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en servidor" });
  }
};

const sendNotificationsAboutTutory = async (req, res) => {
  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    // Construir el mensaje a enviar
    const message = {
      data: { ruta: "tutory", id: "d" },
      notification: {
        title: "Mi título de prueba 3",
        body: "Este es el cuerpo de mi mensaje de prueba.",
      },
      token:
        "cz7icM5DRaKU1eYnxJFWwT:APA91bG4TTS3nZiWtSBBhhWRUF1GbUFceKerT7rEWViuGLybpCZqIbO_hllBDdj32FAvckKMUeVu8GGHe5b4Z8Q2gjd7dsUPzbM79R3o7-Pi-Rp_V9mbTFyTQV4kXPqXME_SZqf8tZKl",
    };

    // Enviar el mensaje a través de FCM
    admin
      .messaging()
      .send(message)
      .then((response) => {
        return res.json({ msg: "Mensaje enviado:", response });
      })
      .catch((error) => {
        return res.json({ msg: "Error enviando el mensaje:", error });
      });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};

const addStudentAtListTutory = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataUserDecoded = getTokenData(token);
    const mail = dataUserDecoded.data.email;
    //Lo busco en BD
    let user = (await User.findOne({ email: mail })) || null;

    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataUserDecoded, user);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }

    const { idtutory } = req.query;
    const { device_token } = req.body;
    const tutory = await Tutory.findById(idtutory);
    if (!tutory) {
      return res.status(404).json({ msg: "No se encontró tutoría" });
    }
    const updatedTutory = await Tutory.findOneAndUpdate(
      { _id: idtutory },
      { $addToSet: { idstudent_list: user._id } }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );

    await User.findOneAndUpdate(
      { _id: user._id },
      { device_token }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );
    if (updatedTutory.idstudent_list.length === 1) {
      createProcess(updatedTutory);
    }
    res.json(updatedTutory);
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};

const removeStudentAtListTutory = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataUserDecoded = getTokenData(token);
    const mail = dataUserDecoded.data.email;
    //Lo busco en BD
    let user = (await User.findOne({ email: mail })) || null;

    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataUserDecoded, user);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }

    const { idtutory } = req.query;
    const tutory = await Tutory.findOneAndUpdate(
      { _id: idtutory },
      { $pull: { idstudent_list: user._id } },
      { new: true }
    ).catch((err) => {
      return res.status(500).json({ msg: "" });
    });
    console.log(tutory.idstudent_list.length);
    if (tutory.idstudent_list.length == 0) {
      const t = crons.find((c) => c.id === tutory._id);
      t.stop();
    }
    res.status(200).json(tutory);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};

const createProcess = async (tutory) => {
  const date_start = tutory.date_start.split(" ")[0];
  const date_end = tutory.date_end.split(" ")[0];
  const hour_start = tutory.date_start.split(" ")[1];
  const month = parseInt(date_start.split("-")[1]);
  const month_end = parseInt(date_end.split("-")[1]);
  //const day=parseInt(date_start.split("-")[2])
  const hour = parseInt(hour_start.split(":")[0]);
  const minute = parseInt(hour_start.split(":")[1]);
  const d = getNumberDayWeek(date_start);
  const device_tokens = [];
  const idstudent_list = tutory.idstudent_list;
  for (let i = 0; i < idstudent_list.length; i++) {
    const t = (await User.findOne({ _id: idstudent_list[i] })).device_token;
    device_tokens.push(t);
  }

  //recordar cada semana
  const task = cron.schedule(
    `0 ${minute} ${hour - 1} * ${month}-${month_end} ${d + 1}`,
    () => {
      for (let i = 0; i < device_tokens.length; i++) {
        const message = {
          data: { ruta: "tutory", id: tutory._id.toString() },
          notification: {
            title: `¡Recordatorio de tutoría de ${tutory.name}!`,
            body: `Tutoría de ${tutory.name} empieza en 1 hora`,
          },
          token: device_tokens[i].toString(),
        };
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        // Enviar el mensaje a través de FCM
        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log("Enviado");
          })
          .catch((error) => {
            console.log("No enviado: ", error);
          });
      }
    },
    {
      scheduled: true,
      timezone: "America/Bogota",
    }
  );

  crons.push({ id: tutory._id.toString(), task });
};
module.exports = {
  createTutory,
  getWeeklySchedule,
  sendNotificationsAboutTutory,
  addStudentAtListTutory,
  removeStudentAtListTutory,
};
