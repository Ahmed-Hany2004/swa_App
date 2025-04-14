const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");
const { date } = require("joi");


const router = express.Router()


router.get("/index", async (req, res) => {

    const story = db.collection("story")

    try {


        story.createIndex({ "date": 1 }, { expireAfterSeconds: 86400 })

        res.status(200).json("done")

    } catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }


})


router.get("/",async(req,res)=>{

    const story = db.collection("story")

    try{

     data = await story.aggregate([
        {
            $lookup:{
          from:"user",
          localField:"user",
          foreignField: "_id",
          as: "author"
            } 
          },
          { $project: {  "author.password": 0, "author.cover": 0 } },
     ]).toArray()


     res.status(200).json({"data":data})

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})

router.post("/", async (req, res) => {

    const story = db.collection("story")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    info = req.body.info || {}

    try {

        data = await story.insertOne({
            "img":[],
            "info":info,
            "paragraph": req.body.paragraph,
            "date": new Date(),
            "user": new ObjectId(req.user.id)
        })


        res.status(200).json({ messege: "post created Succeed", "storyId": data.insertedId })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})


router.post("/:id/img", upload.single("img"), async (req, res) => {

    const story = db.collection("story")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try {

        livestory = await story.findOne({ "_id": new ObjectId(req.params.id) })

        if (!livestory) {

            return res.status(400).json({ "message": "dont find this story" })
        }

        if (req.user.id != livestory.user) {

            return res.status(400).json({ message: "dont allowed" })
        }

        if (!req.file) {
            return res.status(403).json({ message: "you not send img" })

        }
        const pathimge = path.join(__dirname, "../upload/" + req.file.originalname)

        if (livestory.img.originalname == req.file.originalname) {
            fs.unlinkSync(pathimge)

            return res.status(200).json({ message: "upload img Succeed 1" })
        }

        result = await cloud_uplod(pathimge)

        if (livestory.img.publicid !== null) {
            cloud_remove(livestory.img.publicid)
        }

        await story.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $set: {
                "img": {
                    "url": result.secure_url,
                    "publicid": result.public_id,
                    "originalname": req.file.originalname,
                }
            }
        })

        fs.unlinkSync(pathimge)

        res.status(200).json({ message: "upload img Succeed", })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.put("/:id",async(req,res)=>{

    const story = db.collection("story")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try{

        livestory = await story.findOne({ "_id": new ObjectId(req.params.id) })

        if (!livestory) {

            return res.status(400).json({ "message": "dont find this story" })
        }

        if (req.user.id != livestory.user) {

            return res.status(400).json({ message: "dont allowed" })
        }


        await story.updateOne({"_id":new ObjectId(req.params.id)},{$set:{
            "paragraph":req.body.paragraph
        }})

        res.status(200).json({"message": "story updated"})

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.delete("/:id",async(req,res)=>{

    const story = db.collection("story")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try{

        livestory = await story.findOne({ "_id": new ObjectId(req.params.id) })

        if (!livestory) {

            return res.status(400).json({ "message": "dont find this story" })
        }

        if (req.user.id != livestory.user) {

            return res.status(400).json({ message: "dont allowed" })
        }

        if(livestory.img.publicid != null){

            cloud_remove(livestory.img.publicid )
        }

        await story.deleteOne({"_id":new ObjectId(req.params.id)})

        res.status(200).json({"message": "story  deleted"})

    }catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})

module.exports = router;