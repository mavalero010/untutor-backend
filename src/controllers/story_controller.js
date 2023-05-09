const Story = require("../models/story_model");
const User = require("../models/user_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bcrypt = require("bcrypt");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  headObject,
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


const getStoryById=async(req,res)=>{
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
    const {idstory} = req.query
    
    const story = await Story.findOne({_id:idstory}) || null
    if(story===null){
        return res.status(404).json({msg:"Story no existe"})
    }

    const us = await User.findOne({_id:story.iduser})
    let url = null
    if (story.multimedia !== null) {
      const getObjectParams = {
        Bucket: bucketSource,
        Key: story.multimedia,
      };

      const command = new GetObjectCommand(getObjectParams);
       url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    }
    story.multimedia=url

    let urlProfilePhotoUser=null
    if (us.perfil_photo !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: us.perfil_photo,
      };

      const command = new GetObjectCommand(getObjectParams);
      urlProfilePhotoUser = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    }
    res.status(200).json({_id:story.id,message:story.name,multimedia:story.multimedia,author:{_id:us._id,name:us.name,perfil_photo:urlProfilePhotoUser}})

} catch (error) {
    res.status(500).json({
        succes: false,
        msg: "Error en servidor",
      });
}
}

module.exports = {
    getStoryById,
  };