const User = require("../models/user_model");
const Tutory = require("../models/tutory_model");
const Admin = require("../models/admin_model");
const Subject = require("../models/subject_model");
const firebase = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const dotenv = require("dotenv");
dotenv.config();
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
      end,
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
      end,
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

const getWeeklySchedule = async (req, res) => {
  try {
    //TODO: DEFINIR QUIEN PUEDE INGRESAR A VER ESTO

    const { dates } = req.body;
    const { idsubject } = req.query;
    const tutories = await Tutory.find({ idsubject });
    let t = [];
    dates.forEach((d) => {
      let tu = tutories
        .filter((t) => t.date_start.split(" ")[0] === d)
        .map((e) => {
          return {
            start: e.date_start.split(" ")[1],
            end: e.end.split(" ")[1],
            available:e.available
          };
        });
      t.push({date: d,tutories:tu});
    });
    res.json(t);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en servidor" });
  }
};
module.exports = {
  createTutory,
  getWeeklySchedule,
};
