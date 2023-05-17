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
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});
const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  headObject,
} = require("@aws-sdk/client-s3");
const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);
const bucketProfilePhoto = process.env.BUCKET_PROFILE_PHOTO;
const bucketSource = process.env.BUCKET_SOURCE_UNTUTOR;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
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
      is_virtual,
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
      is_virtual,
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
    const { idsubject, date_start, date_end, show_only_user } = req.query;
    let tutories = await Tutory.find({ idstudent_list: { $in: user._id } });

    if ((idsubject != undefined) && (show_only_user===true)) {
      tutories = tutories.filter((t) =>
        t.idstudent_list.some((objectId) => objectId.equals(user._id))
      );
    }else if(show_only_user===false){
      tutories = await Tutory.find({idsubject})
    }
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
            Math.abs(
              new Date(d).getTime() -
                new Date(t.date_start.split(" ")[0]).getTime()
            ) %
              7 ===
              0
        )
        .map((e) => {
          return {
            start: e.date_start.split(" ")[1],
            end: e.date_end.split(" ")[1],
            available: e.available,
            _id: e._id,
            duration: parseInt(e.duration),
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
    const tutory = await Tutory.findById(idtutory);
    if (!tutory) {
      return res.status(404).json({ msg: "No se encontró tutoría" });
    }
    const updatedTutory = await Tutory.findOneAndUpdate(
      { _id: idtutory },
      { $addToSet: { idstudent_list: user._id } }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );

    /*await User.findOneAndUpdate(
      { _id: user._id },
      { device_token:user.device_token }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );*/
    if (updatedTutory.idstudent_list.length === 1) {
      createProcess(req, res, updatedTutory);
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
    
    const t = crons.find((c) => (c.id === tutory._id.toString())&& (c.idstudent === user._id.toString()));
    if(t!=undefined){
      t.task.stop();
      
    }
    //console.log("CRONS NUEVO: ",crons.length)
      
    
    res.status(200).json(tutory);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};

const getTutoryById = async (req, res) => {
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

    const tutory = (await Tutory.findOne({ _id: idtutory })) || null;

    if (tutory === null) {
      return res.status(404).json({ msg: "Tutoría no existe" });
    }

    const tutor = await User.findOne({ _id: tutory.idtutor });
    let urlProfilePhotoUser = null;
    if (tutor.perfil_photo !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: tutor.perfil_photo,
      };

      const command = new GetObjectCommand(getObjectParams);
      urlProfilePhotoUser = (await getSignedUrl(s3, command)).split("?")[0];
    }
    res.status(200).json({
      _id: tutory._id,
      name: tutory.name,
      description: tutory.description,
      tutor: {
        _id: tutor._id,
        name: tutor.name,
        profile_photo: urlProfilePhotoUser,
      },
      idstudent_list: tutory.idstudent_list,
      idsubject: tutory.idsubject,
      date_start: tutory.date_start,
      date_end: tutory.date_end,
      duration: parseInt(tutory.duration),
      location: tutory.location,
      is_virtual: tutory.is_virtual,
      available: tutory.available,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};

const createProcess = async (req, res, tutory) => {
  try {
    
  const date_start = tutory.date_start.split(" ")[0];
  const date_end = tutory.date_end.split(" ")[0];
  const hour_start = tutory.date_start.split(" ")[1]; 
  const month = parseInt(date_start.split("-")[1]);
  const month_end = parseInt(date_end.split("-")[1]);
  const hour = parseInt(hour_start.split(":")[0]);
  const minute = parseInt(hour_start.split(":")[1]);
  const d = getNumberDayWeek(date_start);
  const device_tokens = [];
  const idstudent_list = tutory.idstudent_list;
  

  //recordar cada semana
  for (let i = 0; i < idstudent_list.length; i++) {
    const t = ((await User.findOne({ _id: idstudent_list[i] })))

    const task =  cron.schedule(`0 ${minute} ${hour - 1} * ${month}-${month_end} ${(d + 1) % 7}`,
     async () => {
      
        const t = ((await User.findOne({ _id: idstudent_list[i] })))
        
        let device_token=null
        if(t!= null){ 
          device_token= t.device_token
       
        }
     
        const message = {
          data: { ruta: "tutory", id: tutory._id.toString() },
          notification: { 
            title: `¡Recordatorio de tutoría de ${tutory.name}!`,
            body: `Tutoría de ${tutory.name} empieza en 1 hora`,
          },
          token: device_token.toString(),
        };
        // Enviar el mensaje a través de FCM   
        admin
          .messaging()
          .send(message)  
          .then((response) => { 
            console.log("Enviado");
          })
          .catch((error) => { 
            console.log("No enviado");
          });
      }, 
      { 
        scheduled: true,
        timezone: "America/Bogota",
      }
    );
    crons.push({ id: tutory._id.toString(),idstudent:t._id.toString(), task });
    
  }
  

  

  } catch (error) {
    console.log("error: ", error) 
  }
};
const getTutoriesByIdStudent = async (req, res) => {
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

    const tutories = await Tutory.find({
      idstudent_list: {
        $elemMatch: { $eq: user._id },
      },
    });
    //{idfavorite_subjects: { $elemMatch: { $eq: idsubject } }
    res.status(200).json(tutories);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en el servidor" });
  }
};
module.exports = {
  createTutory,
  getWeeklySchedule,
  sendNotificationsAboutTutory,
  addStudentAtListTutory,
  removeStudentAtListTutory,
  getTutoryById,
  getTutoriesByIdStudent,
  createProcess,
  crons
};
