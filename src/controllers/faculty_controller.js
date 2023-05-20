const Faculty = require("../models/faculty_model");
const User = require("../models/user_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const getFaculty = async (req, res) => {
  try {

    let { idfaculty,page, limit,iduniversity } = req.query;
    if(idfaculty===undefined){
      
      const f = await Faculty.paginate({iduniversity}, { page, limit })
      const {docs,totalPages} = f 
      return res.status(200).json({ results:docs, totalPages, page: parseInt(page) });
      
    }
    const faculty = await Faculty.findOne({ _id: idfaculty , iduniversity:iduniversity}) || null;
    
    if (faculty === null) {
      return res.status(404).json({
        success: false,
        msg: "idfaculty inválido",
      });
  }
  res.status(200).json(faculty);
  } catch (error) {

    res.status(500).json({ succes: false, msg: "error en controlador"});
  }
};

module.exports = {
  getFaculty,
};
