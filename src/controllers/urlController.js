var validUrl = require('valid-url');
const urlmodel = require("../models/urlmodel")
const shortid = require('shortid');

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const createUrl = async function (req, res) {
    try {
       if(!Object.keys(req.body).length>0){
           return res.status(400).send({status:false, message:"Please provide some data in body" })
       }
       let {longUrl} = req.body

       if(!isValid(longUrl)){
        return res.status(400).send({status:false,message:"longUrl is required"})
       }

       if (!validUrl.isUri(longUrl)){
        return res.status(400).send({status:false,message:"invalid url"})
    } 

    let findurl = await urlmodel.findOne({longUrl:longUrl})

    if(findurl){
        return res.status(400).sens({status:false, message:"url already present"})
    }


    const urlCode = shortid.generate()

   const savedata = {
    "longUrl":longUrl,
    "urlCode":urlCode,
    "shortUrl":`http://${req.get("host")}/${urlCode}`
   }


   const createData = await urlmodel.create(savedata)

       return res.status(201).send({status:true, data : createData})
    
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const getUrl = async function (req, res) {

}

module.exports = { createUrl, getUrl }