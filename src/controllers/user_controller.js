const bcrypt =require("bcrypt")


const User = require('../models/user_model')
const UnverifiedUser = require('../models/unverified_user_model')
const { v4: uuidv4 } = require('uuid')
const { getToken, getTokenData, getUnexpiredToken } = require('../config/jwt.config');
const { getTemplate, sendEmail } = require('../config/mail.config');

const dotenv = require("dotenv")
dotenv.config() 

const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD)

const registerUser = async (req,res)=>{
    try {
        let {name,IDUniversity,email,password,password_confirmation,
            sex,birthday,biography,role,IDFaculty,city_of_birth,perfil_photo,
            ID_favorite_subjects,phone} = req.body
        
        
            //Valida si contraseña es la misma
        if (password == password_confirmation){
            //Encripta clave
            const hashedPassword = await bcrypt.hash(password,saltRounds)
        
            // Verificar que el usuario no exista
            let user = await User.findOne({ email }) || null;
            let unverifiedUser =await UnverifiedUser.findOne({email}) || null
            if(user !== null) {
                return res.json({
                    success: false,
                    msg: 'Usuario ya existe'
                });
            }
            
           if(unverifiedUser !== null){
            return res.json({
                success: false,
                msg: 'Verifica este usuario'
            })
           }

            // Crear un nuevo usuario
            password= hashedPassword
            unv_user = new UnverifiedUser({name,IDUniversity,email,password,sex,birthday,biography,role,IDFaculty,city_of_birth,perfil_photo,ID_favorite_subjects,phone});

            // Generar token
            const token =  getToken({email, password});

            // Obtener un template
            const template = getTemplate(name, token)

            // Enviar el email
            await sendEmail(email, 'Correo de confirmación cuenta UNTutor', template)
            await unv_user.save()
            
            res.status(200).json({
                success: true,
                msg: 'Usuario registrado, verificar en cuenta de correo'
            }) 





        }else{
            res.json({isOk:false, msj:"Contraseñas desiguales"})
        }


    } catch (error) {
        
        console.log(error);
        return res.json({
            success: false,
            msg: 'Error al registrar usuario'
        })
    }
}

const confirm = async (req, res) => {
    try {

       // Obtener el token
       const { token } = req.params;
       
       // Verificar la data
       const data = await getTokenData(token);

       if(data === null) {

            return res.json({
                success: false,
                msg: 'Error al obtener data o token de confirmación expirado'
            });
       }

       

       const { email, password } = data.data;

       // Verificar existencia del usuario
       const unv_user = await UnverifiedUser.findOne({ email }) || null;

       if(unv_user === null) {
            return res.json({
                success: false,
                msg: 'Usuario no existe'
            });
       }

       // Verificar contraseña
       if(password !== unv_user.password) {
            return res.redirect('/error.html');
       }

       // Actualizar usuario
       
       const {name,IDUniversity,sex,birthday,biography,role,IDFaculty,city_of_birth,perfil_photo,ID_favorite_subjects,phone}=unv_user
       const user = new User({name,IDUniversity,email,password,sex,birthday,biography,role,IDFaculty,city_of_birth,perfil_photo,ID_favorite_subjects,phone})
       user.active = true
       await user.save();

       // Redireccionar a la confirmación
       //TODO: Preguntar a Jhon que quiere que le retorne esto, probablemente un Bearer token como en el Login
       return res.redirect('/confirm.html');
        
    } catch (error) {
        res.status(500).json({
            msg: error
        })
    }
}

const login = async (req,res)=>{
try {
    //Obtengo datos desde el front
    const {email,password} = req.body

    //Obtengo datos de usuario
   
    let user = await User.findOne({ email }) || null
   
    if(user === null) {
        return  res.status(404).json({
            success: false,
            msg: 'Usuario no existe'
        });
    }
    

    //Verificar que los datos son válidos
    const compare=await bcrypt.compare(password, user.password)
    
    if (!compare){
        return  res.status(401).json({
            success: false,
            msg: 'Contraseña Inválida'
        })
    }
    //Validar que el usuario esté verificado
   if(!user.active){
    return res.status(403).json({
    success: false,
    msg:'Usuario inhabilitado'
})
   }

    //Genera el token
    const token = await getUnexpiredToken({email, password})
    
    
    //TODO: Buscar campos de seguridad extras para añadir al login, sea mensajes por SMS o autenticacion por huella digital
    return res.json({
        token,
        user
    })
} catch (error) {
    //TODO: Averiguar que status es el mas indicado
    res.status(500).json({
        msg: error
    })
}
}

const home = async (req,res)=>{
try {
        // Aquí se verificaría si el token JWT enviado por el cliente es válido
        // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
        const token = req.headers.authorization.split(" ")[1]
        if(!token){
            res.status(401).json({ message: 'No se proporcionó un token' })
        }

        //Decodifico Token
        const dataUserDecoded = await getTokenData(token)
        
        //Busco usuario mediante Email en el DB
        
        console.log(dataUserDecoded.data.email)
        const mail = dataUserDecoded.data.email
        let user = await User.findOne({email:mail}) || null
        console.log("user: ",user)

    if(user === null) {
        return res.json({
            success: false,
            msg: 'Usuario no existe'
        });
    }
    

    //Verificar que los datos son válidos
    const compare = await bcrypt.compare(dataUserDecoded.data.password,user.password)
  
    if (!compare){
        return res.json({
            success: false,
            msg: 'Contraseña Inválida'
        })
    }

    res.json({user})


} catch (error) {
    res.status(404).json({ message: "Token no encontrado"})
}
}


//TODO: CREAR UN MÉTODO PARA BORRAR USUARIO DE BASE DE DATOS EN CASO DE NO CONFIRMARSE LA CUENTA
module.exports={
    registerUser,
    confirm,
    login,
    home
}