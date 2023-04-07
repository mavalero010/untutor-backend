const bcrypt = require("bcrypt");

const User = require("../models/user_model");
const UnverifiedUser = require("../models/unverified_user_model");
const Comment = require("../models/comment_model");
const Story = require("../models/story_model");
const Subject = require("../models/subject_model");
const Source = require("../models/source_model");

const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");
const { getTemplate, sendEmail } = require("../config/mail.config");

const dotenv = require("dotenv");
dotenv.config();

const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);

const registerUser = async (req, res) => {
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
      idfaculty,
      city_of_birth,
      perfil_photo,
      idfavorite_subjects,
      phone,
    } = req.body;

    //Encripta clave
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verificar que el usuario no exista
    let user = (await User.findOne({ email })) || null;
    let unverifiedUser = (await UnverifiedUser.findOne({ email })) || null;
    if (user !== null) {
      return res.status(409).json({
        success: false,
        msg: "Usuario ya existe",
      });
    }

    if (unverifiedUser !== null) {
      return res.status(401).json({
        success: false,
        msg: "Verifica este usuario",
      });
    }

    if (role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para cuentas de rol student",
      });
    }

    // Crear un nuevo usuario
    password = hashedPassword;
    unv_user = new UnverifiedUser({
      name,
      iduniversity,
      email,
      password,
      gender,
      birthday,
      biography,
      role,
      idfaculty,
      city_of_birth,
      perfil_photo,
      idfavorite_subjects,
      phone,
    });

    // Generar token
    const token = getToken({ email, password });

    // Obtener un template
    const template = getTemplate(name, token);

    // Enviar el email
    await sendEmail(email, "Correo de confirmación cuenta UNTutor", template);
    await unv_user.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Usuario registrado, verificar en cuenta de correo",
      })
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Error al registrar usuario",
    });
  }
};

const confirm = async (req, res) => {
  try {
    // Obtener el token
    const { token } = req.params;

    // Verificar la data
    const data = getTokenData(token);

    if (data === null) {
      return res.status(401).json({
        success: false,
        msg: "Error al obtener data o token de confirmación expirado",
      });
    }

    const { email, password } = data.data;
    // Verificar no existencia del usuario
    const u = (await User.findOne({ email })) || null;
    if (u !== null) {
      return res.status(409).json({
        success: false,
        msg: "Usuario ya existe",
      });
    }

    // Verificar existencia del usuario en base de datos no verificada
    const unv_user = (await UnverifiedUser.findOne({ email })) || null;

    if (unv_user === null) {
      return res.status(404).json({
        success: false,
        msg: "Correo de cuenta no está en lista de espera por verificar",
      });
    }

    // Verificar contraseña
    if (password !== unv_user.password) {
      return res.redirect("/error.html");
    }

    // Actualizar usuario
    const {
      name,
      iduniversity,
      gender,
      birthday,
      biography,
      role,
      idfaculty,
      city_of_birth,
      perfil_photo,
      idfavorite_subjects,
      phone,
    } = unv_user;
    const user = new User({
      name,
      iduniversity,
      email,
      password,
      gender,
      birthday,
      biography,
      role,
      idfaculty,
      city_of_birth,
      perfil_photo,
      idfavorite_subjects,
      phone,
    });
    user.active = true;
    await user.save();

    //Borro registro de base de datos de usuaruo no verificado
    unv_user.deleteOne({ email });
    // Redireccionar a la confirmación
    //TODO: Preguntar a Jhon que quiere que le retorne esto, probablemente un Bearer token como en el Login
    return res.redirect("/confirm.html");
  } catch (error) {
    res.status(500).json({
      msg: error,
    });
  }
};

const login = async (req, res) => {
  try {
    //Obtengo datos desde el front
    const { email, password } = req.body;

    //Obtengo datos de usuario

    let user = (await User.findOne({ email })) || null;

    if (user === null) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no existe",
      });
    }

    //Verificar que los datos son válidos
    const compare = await bcrypt.compare(password, user.password);

    if (!compare) {
      return res.status(401).json({
        success: false,
        msg: "Contraseña Inválida",
      });
    }
    //Validar que el usuario esté verificado
    if (!user.active) {
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
      user,
    });
  } catch (error) {
    //TODO: Averiguar que status es el mas indicado
    res.status(500).json({
      msg: "Error iniciando sesión",
    });
  }
};

const home = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataUserDecoded = getTokenData(token);

    //Busco usuario mediante Email en el DB
    const mail = dataUserDecoded.data.email;
    let user = (await User.findOne({ email: mail })) || null;

    if (user === null) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no existe",
      });
    }

    //Verificar que los datos son válidos
    const compare = await bcrypt.compare(
      dataUserDecoded.data.password,
      user.password
    );

    if (!compare) {
      return res.status(401).json({
        success: false,
        msg: "Contraseña Inválida",
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ msg: "Token no encontrado" });
  }
};
const addIdCommentAtList = async (req, res) => {
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

    //Obtengo el target para saber en que base de datos buscar, sea Story, Source, Subject
    const { target } = req.query;
    const { comment, idauthor, idtarget } = req.body;
    const com = new Comment({ comment, idauthor, idtarget });

    if (target === "story") {
      const story = (await Story.findOne({ _id: idtarget })) || null;
      if (story === null) {
        return res.status(404).json({ success: false, msg: "Story no existe" });
      }
      story.idcomment_list.push(com._id);
      await story.save();
    }

    if (target === "source") {
      const source = (await Source.findOne({ _id: idtarget })) || null;
      if (source === null) {
        return res.status(404).json({ success: false, msg: "Recurso no existe" });
      }
      source.idcomment_list.push(com._id);
      await source.save();
    }

    if (target === "subject") {
      const subject = (await Subject.findOne({ _id: idtarget })) || null;
      if (subject === null) {
        return res.status(404).json({ success: false, msg: "Materia no existe" });
      }

      subject.idcomment_list.push(com._id);
      await subject.save();
    }
    await com.save();
    res.status(200).json(com);
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en controlador addIdCommentAtList" });
  }
};

const deleteCommentById = async (req, res) => {
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
    //Obtengo el target y el idcomment para saber en que base de datos buscar y eliminar, sea Story, Source, Subject
    const { target, idcomment, idtarget } = req.query;
    let validateTarget=false
    let result=[]

    if (target === "subject") {
      
      await Subject.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      ).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({
          success: false,
          msg: "Error eliminando comentario de lista en Subject",
        });
      });
      await Comment.deleteOne({ _id: idcomment }).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({ success: false, msg: "Error eliminando comentario" });
      });
      validateTarget=true
    }
    if (target === "source") {
      
      await Source.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      ).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({
          success: false,
          msg: "Error eliminando comentario de lista en Source",
        });
      });
      await Comment.deleteOne({ _id: idcomment }).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({ success: false, msg: "Error eliminando comentario" });
      });
      validateTarget=true
    }

    if (target === "story") {
      
      await Story.updateOne(
        { _id: idtarget },
        { $pull: { idcomment_list: idcomment } }
      ).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({
          success: false,
          msg: "Error eliminando comentario de lista en Source",
        });
      });
      await Comment.deleteOne({ _id: idcomment }).then(data=> result.push(data)).catch((err) => {
        return res.status(400).json({ success: false, msg: "Error eliminando comentario" });
      });
      validateTarget=true
    }
    
/*
    await Comment.pre('remove', async function (next) {
     
      try {
        await Story.updateMany(
          { idcomment_list: { $in: [idcomment] } },
          { $pull: { idcomment_list: idcomment } }
        );
        await Source.updateMany(
          { idcomment_list: { $in: [idcomment] } },
          { $pull: { idcomment_list: idcomment } }
        );
        await Subject.updateMany(
          { idcomment_list: { $in: [idcomment] } },
          { $pull: { idcomment_list: idcomment } }
        );
        next();
      } catch (error) {
        console.log(error)
        next(error);
      }
    });
*/
    if(!validateTarget){
    return res.status(400).json({ success: true, msg: "introduzca un target correcto" });
  }

  res.status(200).json(result)
  

  } catch (error) {
    console.log(error)
    res.status(500).json({ succes: false, msg: "Error en controlador deleteCommentById" });
  }
};
//TODO: CREAR UN MÉTODO PARA BORRAR USUARIO DE BASE DE DATOS EN CASO DE NO CONFIRMARSE LA CUENTA
module.exports = {
  registerUser,
  confirm,
  login,
  home,
  addIdCommentAtList,
  deleteCommentById,
};
