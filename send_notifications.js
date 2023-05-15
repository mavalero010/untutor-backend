const tutoryController = require("./src/controllers/tutory_controller")
const tutoryModel = require("./src/models/tutory_model")

const sendMessages = async(req,res)=>{
    try {
        const tutories = await tutoryModel.find()
        for(i=0;i<tutories.length;i++){
            tutoryController.createProcess(req,res,tutories[i])
            
            }
    } catch (error) {
         
    }
}
module.exports={
    sendMessages 
}