const Admin = require("../models/admin_model");
const User = require("../models/user_model");
const Blog = require("../models/blog_model");
const University = require("../models/university_model");
const Faculty = require("../models/faculty_model");

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

const postBlog =async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token" });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin)
    if (!validateInfo) {
        return res.status(401).json({
            success: false,
            msg: "Admin no existe, token inválido",
        });
    }
    //endpoint
    const {name,description,category,publication_day,date_init}=req.body
    const blog = new Blog({name,description,category,publication_day,date_init})
    await blog.save().then((data) =>
    res.status(200).json({
        data,
        success: true,
        msg: "Blog creado",
    }))
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
}

const postUser=async(req,res)=>{
  try {
      //verificar token
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No se proporcionó un token" });
      }
      const dataAdminDecoded = getTokenData(token);
      const mail = dataAdminDecoded.data.email;
      let admin = (await Admin.findOne({ email: mail })) || null;
      const validateInfo = authTokenDecoded(dataAdminDecoded, admin)
      if (!validateInfo) {
          return res.status(401).json({
              success: false,
              msg: "Admin no existe, token inválido",
          });
      }
      //endpoint
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
        device_token
      } = req.body;
     
      //Encripta clave
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      password = hashedPassword;
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
        password,
        idfavorite_subjects,
        phone,
        device_token
      });
  
      await user.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Usuario registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
  }

const getUsers =async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó un token"
      });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    //endpoint
    const user = await User.find({iduniversity:req.params.id})
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getUserById =async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó un token"
      });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    //endpoint
    const user = await User.findById(req.params.id)
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const patchUsers =async(req,res)=>{
  try {
      const usuario = await UsuarioModel.findOneAndUpdate({ _id: req.params.id}, req.body);
      const resultado = await usuario.save();
      res.status(200).json(resultado);
  } catch (err) {
      res.status(500).json(err);
  }
}

const deleteUserById =async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó un token"
      });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    //endpoint
    const usuario = await User.findByIdAndDelete(req.params.id)
    res.status(200).json(usuario);
  } catch (err) {
    res.status(500).json(err);
  }
}

const getUniversities = async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó un token"
      });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    //endpoint
    const university = await University.find()
    res.status(200).json(university);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getFaculties = async(req,res)=>{
  try {
    //verificar token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó un token"
      });
    }
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    let admin = (await Admin.findOne({ email: mail })) || null;
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);
    if (!validateInfo) {
      res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    //endpoint
    const faculty = await Faculty.find()
    res.status(200).json(faculty);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

module.exports = {
  loginAdmin,
  postBlog,
  postUser,
  getUsers,
  getUserById,
  patchUsers,
  deleteUserById,
  getUniversities,
  getFaculties
};
