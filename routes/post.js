const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");




const router = express.Router()


router.get("/", async (req, res) => {


  const post = db.collection("post")
  const react = db.collection("react")
  const page = req.query.page||1;
  const limit = Number(req.query.limit)||5;

  const token = req.headers.token
  req.user = null;


  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  }

  try {

    z = await post.find({}).toArray()

    f = z.length;

    last_page = Math.ceil(f / limit);


    data = await post.aggregate([
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
      { $project: { user: 0, "author.password": 0, "author.cover": 0 } },
      {
        $lookup:{
          from: "page",
          localField: "pageId",
          foreignField: "_id",
          as: "page"
        },

      }
    ]).toArray()


    for(i=0 ; i<data.length; i++){

      if(data[i].page.length == 0){
 
        
        delete data[i].page
      }
      else if(data[i].author.length == 0){
        
        delete data[i].author
      }

    }

    if (!token) {
      res.status(200).json({ "data": data, last_page: last_page })
    }


    // for(i= 0 ; i <data.length ; i++ ){
 
    //  like = await react.findOne({"postid":new ObjectId(data[i]._id),"userid":new ObjectId(req.user.id)})

    // if(like){
    //   data[i]["userreact"] =like.react
    // }else{

    //   data[i]["userreact"] =null
  
    // }

    // }

    res.status(200).json({ "data": data, last_page: last_page })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})


router.get("/:id",async(req,res)=>{

  const post = db.collection("post")
  const react = db.collection("react")


  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  }

try{
 
  data = x = await post.aggregate([
    { $match: {"_id":new ObjectId(req.params.id)} },
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

  if(token){

    like = await react.findOne({"postid":new ObjectId(data._id),"userid":new ObjectId(req.user.id)})

    if(like){
      data["userreact"] =like.react
    }else{
  
      data["userreact"] =null
  
    }

  }

 



  res.status(200).json({ "data": data, })

}
catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})


router.get("/user/:id",async(req,res)=>{
 
  const post = db.collection("post")
  const react = db.collection("react")
  const page = req.query.page ||1;
  const limit = Number(req.query.limit)||5;

  const token = req.headers.token
  req.user = null;


  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  }

  try {

    z = await post.find({ "user": new ObjectId(req.params.id) }).toArray()

    f = z.length;

    last_page = Math.ceil(f / limit);


    data = x = await post.aggregate([

      { $match: { "user": new ObjectId(req.params.id) } },
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
      { $project: { user: 0, "author.password": 0, "author.cover": 0 } },


    ]).toArray()

    if (!token) {
      res.status(200).json({ "data": data, last_page: last_page })
    }


    for(i= 0 ; i <data.length ; i++ ){
 
     like = await react.findOne({"postid":new ObjectId(data[i]._id),"userid":new ObjectId(req.user.id)})

    if(like){
      data[i]["userreact"] =like.react
    }else{

      data[i]["userreact"] =null
  
    }

    }

    res.status(200).json({ "data": data, last_page: last_page })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})

router.get("/user/:id/imgs",async(req,res)=>{

  const post = db.collection("post")

  const token = req.headers.token
  req.user = null;

  const page = req.query.page||1;
  const limit = Number(req.query.limit)||5;

  try{

    z = await post.find({"user":new ObjectId(req.params.id),img: { $exists: true, $not: { $size: 0 } }}).toArray()

    f = z.length;

    last_page = Math.ceil(f / limit);

    data = await post.find({"user":new ObjectId(req.params.id),img: { $exists: true, $not: { $size: 0 } }}
    ,{ projection: { img: 1 } }).limit(Number(limit))
    .skip((page - 1) * limit)
    .toArray()

    res.status(200).json({data:data,last_page:last_page})

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})

router.post("/", async (req, res) => {

  const post = db.collection("post")

  const token = req.headers.token
  req.user = null;


  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ messege: "login frist" })
  }

  try {


    data = await post.insertOne({

      "link": req.body.link,
      "hastags": req.body.hastags,
      "mentions": req.body.mentions,
      "paragraph": req.body.paragraph,
      "reactCount": 0,
      "reacts": {},
      "commentCount": 0,
      "user": new ObjectId(req.user.id),
      "data": Date.now(),
      "img": [],
    })

    res.status(200).json({ messege: "post created Succeed","postId":data.insertedId })

  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }


})


router.post("/img/:id", upload.array("imgs"), async (req, res) => {

  const post = db.collection("post")

  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }


  try {

    newpost = await post.findOne({ "_id": new ObjectId(req.params.id) })

    if (!newpost) {
      return res.status(400).json({ "message": "dont find this post" })
    }

    if (req.user.id != newpost.user) {

      return res.status(400).json({ message: "dont allowed" })
    }

    const uploder = async (path) => await cloud_Multiple_uplod(path, "imges")

    const urls = []

    const files = req.files


    for (const file of files) {

      const { path , originalname } = file

      const newpath = await uploder(path)

      urls.push({newpath, originalname})

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



router.put("/:id", async (req, res) => {

  const post = db.collection("post")

  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }

  try {

    newpost = await post.findOne({ "_id": new ObjectId(req.params.id) })

    if (!newpost) {
      return res.status(400).json({ "message": "dont find this post" })
    }

    if (req.user.id != newpost.user) {

      return res.status(400).json({ message: "dont allowed" })
    }


    await post.updateOne({ "_id": new ObjectId(req.params.id) }, {
      $set: {

        "link": req.body.link,
        "hastags": req.body.hastags,
        "mentions": req.body.mentions,
        "paragraph": req.body.paragraph,

      }
    })


    res.status(200).json({ message: "post updated" })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})



router.put("/pull/img/:id", async (req, res) => {

  const post = db.collection("post")


  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }


  try {


    newpost = await post.findOne({ "_id": new ObjectId(req.params.id) })

    if (!newpost) {
      return res.status(400).json({ "message": "dont find this post" })
    }

    if (req.user.id != newpost.user) {

      return res.status(400).json({ message: "dont allowed" })
    }


    await post.updateOne({ "_id": new ObjectId(req.params.id) }, {
      $pull: {
        "img": { "newpath.publicid": req.body.publicid } // publicid

      }
    })

    cloud_remove(req.body.publicid)

    res.status(200).json({ message: "done" })
  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})


//react 

router.post("/react/:id", async (req, res) => {

  const post = db.collection("post")
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


  try {



    if (islike == true) {


     chack =  await react.findOne({"userid": new ObjectId(req.user.id),"postid": new ObjectId(req.params.id)})

     if(chack){
  
     await post.updateOne({"_id": new ObjectId(req.params.id)},{$inc:{[`reacts.${chack.react}`]:-1, "reactCount":-1}})
     await react.deleteOne({ "userid": new ObjectId(req.user.id), "postid": new ObjectId(req.params.id) })
     }

      await react.insertOne({
        "userid": new ObjectId(req.user.id),
        "react": req.body.react,
        "postid": new ObjectId(req.params.id)
      })

      await post.updateOne({ "_id": new ObjectId(req.params.id) }, { $inc: { [`reacts.${React}`]: +1,"reactCount":+1 } })
    }
    if (islike == false) {
      await react.deleteOne({ "userid": new ObjectId(req.user.id), "postid": new ObjectId(req.params.id) })
      await post.updateOne({ "_id": new ObjectId(req.params.id) }, { $inc: { [`reacts.${React}`]: -1,"reactCount":-1 } })
    }


    res.status(200).json({ message: "done" })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }


})



module.exports = router;