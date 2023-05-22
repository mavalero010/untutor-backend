const Admin = require("../models/admin_model");
const User = require("../models/user_model");
const Subject=require("../models/subject_model")
const Comment =require("../models/comment_model")
const UnverifiedAdmin = require("../models/unverified_admin_model");
const bcrypt = require("bcrypt");
const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");
const { getAdminTemplate, sendEmail } = require("../config/mail.config");
const dotenv = require("dotenv");
dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);

const registerAdmin = async (req, res) => {
  try {
    let {
      name,
      iduniversity,
      email,
      password,
      gender,
      birthday,
      biography,
      role,
      city_of_birth,
      perfil_photo,
      phone,
    } = req.body;
    //Encripta clave
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verificar que el usuario no exista
    let admin = (await Admin.findOne({ email })) || null;
    let unve_admin = (await UnverifiedAdmin.findOne({ email })) || null;

    if (admin !== null) {
      return res.status(409).json({
        success: false,
        msg: "Administrador ya existe",
      });
    }

    if (unve_admin !== null) {
      return res.status(200).json({
        success: false,
        msg: "Verifica este administrador",
      });
    }
    password = hashedPassword;
    unve_admin = new UnverifiedAdmin({
      name,
      iduniversity,
      email,
      password,
      gender,
      birthday,
      biography,
      role,
      city_of_birth,
      perfil_photo,
      phone,
    });

    // Generar token
    const token = getToken({ email, password });

    // Obtener un template
    const template = getAdminTemplate(name, token);
    // Enviar el email
    await sendEmail(
      email,
      "Correo de confirmación cuenta admin de UNTutor",
      template
    );
    await unve_admin.save().then((data) => {
      return res.status(200).json({
        data,
        success: true,
        msg: "Admin registrado, verificar en cuenta de correo",
      });
    });
  } catch (error) {
    res.status(404).json({ msg: "Error en controlador registerAdmin" });
  }
};
const loginAdmin = async (req, res) => {
    try {
    //Obtengo datos desde el front
    const { email, password } = req.body;

    //Obtengo datos de usuario

    let admin = (await Admin.findOne({ email })) || null;

    if (admin === null) {
      return res.status(404).json({
        success: false,
        msg: "Administrador no existe",
      });
    }
    //Verificar que los datos son válidos
    const compare = await bcrypt.compare(password, admin.password);

    if (!compare) {
      return res.status(401).json({
        success: false,
        msg: "Contraseña Inválida",
      });
    }
    //Validar que el usuario esté verificado
    if (!admin.active) {
      return res.status(403).json({
        success: false,
        msg: "Usuario inhabilitado",
      });
    }

    //Genera el token
    const token = getUnexpiredToken({ email, password });

    //TODO: Buscar campos de seguridad extras para añadir al login, sea mensajes por SMS o autenticacion por huella digital
    return res.status(200).json({
      token,
      admin,
    });

    } catch (error) {
        res.status(500).json({
            msg: "Error iniciando sesión de admin",
          });
    }
};

const confirmAdmin = async (req, res) => {
  try {
    // Obtener el token
    const { token } = req.params;

    // Verificar la data
    const data = getTokenData(token);

    if (data === null) {
      return res.status(401).redirect("/error.html");
    }

    const { email, password } = data.data;

    // Verificar no existencia del usuario
    const a = (await Admin.findOne({ email })) || null;
    if (a !== null) {
      return res.status(401).redirect("/confirm.html");
    }
    // Verificar existencia del usuario en base de datos no verificada
    const unv_admin = (await UnverifiedAdmin.findOne({ email })) || null;

    if (unv_admin === null) {
      return res.status(404).redirect("/error.html");
    }

    // Verificar contraseña
    if (password !== unv_admin.password) {
      return res.status(401).redirect("/error.html");
    }

    //Actualizar admin
    const {
        name,
        iduniversity,
        gender,
        birthday,
        biography,
        role,
        city_of_birth,
        perfil_photo,
        phone
    }=unv_admin

    const admin = new Admin({
        name,
        iduniversity,
        email,
        password,
        gender,
        birthday,
        biography,
        role,
        city_of_birth,
        perfil_photo,
        phone
    })

    admin.active = true;
    await admin.save();

    //Borro registro de base de datos de usuaruo no verificado
    unv_admin.deleteOne({ email });
    // Redireccionar a la confirmación
    //TODO: Preguntar a Jhon que quiere que le retorne esto, probablemente un Bearer token como en el Login
    return res.redirect("/confirm.html");

  } catch (error) {
    res.status(500).json({ msg: "Error en servidor " });
  }
};

const createTutor=async(req,res)=>{
try {
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

    let {
      name,
      iduniversity,
      email,
     // password,
      gender,
      birthday,
      biography,
      role,
      idfaculty,
      city_of_birth,
      perfil_photo,
      idfavorite_subjects,
      phone,
    } = req.body;
   
    //Encripta clave
    // Verificar que el usuario no exista
    let user = (await User.findOne({ email })) || null;
    if (user !== null) {
      return res.status(409).json({
        success: false,
        msg: "Email ya registrado",
      });
    }
    user = new User({
      name,
      iduniversity,
      email,
      gender,
      birthday,
      biography,
      active:true,
      role,
      idfaculty,
      city_of_birth,
      perfil_photo,
      password:null,
      idfavorite_subjects,
      phone,
    });

    await user.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Tutor registrado",
      })
    );

} catch (error) {
  res.status(500).json({ msg: "Error en servidor " });
}
}

const deleteComment=async(req,res)=>{
  try {
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
    const { target, idcomment, idtarget } = req.query;
    let validateTarget = false;
    let result = []    
    const c =(await Comment.findOne({ _id: idcomment})) || null;
   
    if (c === null) {
      return res.status(401).json({
        msg: "Sin autorización para borrar",
      });
    }
    if (target === "subject") {

      await Subject.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      )
        .then((data) => result.push(data))
        .catch((err) => {
          return res.status(400).json({
            success: false,
            msg: "Error eliminando comentario de lista en Subject",
          });
        });
      await Comment.deleteOne({ _id: idcomment })
        .then((data) => result.push(data))
        .catch((err) => {
          return res
            .status(400)
            .json({ success: false, msg: "Error eliminando comentario" });
        });
      validateTarget = true;
    }
    if (target === "source") {
      await Source.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      )
        .then((data) => result.push(data))
        .catch((err) => {
          return res.status(400).json({
            success: false,
            msg: "Error eliminando comentario de lista en Source",
          });
        });
      await Comment.deleteOne({ _id: idcomment })
        .then((data) => result.push(data))
        .catch((err) => {
          return res
            .status(400)
            .json({ success: false, msg: "Error eliminando comentario" });
        });
      validateTarget = true;
    }

    if (target === "story") {
      await Story.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      )
        .then((data) => result.push(data))
        .catch((err) => {
          return res.status(400).json({
            success: false,
            msg: "Error eliminando comentario de lista en Source",
          });
        });
      await Comment.deleteOne({ _id: idcomment })
        .then((data) => result.push(data))
        .catch((err) => {
          return res
            .status(400)
            .json({ success: false, msg: "Error eliminando comentario" });
        });
      validateTarget = true;
    }
    if (!validateTarget) {
      return res
        .status(400)
        .json({ success: true, msg: "introduzca un target correcto" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ msg: "Error en servidor " });

  }
}
module.exports = {
  registerAdmin,
  loginAdmin,
  confirmAdmin,
  createTutor,
  deleteComment
};
