const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");



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


router.get("/", async (req, res) => {

    const story = db.collection("story")

    try {

        data = await story.aggregate([
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: "$user",
                    user: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$user" } },
            {
                $lookup: {
                    from: "user",
                    localField: "user",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $project: { "author.password": 0, "author.cover": 0 } },
        ]).toArray()


        res.status(200).json({ "data": data })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})

router.get("/user/:id", async (req, res) => {

    const story = db.collection("story")

    try {
        data = await story.aggregate([
            { $match: { "user": new ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: "user",
                    localField: "user",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $project: { "author.password": 0, "author.cover": 0 } },
        ]).toArray()

        res.status(200).json({ "data": data })
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
            "img": [],
            "info": info,
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


router.post("/:id/img", upload.array("imgs"), async (req, res) => {

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

        const uploder = async (path) => await cloud_Multiple_uplod(path, "imges")

        const urls = []

        const files = req.files


        for (const file of files) {

            const { path, originalname } = file

            const newpath = await uploder(path)

            urls.push({ newpath, originalname })

            fs.unlinkSync(path)
        }

        await story.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $push: {
                "img": { $each: urls }
            }
        })

        res.status(200).json({ message: "upload img Succeed", })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.put("/:id/pull/img", async (req, res) => {

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
        await story.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $pull: {
                "img.newpath": { "publicid": req.body.publicid } // publicid

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


router.put("/:id", async (req, res) => {

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


        await story.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $set: {
                "info": info
            }
        })

        res.status(200).json({ "message": "story updated" })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.delete("/:id", async (req, res) => {

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

        if (livestory.img.publicid != null) {

            cloud_remove(livestory.img.publicid)
        }

        await story.deleteOne({ "_id": new ObjectId(req.params.id) })

        res.status(200).json({ "message": "story  deleted" })

    } catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})

module.exports = router;