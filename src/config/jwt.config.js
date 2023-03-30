const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config() 

const getToken = (payload) => {
    return jwt.sign({
        data: payload
    }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

const getUnexpiredToken = (payload)=>{
    return jwt.sign({
        data: payload
    }, process.env.JWT_SECRET, { expiresIn: '10h' })
}
const getTokenData = (token) => {
    let data = null;
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            if (err.name === 'TokenExpiredError') {
                //TODO: Investigar que tipo de res.status() se acomoda a este error
                console.log('Token Expired');
              }
            console.log('Error al obtener data del token');
        } else {
            data = decoded;
        }
    });

    return data;
}

module.exports = {
    getToken,
    getTokenData,
    getUnexpiredToken
}