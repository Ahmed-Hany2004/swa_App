const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const {cloud_Multiple_uplod,cloud_remove} =require("../cloud")
const {upload} =require("../multerfunction")
const path = require("path")
const fs = require("fs");




const router = express.Router()


router.get("/",async(req,res)=>{


    const post = db.collection("post")
    const page = req.query.page;
    const limit = Number(req.query.limit);

    try{

      z = await post.find({}).toArray()

      f = z.length;

      last_page =  Math.ceil(f/limit);


      data =  x = await post.aggregate([
        { $sort: { data: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: Number(limit) },
        {
           $lookup:
           {
              from: "user",
              localField: "user",
              foreignField: "_id",
              as: "author"
           },
        },
        { $project: {  user: 0, "author.pass": 0, "author.cover": 0 } },


     ]).toArray()

      res.status(200).json({"data":data, last_page:last_page})

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})



router.post("/",async(req,res)=>{

    const post = db.collection("post")

        const token = req.headers.token
      req.user = null;
    
    
        if (token) {
            data = jwt.verify(token, process.env.secritkey)
            req.user = data
          } else {
            return res.status(400).json({ messege: "yor are not allaowed " })
          }

    try{


        data = await post.insertOne({

            "link":req.body.link,
            "hastags":req.body.hastags,
            "mentions":req.body.mentions,
            "paragraph":req.body.paragraph,
            "reactCount":0,
            "reacts":{
             "love":0,
             "sad":0,
             "angry":0,
             "prayer":0,
             "haha":0,
            },
            "commentCount":0,
            "user":new ObjectId(req.user.id),
            "data": Date.now(),
            "img":[],
        })

        res.status(200).json({ messege: "post created Succeed" })

    }catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }


})


router.post("/img/:id",upload.array("imgs"),async(req,res)=>{

   const post = db.collection("post")

   const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {                        
    return res.status(400).json({ message: "you not login " })
  }


   try{

    newpost = await post.findOne({"_id":new ObjectId(req.params.id)})

    if(!newpost){
    return  res.status(400).json({"message":"dont find this post"})
    }

    if(req.user.id != newpost.user){

      return  res.status(400).json({message:"dont allowed"})
    }

    const uploder = async (path) => await cloud_Multiple_uplod(path, "imges")

    const urls = []

    const files = req.files


    for (const file of files) {

      const { path } = file

      const newpath = await uploder(path)

      urls.push(newpath)

      fs.unlinkSync(path)
    }

    await post.updateOne({ "_id": new ObjectId(req.params.id) }, {
      $push: {
        "img": { $each: urls }
      }
    })

    res.status(200).json("upload img Succeed")



   }
catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})



router.put("/:id",async(req,res)=>{

  const post = db.collection("post")

  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {                        
    return res.status(400).json({ message: "you not login " })
  }

try{

  newpost = await post.findOne({"_id":new ObjectId(req.params.id)})

  if(!newpost){
  return  res.status(400).json({"message":"dont find this post"})
  }

  if(req.user.id != newpost.user){

    return  res.status(400).json({message:"dont allowed"})
  }


  await post.updateOne({"_id":new ObjectId(req.params.id)},{$set:{
   
    "link":req.body.link,
    "hastags":req.body.hastags,
    "mentions":req.body.mentions,
    "paragraph":req.body.paragraph,

  }})


  res.status(200).json({message: "post updated"})

}
catch (err) {
  console.log("=========>" + err);
  res.status(500).send("err in " + err)
}

})



router.put("/pull/img/:id",async(req,res)=>{

const post =  db.collection("post")


const token = req.headers.token
req.user = null;

if (token) {
  data = jwt.verify(token, process.env.secritkey)
  req.user = data
} else {                        
  return res.status(400).json({ message: "you not login " })
}


try{


  newpost = await post.findOne({"_id":new ObjectId(req.params.id)})

  if(!newpost){
  return  res.status(400).json({"message":"dont find this post"})
  }

  if(req.user.id != newpost.user){

    return  res.status(400).json({message:"dont allowed"})
  }


  await post.updateOne({ "_id": new ObjectId(req.params.id) }, {
    $pull: {
      "img": { "publicid": req.body.publicid } // publicid

    }
  })

  cloud_remove(req.body.publicid)
  
  res.status(200).json({message:"done"})
}
catch (err) {
  console.log("=========>" + err);
  res.status(500).send("err in " + err)
}

})


//react 

router.post("/react/:id",async(req,res)=>{

  const post =  db.collection("post")
  const react = db.collection("react")

  const token = req.headers.token
  req.user = null;
  islike = req.body.islike
  React = req.body.react
 

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {                        
    return res.status(400).json({ message: "you not login " })
  }


  try{



if(islike == true){
  
await react.insertOne({
  "userid":new ObjectId(req.user.id),
"react":req.body.react,
"postid":new ObjectId(req.params.id)
})

 await post.updateOne({"_id":new ObjectId(req.params.id)},{$inc:{[`reacts.${React}`]:+1}})
}
if(islike == false){
   await react.deleteOne({"userid":new ObjectId(req.user.id),"postid":new ObjectId(req.params.id)})
   await post.updateOne({"_id":new ObjectId(req.params.id)},{$inc:{[`reacts.${React}`]:-1}})
}


res.status(200).json({message:"done"})

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
  
  
})



module.exports = router;