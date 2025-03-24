const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const {cloud_Multiple_uplod,cloud_remove} =require("../cloud")
const {upload} =require("../multerfunction")
const path = require("path")
const fs = require("fs");




const router = express.Router()



router.post("/:id",async(req,res)=>{

const comment = db.collection("comment")


const token = req.headers.token
req.user = null;

if (token) {
  data = jwt.verify(token, process.env.secritkey)
  req.user = data
} else {                        
  return res.status(400).json({ message: "you not login " })
}

replay = req.body.replay

if(req.body.replay != null && req.body.replay != "null" ){

    replay = new ObjectId(req.body.replay)
}else{
    replay =null
}

try{

    await comment.insertOne({
        "time":Date.now(),
        "postid":new ObjectId(req.params.id),
        "paragraph":req.body.paragraph,
        "user":new ObjectId(req.user.id),
        "replay":replay

    })

    res.status(200).json({ messege: "comment created Succeed" })

}catch (err) {
  console.log("=========>" + err);
  res.status(500).send("err in " + err)
}

})



router.put("/:id",async(req,res)=>{

    const comment = db.collection("comment")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {                        
        return res.status(400).json({ message: "you not login " })
      }


      try{
    
      newComment = await comment.findOne({"_id":new ObjectId(req.params.id)})

      if(!newComment){

        return res.status(400).json({messege:"dont find this comment"})
      }

      if(newComment.user != req.user.id){

        return  res.status(400).json({message:"dont allowed"})        
      }

      await comment.updateOne({"_id":new ObjectId(req.params.id)},{$set:{
        "paragraph":req.body.paragraph
      }

      })

    res.status(200).json({messege:"comment updated"})

      }catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
      }
})



router.delete("/:id",async(req,res)=>{

    const comment = db.collection("comment")  

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {                        
        return res.status(400).json({ message: "you not login " })
      }

      try{

        newComment = await comment.findOne({"_id":new ObjectId(req.params.id)})

        if(!newComment){

            return res.status(400).json({messege:"dont find this comment"})
          }
    
          if(newComment.user != req.user.id){
    
            return  res.status(400).json({message:"dont allowed"})        
          }

       
         await comment.deleteOne({"_id":new ObjectId(req.params.id)})

        res.status(200).json({message:"comment deleted"})

      }
      catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
      }
})

module.exports = router;