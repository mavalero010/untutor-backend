const Admin = require("../models/admin_model");
const User = require("../models/user_model");
const Blog = require("../models/blog_model");
const University = require("../models/university_model");
const Faculty = require("../models/faculty_model");
const Subject = require("../models/subject_model");
const Comment =require("../models/comment_model")
const Eventos = require("../models/event_model");
const Tutory = require("../models/tutory_model");
const Source = require("../models/source_model");

const bcrypt = require("bcrypt");
const {
  getToken,
  getTokenData,
  authTokenDecoded,
  getUnexpiredToken,
} = require("../config/jwt.config");

const dotenv = require("dotenv");
dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);

//users
const getUsers = async(req,res)=>{
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
    const usuario = await User.find()
    res.status(200).json(usuario);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
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

const getUsersByIdUniversities =async(req,res)=>{
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

//universities
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

//faculties
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

const postFaculty=async(req,res)=>{
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
        description,
        iduniversity
      } = req.body;
     
      let faculty = (await Faculty.findOne({ name })) || null;
      if (faculty !== null) {
        return res.status(409).json({
          success: false,
          msg: "ya registrado",
        });
      }
      faculty = new Faculty({
        name,
        description,
        iduniversity
      });
  
      await faculty.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Facultad registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
}

const getFacultiesByIdUniversities =async(req,res)=>{
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
    const facultad = await Faculty.find({iduniversity:req.params.id})
    res.status(200).json(facultad);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getFacultyById =async(req,res)=>{
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
    const facultad = await Faculty.findById(req.params.id)
    res.status(200).json(facultad);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteFacultyById =async(req,res)=>{
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
    const facultad = await Faculty.findByIdAndDelete(req.params.id)
    res.status(200).json(facultad);
  } catch (err) {
    res.status(500).json(err);
  }
}

//subjects
const getSubjects = async(req,res)=>{
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
    const materia = await Subject.find()
    res.status(200).json(materia);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getSubjectsByIdFaculties =async(req,res)=>{
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
    const materia = await Subject.find({idfaculty:req.params.id})
    res.status(200).json(materia);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const postSubject=async(req,res)=>{
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
        credits,
        description,
        url_background_image,
        difficulty_level,
        idfaculty
      } = req.body;
     
      let subject = (await Subject.findOne({ name })) || null;
      if (subject !== null) {
        return res.status(409).json({
          success: false,
          msg: "ya registrado",
        });
      }

      subject = new Subject({
        name,
        credits,
        description,
        url_background_image,
        difficulty_level,
        idfaculty
      });
      await subject.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Materia registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
}

const getSubjectById =async(req,res)=>{
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
    const materia = await Subject.findById(req.params.id)
    res.status(200).json(materia);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteSubjectById =async(req,res)=>{
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
    const materia = await Subject.findByIdAndDelete(req.params.id)
    res.status(200).json(materia);
  } catch (err) {
    res.status(500).json(err);
  }
}

//events
const getEvents = async(req,res)=>{
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
    const evento = await Eventos.find()
    res.status(200).json(evento);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const postEvent=async(req,res)=>{
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
        category,
        date_init,
        priority,
        publication_day,
        description
      } = req.body;
     
      let evento = new Eventos({
        name,
        category,
        date_init,
        priority,
        publication_day,
        description
      });
      await evento.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Evento registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
}

const getEventById =async(req,res)=>{
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
    const evento = await Eventos.findById(req.params.id)
    res.status(200).json(evento);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteEventById =async(req,res)=>{
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
    const evento = await Eventos.findByIdAndDelete(req.params.id)
    res.status(200).json(evento);
  } catch (err) {
    res.status(500).json(err);
  }
}

//blogs
const getBlogs = async(req,res)=>{
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
    const blog = await Blog.find()
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const postBlog=async(req,res)=>{
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
        description,
        category,
        publication_day,
        date_init
      } = req.body;
     
      let blog = new Blog({
        name,
        description,
        category,
        publication_day,
        date_init
      });
      await blog.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Blog registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
}

const getBlogById =async(req,res)=>{
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
    const blog = await Blog.findById(req.params.id)
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteBlogById =async(req,res)=>{
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
    const blog = await Blog.findByIdAndDelete(req.params.id)
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json(err);
  }
}

//comments
const getComments = async(req,res)=>{
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
    const comentario = await Comment.find()
    res.status(200).json(comentario);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getCommentById =async(req,res)=>{
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
    const comentario = await Comment.findById(req.params.id)
    res.status(200).json(comentario);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteCommentById =async(req,res)=>{
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
    const comentario = await Comment.findByIdAndDelete(req.params.id)
    res.status(200).json(comentario);
  } catch (err) {
    res.status(500).json(err);
  }
}
//tutories
const getTutories = async(req,res)=>{
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
    const tutoria = await Tutory.find()
    res.status(200).json(tutoria);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const postTutory=async(req,res)=>{
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
     
      let tutoria = new Tutory({
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
  
      await tutoria.save().then((data) =>
        res.status(200).json({
          data,
          success: true,
          msg: "Tutoria registrado",
        })
      );
  
    } catch (error) {
      res.status(500).json({ msg: "Error en servidor " });
    }
}

const getTutoriesByIdSubjects =async(req,res)=>{
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
    const tutoria = await Tutory.find({idsubject:req.params.id})
    res.status(200).json(tutoria);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getTutoryById =async(req,res)=>{
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
    const tutoria = await Tutory.findById(req.params.id)
    res.status(200).json(tutoria);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteTutoryById =async(req,res)=>{
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
    const tutoria = await Tutory.findByIdAndDelete(req.params.id)
    res.status(200).json(tutoria);
  } catch (err) {
    res.status(500).json(err);
  }
}

//sources
const getSources = async(req,res)=>{
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
    const recurso = await Source.find()
    res.status(200).json(recurso);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getSourcesByIdSubjects =async(req,res)=>{
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
    const recurso = await Source.find({idsubject:req.params.id})
    res.status(200).json(recurso);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const getSourceById =async(req,res)=>{
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
    const recurso = await Source.findById(req.params.id)
    res.status(200).json(recurso);
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Admin no existe, token inválido",
    });
  }
}

const deleteSourceById =async(req,res)=>{
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
    const result=[]
    const { id } = req.params.id;
    const source = await Source.findById(id);
    await Subject.updateOne(
      { _id: source.idsubject },
      { $pull: { idsource_list: source._id } }
    ).then(data=> result.push(data)).catch((err) => {
      return res.status(400).json({
        success: false,
        msg: "Error eliminando recurso de lista en Subject",
      });
    });

    await Source.deleteOne({ _id: idsource }).then(data=> result.push(data)).catch((err) => {
      return res
        .status(400)
        .json({ success: false, msg: "Error eliminando recurso" });
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en el servidor",
    });
  }
}

const getLinkSourceById = async (req, res) => {
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
    const { id } = req.query;

    let source = await Source.findOne({ _id: id });
    const getObjectParams = {
      Bucket: bucketSourceFile,
      Key: source.url_file,
    };
    let url = null;
    if (source.url_file !== null) {
      const command = new GetObjectCommand(getObjectParams);
      url = (await getSignedUrl(s3, command)).split("?")[0];
    }
    res.json({
      _id: source._id,
      name: source.name,
      description: source.description,
      category: source.category,
      url_file: url,
      idsubject: source.idsubject,
      idcomment_list: source.idcomment_list,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en el servidor",
    });
  }
};

module.exports = {
  //users
  getUsers,
  postUser,
  getUsersByIdUniversities,
  getUserById,
  deleteUserById,
  getUniversities,
  //faculties
  getFaculties,
  postFaculty,
  getFacultiesByIdUniversities,
  getFacultyById,
  deleteFacultyById,
  //subjects
  getSubjects,
  getSubjectsByIdFaculties,
  postSubject,
  getSubjectById,
  deleteSubjectById,
  //events
  getEvents,
  postEvent,
  getEventById,
  deleteEventById,
  //blogs
  getBlogs,
  postBlog,
  getBlogById,
  deleteBlogById,
  //comments
  getComments,
  getCommentById,
  deleteCommentById,
  //tutories
  getTutories,
  getTutoriesByIdSubjects,
  postTutory,
  getTutoryById,
  deleteTutoryById,
  //sources
  getSources,
  getSourcesByIdSubjects,
  getSourceById,
  deleteSourceById,
  getLinkSourceById
};
