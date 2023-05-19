const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const University = require("../models/university_model");
const UnverifiedUser = require("../models/unverified_user_model");
const Comment = require("../models/comment_model");
const Story = require("../models/story_model");
const Tutory = require("../models/tutory_model");
const Subject = require("../models/subject_model");
const Source = require("../models/source_model");
const Faculty = require("../models/faculty_model");
const multer = require("multer");

const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");
const { getTemplate, sendEmail } = require("../config/mail.config");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bcrypt = require("bcrypt");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);
const bucketProfilePhoto = process.env.BUCKET_PROFILE_PHOTO;
const bucketSource=process.env.BUCKET_SOURCE_UNTUTOR
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
const sharp = require("sharp");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
    let user = (await User.findOne({ email })) ;
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
      return res.status(401).redirect("/error.html");
    }

    const { email, password } = data.data;
    // Verificar no existencia del usuario
    const u = (await User.findOne({ email })) || null;
    if (u !== null) {
      return res.status(401).redirect("/confirm.html");
    }

    // Verificar existencia del usuario en base de datos no verificada
    const unv_user = (await UnverifiedUser.findOne({ email })) || null;

    if (unv_user === null) {
      return res.status(404).redirect("/error.html");
    }

    // Verificar contraseña
    if (password !== unv_user.password) {
      return res.status(401).redirect("/error.html");
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
    const { email, password, device_token } = req.body;

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
    if (user.role!=="student") {
      return res.status(401).json({
        success: false,
        msg: "Usario no es tipo estudiante",
      });
    }
    //Genera el token
    const token = getUnexpiredToken({ email, password });
    let url = null;
    if (user.perfil_photo !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: user.perfil_photo,
        //ACL:'public-read'
      };
      const command = new GetObjectCommand(getObjectParams);
      
      url = (await getSignedUrl(s3, command)).split("?")[0];
    }
    const university = await University.findOne({_id:user.iduniversity})
    await User.updateOne({ _id: user._id }, { device_token})
    return res.status(200).json({
      token,
      user:{
        _id: user._id,
        name: user.name,
        university: { name: university.name, _id: university._id },
        email: user.email,
        gender: user.gender,
        birthday: user.birthday,
        biography: user.biography,
        role: user.role,
        faculty: user.idfaculty,
        city_of_birth: user.city_of_birth,
        perfil_photo: url,
        idfavorite_subjects: user.idfavorite_subjects,
        phone: user.phone,
      },
    });
  } catch (error) {
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
        return res
          .status(404)
          .json({ success: false, msg: "Recurso no existe" });
      }
      source.idcomment_list.push(com._id);
      await source.save();
    }

    if (target === "subject") {
      const subject = (await Subject.findOne({ _id: idtarget })) || null;
      if (subject === null) {
        return res
          .status(404)
          .json({ success: false, msg: "Materia no existe" });
      }

      subject.idcomment_list.push(com._id);
      await subject.save();
    }
    await com.save();
    res.status(201).json(com);
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador addIdCommentAtList" });
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
    let validateTarget = false;
    let result = [];

    const c =
      (await Comment.findOne({ _id: idcomment, idauthor: user._id })) || null;

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
        next(error);
      }
    });
*/
    if (!validateTarget) {
      return res
        .status(400)
        .json({ success: true, msg: "introduzca un target correcto" });
    }

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador deleteCommentById" });
  }
};

const uploadProfilePhoto = async (req, res, file) => {
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
    const imageName = file.originalname
    /*Key: filename,
  Body: fs.createReadStream(filepath),
  Bucket: Constant.AWS_S3_BUCKET,
  ACL:'public-read-write' */
    const params = {
      Bucket: bucketProfilePhoto,
      Key: imageName,
      Body: file.buffer, //buffer
      ContentType: file.mimetype,
      //ACL:'public-read'
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const u = await User.findByIdAndUpdate(
      { _id: user.id },
      {perfil_photo: imageName },
      { new: true }
    );
    const university = await University.findOne({_id:user.iduniversity})
    let url = null;
    if (user.perfil_photo !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: u.perfil_photo,
        //ACL:'public-read'
      };
      const command = new GetObjectCommand(getObjectParams);
      
      url = (await getSignedUrl(s3, command)).split("?")[0];
      res.status(200).json({
       token,
        user:{
          _id: u._id,
          name: u.name,
          university: { name: university.name, _id: university._id },
          email: u.email,
          gender: u.gender,
          birthday: u.birthday,
          biography: u.biography,
          role: u.role,
          faculty: u.idfaculty,
          city_of_birth: u.city_of_birth,
          perfil_photo: url,
          idfavorite_subjects: u.idfavorite_subjects,
          phone: u.phone,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ succes: false, msg: error });
  }
};

const deleteProfilePhoto = async (req, res) => {
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

    if (user.perfil_photo === null) {
      return res.status(401).json({
        msg: "No hay imagenes para borrar",
      });
    }

    const params = {
      Bucket: bucketProfilePhoto,
      Key: user.perfil_photo,
    };
    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    const newuser = await User.updateOne(
      { _id: user._id },
      { $set: { perfil_photo: null } },
      { new: true }
    );
    res.json(newuser);
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
};

const getUserById = async (req, res) => {
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
        msg: "Token inválido",
      });
    }

    const { iduser } = req.query;
    let us = (await User.findOne({ _id: iduser })) || null;
    let university =
      (await University.findOne({ _id: us.iduniversity })) || null;
    let faculty = await Faculty.findOne({ _id: us.idfaculty });
    let subjects = await Subject.find({_id:{$in:us.idfavorite_subjects}})
    if (us === null) {
      return res.status(404).json({
        msg: "Perfil de usuario no existe",
      });
    }
    let url = null;
    if (us.perfil_photo !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: us.perfil_photo,
      };
      const command = new GetObjectCommand(getObjectParams);
      url = (await getSignedUrl(s3, command)).split("?")[0]
    }
    let sss = []
   
    for(let i=0;i<user.idfavorite_subjects.length;i++){
      let urlsss = null;
      const s = await Subject.findOne({_id:user.idfavorite_subjects[i]})
      if (s.url_background_image !== null) {
        const getObjectParams = {
          Bucket: bucketProfilePhoto,
          Key: s.url_background_image,
        };
        const command = new GetObjectCommand(getObjectParams);
        urlsss = (await getSignedUrl(s3, command)).split("?")[0]
        sss.push({_id:s._id,name:s.name,url_background_image:urlsss,tutors:s.idtutor_list.length})
      }
    }
    const tutories = await Tutory.find({
      idstudent_list: {
        $elemMatch: { $eq: user._id },
      },
    });
const stories = await Story.find({iduser:user._id})
let ss=[]
    for(let i=0;i<stories.length;i++){
      let urlS=null

      if (stories[i].multimedia !== null) {
        const getObjectParams = {
          Bucket: bucketSource,
          Key: stories[i].multimedia,
        };
        const command = new GetObjectCommand(getObjectParams);
        urlS = (await getSignedUrl(s3, command)).split("?")[0];
        }
        ss.push({_id: stories[i]._id, message: stories[i].name, multimedia: urlS, author:{_id:user._id,perfil_photo:url,name:user.name}})

    }
    const user_res = {
      _id: us._id,
      name: us.name,
      university: { name: university.name, _id: university._id },
      email: us.email,
      gender: us.gender,
      birthday: us.birthday,
      biography: us.biography,
      role: us.role,
      faculty: { _id: faculty._id, name: faculty.name },
      city_of_birth: us.city_of_birth,
      perfil_photo: url,
      subjects: sss,
      tutories,
      stories:ss,
      phone: us.phone,
    }


    res.status(200).json({user:user_res});
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
};

const updateUser = async (req, res) => {
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
        msg: "Token inválido",
      });
    }

    const {
      name,
      iduniversity,
      email,
      password,
      gender,
      birthday,
      biography,
      idfaculty,
      city_of_birth,
      phone,
    } = req.body;

    const t = getUnexpiredToken({ email, password })
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const u =  (await User.findByIdAndUpdate(
      { _id: user._id },
      {
        name,
        iduniversity,
        email,
        hashedPassword,
        gender,
        birthday,
        biography,
        idfaculty,
        city_of_birth,
        phone,
      },
      { new: true }
    )) || null;

    if(u===null){
      res.status(500).json({msg:"Error actualizando usuario"})
    }

    res.status(200).json({r:u,token:t});
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
};

const addFavoriteSubjectAtList=async(req,res)=>{
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
        msg: "Token inválido",
      });
    }

    const {idsubject}=req.query
    const u =await User.updateOne({ _id: user._id }, { $addToSet: { idfavorite_subjects: idsubject } },{new:true})
     
    res.json(u)
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
}

const removeFavoriteSubjectFromList= async (req,res)=>{
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
        msg: "Token inválido",
      });
    }

    const {idsubject}=req.query
    await User.updateOne(
      { _id: user._id },
      { $pull: { idfavorite_subjects: idsubject } },
      { new: true }
)
 res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
}

const deleteUser= async (req,res)=>{
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
        msg: "Token inválido",
      });
    }
    const u=await User.deleteOne({_id:user._id})
    res.status(200).json(u)
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
}

const createStory=async(req,res,file)=>{
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
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
        msg: "Usuario no existe, token inválido",
      });
    }
    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }
    const {name,idsubject}=req.body
    const imageName = file.originalname
    const params = {
      Bucket: bucketSource,
      Key: imageName,
      Body: file.buffer, //buffer
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const story = new Story({name:name,iduser:user._id,multimedia:imageName,idsubject:idsubject,idcomment_list:null})
    await story.save()

    const su = await Subject.findOneAndUpdate(
      { _id: idsubject },
      { $addToSet: { idstory_list: story._id } }, // El operador $addToSet agrega el estudiante solo si no existe aún
      { new: true } // Devuelve el registro actualizado
    );
    res.status(200).json({story})
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
}

const getAllUsers= async(req,res)=>{
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
    //Recibo params
    const users = await User.find();
    let results=[]
    for(d of users){  
      let university = (await University.findOne({ _id: d.iduniversity }));
      let faculty = (await Faculty.findOne({_id:d.idfaculty}))
      let subjects= await Subject.find({_id:{$in:d.idfavorite_subjects}})
      let url = null;
      if (d.perfil_photo !== null) {
        const getObjectParams = {
          Bucket: bucketProfilePhoto,
          Key: d.perfil_photo,
        };
        const command = new GetObjectCommand(getObjectParams);
        url =(await getSignedUrl(s3, command)).split("?")[0]
      }
      results.push({
        _id: d._id,
        name: d.name,
        university: { name: university.name, _id: university._id },
        email: d.email,
        gender: d.gender,
        birthday: d.birthday,
        biography: d.biography,
        role: d.role,
        faculty: { _id: faculty._id, name: faculty.name },
        city_of_birth: d.city_of_birth,
        perfil_photo: url,
        idfavorite_subjects: subjects.map(s=>{return {_id:s._id,name:s.name}}),
        phone: d.phone,
      })
    }

    res.status(200).json(results)
} catch (error) {
  res.status(500).json({ succes: false, msg: "Error en servidor" });
}
}

const getAllStoriesByIdUser= async(req,res)=>{
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
    const stories = await Story.find({iduser:user._id})
    let us= user
    let st=[]
    for (story of stories){
      
      let url = null
      if (story.multimedia !== null) {
        const getObjectParams = {
          Bucket: bucketSource,
          Key: story.multimedia,
        };
  
        const command = new GetObjectCommand(getObjectParams);
         url = (await getSignedUrl(s3, command)).split("?")[0];
      
      }
      story.multimedia=url
  
      let urlProfilePhotoUser=null
      if (us.perfil_photo !== null) {
        const getObjectParams = {
          Bucket: bucketProfilePhoto,
          Key: us.perfil_photo,
        };
  
        const command = new GetObjectCommand(getObjectParams);
        urlProfilePhotoUser = (await getSignedUrl(s3, command)).split("?")[0];
      
      }

      let comments =[]
      if(story.idcomment_list!==null){
        let cs = story.idcomment_list.map(s=>s.toString())
       
        for (comment of cs){
          let urlUserComment=null
          const c = await Comment.findOne({_id:comment})
          const commenter = await User.findOne({_id:c.idauthor})
        
          if (commenter.perfil_photo !== null) {
            const getObjectParams = {
              Bucket: bucketProfilePhoto,
              Key: commenter.perfil_photo,
            };
            const command = new GetObjectCommand(getObjectParams);
            urlUserComment = (await getSignedUrl(s3, command)).split("?")[0];
          
          }
          comments.push({_id:commenter._id, name:commenter.name, message: c.comment})
         
        }
      }
      
      st.push({_id:story.id,message:story.name,multimedia:story.multimedia,author:{_id:us._id,name:us.name,perfil_photo:urlProfilePhotoUser},comments:comments})
     }
   
    res.status(200).json(st)
 

  } catch (error) {
    res.status(500).json({ succes: false, msg: error });
  }
}
module.exports = {
  registerUser,
  confirm,
  login,
  home,
  addIdCommentAtList,
  deleteCommentById,
  uploadProfilePhoto,
  deleteProfilePhoto,
  getUserById,
  updateUser,
  addFavoriteSubjectAtList,
  removeFavoriteSubjectFromList,
  deleteUser,
  createStory,
  getAllUsers,
  getAllStoriesByIdUser
};
