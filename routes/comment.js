const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");
const { object } = require("joi");




const router = express.Router()


router.get("/post/:id", async (req, res) => {

  const comment = db.collection("comment")

  const page = req.query.page || 1;
  const limit = Number(req.query.limit) || 5;

  try {
    const totalComments = await comment.countDocuments({
      "postid": new ObjectId(req.params.id),
      "replay": null
    });


    const last_page = Math.ceil(totalComments / limit);


    data = await comment.aggregate([
      { $match: { "postid": new ObjectId(req.params.id), "replay": null } },
      { $sort: { time: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "user",
          localField: "user",
          foreignField: "_id",
          as: "author"
        }
      },
      { $project: { user: 0, "author.password": 0, "author.cover": 0 } },

    ]).toArray();

    res.status(200).json({ "data": data, "last_page": last_page })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})




router.get("/post/:z/replay/:x", async (req, res) => {
  const comment = db.collection("comment")



  try {
    data = await comment.aggregate([
      { $match: { "postid": new ObjectId(req.params.z), "replay": new ObjectId(req.params.x) } },
      { $sort: { time: -1 } },
      {
        $lookup: {
          from: "user",
          localField: "user",
          foreignField: "_id",
          as: "author"
        }
      },
      { $project: { user: 0, "author.password": 0, "author.cover": 0 } },

    ]).toArray();

    res.status(200).json({ "data": data, })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})


router.post("/:id", async (req, res) => {

  const comment = db.collection("comment")
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

    replay = req.body.replay
    seeMore = false

    if (req.body.replay != null && req.body.replay != "null") {

      replay = new ObjectId(req.body.replay)
      await comment.updateOne({ "_id": new ObjectId(req.body.replay) }, {
        $set: {
          "seeMore": true
        }
      })
    } else {
      replay = null
    }

   newcomment = await comment.insertOne({
      "time": Date.now(),
      "postid": new ObjectId(req.params.id),
      "paragraph": req.body.paragraph,
      "user": new ObjectId(req.user.id),
      "seeMore":false,
      "replay": replay,
      
    }) 

    data = {
      "_id":newComment.insertedId,
      "time": Date.now(),
      "postid": new ObjectId(req.params.id),
      "paragraph": req.body.paragraph,
      "user": new ObjectId(req.user.id),
      "seeMore":false,
      "replay": replay,
      
    }
    await post.updateOne({"_id":new ObjectId(req.params.id)},{$inc:{
      "commentCount": +1
    }})



    res.status(200).json({ messege: "comment created Succeed","data":data })

  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})



router.put("/:id", async (req, res) => {

  const comment = db.collection("comment")

  const token = req.headers.token
  req.user = null;


  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }


  try {

    newComment = await comment.findOne({ "_id": new ObjectId(req.params.id) })

    if (!newComment) {

      return res.status(400).json({ messege: "dont find this comment" })
    }

    if (newComment.user != req.user.id) {

      return res.status(400).json({ message: "dont allowed" })
    }

    await comment.updateOne({ "_id": new ObjectId(req.params.id) }, {
      $set: {
        "paragraph": req.body.paragraph
      }

    })

    res.status(200).json({ messege: "comment updated" })

  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})



router.delete("/:id", async (req, res) => {

  const comment = db.collection("comment")
  const post = db .collection("post")

  const token = req.headers.token
  req.user = null;


  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }

  try {

    newComment = await comment.findOne({ "_id": new ObjectId(req.params.id) })
    newpost = await post.findOne({"_id":new ObjectId(newComment.postid)})

    if (!newComment) {

      return res.status(400).json({ messege: "dont find this comment" })
    }

    if (newComment.user == req.user.id || newpost.user == req.user.id) {
     
      await comment.deleteOne({ "_id": new ObjectId(req.params.id) })

    await post.updateOne({"_id":new ObjectId(newpost._id)},{$inc:{
      "commentCount":-1
    }})
      return res.status(200).json({ message: "comment deleted" })
      
    }

     res.status(400).json({ message: "dont allowed" })
     
    

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})

module.exports = router;