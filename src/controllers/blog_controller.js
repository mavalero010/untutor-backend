const Blog = require("../models/blog_model");
const Admin =require("../models/admin_model")
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");
const createBlog =async(req,res)=>{
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
   
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin)
    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const {name,description,category,publication_day,date_init}=req.body
    const blog = new Blog({name,description,category,publication_day,date_init})

    await blog.save().then((data) =>
    res.status(200).json({
      data,
      success: true,
      msg: "Blog creado",
    })
  );

    } catch (error) {
     res.status(500).json({ succes: false, msg: "Error en servidor" });
    }
}

module.exports ={
    createBlog
}