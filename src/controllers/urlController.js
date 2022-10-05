

const validUrl = require('valid-url');
const urlmodel = require("../models/urlmodel")
const shortid = require('shortid');
const redis = require("redis")
const { promisify } = require("util")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}
 let urlRegex =  "((http|https)://)(www.)?" 
 + "[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]"
 + "{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)"




 const redisClient = redis.createClient(
    10044,
    "redis-10044.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("F4AQKPeLqTAX3WDkw7yTMkD5R0b3qfX3", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  //1. connect to the server
  //2. use the commands :
  
  //Connection setup for redis
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
  




const createUrl = async function (req, res) {
    try {
        if (!Object.keys(req.body).length > 0) {
            return res.status(400).send({ status: false, message: "Please provide some data in body" })
        }
        let { longurl, ...rest } = req.body

        if(rest.lenght ==0){
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

        let longurl1 = await GET_ASYNC(`${longurl}`)
        //  let urlCode = req.params.urlCode
    
        if(longurl1) {
            let data = JSON.parse(longurl1)
            const {urlCode, shortUrl, longUrl} = data
            const savedata = {urlCode, shortUrl, longUrl}
            return res.status(200).send({status:true,message:"url already present", data:savedata})
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

        await SET_ASYNC(`${longurl}`, JSON.stringify(createData))

        const {urlCode, shortUrl, longUrl} = createData
        const savedata2 = {urlCode, shortUrl, longUrl} 

        return res.status(201).send({ status: true, data: savedata2 })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const getUrl = async function (req, res) {
    try {
        let urlcode1 = req.params.urlCode
    let urlcode = await GET_ASYNC(`${urlcode1}`)
    //  let urlCode = req.params.urlCode

    if(urlcode) {
        let data = JSON.parse(urlcode)
        return res.status(302).redirect(data.longUrl)
      } else {
        const findurlLink = await urlmodel.findOne({urlCode:urlcode1})
        await SET_ASYNC(`${urlcode1}`, JSON.stringify(findurlLink))
        return res.status(302).redirect(findurlLink.longUrl) 
      } 
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
    
    
}

module.exports = { createUrl, getUrl }