const validUrl = require('valid-url');
const urlmodel = require("../models/urlmodel")
const shortid = require('shortid');

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}
 let urlRegex =  "((http|https)://)(www.)?" 
 + "[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]"
 + "{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)"

const createUrl = async function (req, res) {
    try {
        if (!Object.keys(req.body).length > 0) {
            return res.status(400).send({ status: false, message: "Please provide some data in body" })
        }
        let { longurl, ...rest } = req.body

        if(rest){
            return res.status(400).send({status:false, message:"please provide only longurl "})
        }

        
        if (!isValid(longurl)) {
            return res.status(400).send({ status: false, message: "longurl is required" })
        }

        if (!longurl.match(urlRegex)){
            return res.status(400).send({status:false, message:"invalid Url"})
         }

        if (!validUrl.isUri(longurl)) {
            return res.status(400).send({ status: false, message: "invalid url" })
        }

        let findUrl = await urlmodel.findOne({ longUrl: longurl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
         if(findUrl){
            return res.status(200).send({status:true,message:"url already present",data:findUrl})
         }


        const urlcode = shortid.generate()
        const shorturl = `http://${req.get("host")}/${urlcode}`
        const savedata = {
            "longUrl": longurl,
            "urlCode": urlcode,
            "shortUrl": shorturl
        }


        const createData = await urlmodel.create(savedata)

        const {urlCode, shortUrl, longUrl} = createData
        const savedata2 = {urlCode, shortUrl, longUrl} 

        return res.status(201).send({ status: true, data: savedata2 })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const getUrl = async function (req, res) {
     let urlCode = req.params.urlCode
     
     const findurlLink = await urlmodel.findOne({urlCode:urlCode})
     if(!findurlLink){
        return res.status(404).send({status:false, message:"Url not found"})
     }

     return res.status(302).redirect(findurlLink.longUrl) 
}

module.exports = { createUrl, getUrl }