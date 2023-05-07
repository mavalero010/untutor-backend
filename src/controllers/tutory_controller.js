const User = require("../models/user_model");
const Tutory = require("../models/tutory_model");
const Admin = require("../models/admin_model");
const Subject = require("../models/subject_model");
const firebase = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const dotenv = require("dotenv");
const admin = require('firebase-admin');
const serviceAccount = require('../../untutor-notifications-firebase-adminsdk-xmbpo-01e725a99a.json');
    
dotenv.config();
const cron = require('node-cron');
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

const sendNotificationsAboutTutory=async(req,res)=>{
  try {

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    
    // Construir el mensaje a enviar
    const message = {
      data:{ruta:"tutory",id:"d"},
      notification: {
        title: 'Mi título de prueba 3',
        body: 'Este es el cuerpo de mi mensaje de prueba.'
      },
      token: 'cz7icM5DRaKU1eYnxJFWwT:APA91bG4TTS3nZiWtSBBhhWRUF1GbUFceKerT7rEWViuGLybpCZqIbO_hllBDdj32FAvckKMUeVu8GGHe5b4Z8Q2gjd7dsUPzbM79R3o7-Pi-Rp_V9mbTFyTQV4kXPqXME_SZqf8tZKl'
    };
    
    // Enviar el mensaje a través de FCM
    admin.messaging().send(message)
      .then((response) => {
        return res.json({msg:'Mensaje enviado:', response})
      })
      .catch((error) => {
       return  res.json({msg:'Error enviando el mensaje:', error})
      });

    
  } catch (error) {
    res.status(500).json({ success: false, msg:"Error en el servidor" });
  }
}

const addStudentAtListTutory=async(req,res)=>{
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

    const {idtutory}=req.query
    const {device_token}=req.body
    const tutory = await Tutory.findById(idtutory);
    if (!tutory) {
      return res.status(404).json({msg:"No se encontró tutoría"});
    }
    const updatedTutory = await Tutory.findOneAndUpdate(
      { _id: idtutory },
      { $addToSet: { idstudent_list: user._id } }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );

    const date_start=updatedTutory.date_start.split(" ")[0]
    const hour_start=updatedTutory.date_start.split(" ")[1]
    const year=parseInt(date_start.split("-")[0])
    const month=parseInt(date_start.split("-")[1])
    const day=parseInt(date_start.split("-")[2])
    const hour=parseInt(hour_start.split(":")[0])
    const minute=parseInt(hour_start.split(":")[1])
    const days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const d = new Date(date_start);
    const dayNumber = d.getDay();
    const message = {
      data:{ruta:"tutory",id:idtutory},
      notification: {
        title: `¡Recordatorio de tutoría de ${updatedTutory.name}!`,
        body: `Tutoría de ${updatedTutory.name} empieza en 1 hora`
      },
      token:device_token
    };
    //recordar cada semana
    cron.schedule(`0 ${minute} ${hour-1} ${day},${day+7} ${month},${month+1} *`, () => { 
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          // Enviar el mensaje a través de FCM
      admin.messaging().send(message)
    .then((response) => {
      console.log("Enviado") 
    })
    .catch((error) => {
      console.log("No enviado: ",error)
    });
      
    }, {
      scheduled: true,
      timezone: "America/Bogota"
    });
    res.json(updatedTutory)


    

} catch (err) {
  res.status(500).json({ success: false, msg:"Error en el servidor" });
}
}

const removeStudentAtListTutory=async(req,res)=>{
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
    
    const {idtutory}=req.query
   const tutory = await Tutory.findOneAndUpdate(
      { _id: idtutory },
      { $pull: { idstudent_list: user._id } },
      { new: true }
    ).catch(err=>{return res.status(500).json({msg:""})});

      res.status(200).json(tutory)

  } catch (error) {
    res.status(500).json({ success: false, msg:"Error en el servidor" })
  }
}
module.exports = {
  createTutory,
  getWeeklySchedule,
  sendNotificationsAboutTutory,
  addStudentAtListTutory,
  removeStudentAtListTutory
};
