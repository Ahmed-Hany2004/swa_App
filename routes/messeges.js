const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");


const router = express.Router()



router.get("/chat/:id",async(req,res)=>{

  const messege = db.collection("messege")

  try{

data =await messege.aggregate([
 {$match: {"chatid":new ObjectId(req.params.id)}},
 { $sort: { time: -1 } },
 {
  $lookup:
  {
    from: "user",
    localField: "user",
    foreignField: "_id",
    as: "author"
  },
},
{ $project: { user: 0, "author.password": 0, "author.cover": 0 } },
]).toArray()

res.status(200).json({"data":data})
  }
 catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.post("/chat/:id",async(req,res)=>{

const messege = db.collection("messege")

const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }
    
    try{

        replay = req.body.replay

        if (req.body.replay != null && req.body.replay != "null") {

            replay = new ObjectId(req.body.replay)
           
          } else {
            replay = null
          }
      

  data =  await messege.insertOne({
        
    "paragraph":req.body.paragraph,
     "user":new ObjectId(req.user.id),
      "time":Date.now(),
      "img": {
        "url": null,
        "publicid": null,
        "originalname": null,
      },
      "chatid":new ObjectId(req.params.id),
      "replay":replay,
      "type":"chat",
      "conntent":"paragraph",
      "userseen":[new ObjectId(req.user.id)]
        })

   res.status(200).json({"messegeid":data.insertedId})

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})



module.exports = router;
