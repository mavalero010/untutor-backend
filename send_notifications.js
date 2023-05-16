const tutoryController = require("./src/controllers/tutory_controller")
const tutoryModel = require("./src/models/tutory_model")

const sendMessages = async(req,res)=>{
    try {
        const tutories = await tutoryModel.find()
        console.log(tutoryController.crons)
        for(i=0;i<tutories.length;i++){
            await tutoryController.createProcess(req,res,tutories[i])
            
        }
        console.log(tutoryController.crons)
    } catch (error) {
         
    }
}
module.exports={
    sendMessages 
}