const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");


const router = express.Router()


router.get("/all", async (req, res) => {

    const Product = db.collection("Product")

    try {

        const pipeline = [];


if (search) {
  pipeline.push({
    $match: {
      $or: [
        { "name": { $regex: search, $options: "i" } },
        { "category": { $regex: search, $options: "i" } },
        { "type": { $regex: search, $options: "i" } },
        { "details": { $regex: search, $options: "i" } },
        { "about": { $regex: search, $options: "i" } },
      ]
    }
  });
}


if (type) {
  pipeline.push({
    $match: {
      "type": { $in: type.split(',') }
    }
  });
}


if (category) {
  pipeline.push({
    $match: {
      "category": { $in: category.split(',') }
    }
  });
}

if (name) {
  pipeline.push({
    $match: {
      "name": { $in: name.split(',') }
    }
  });
}


if (sale) {
  pipeline.push({
    $match: {
      "sale": { $in: sale.split(',') }
    }
  });
}


if (stock) {
  pipeline.push({
    $match: {
      "stock": { $in: stock.split(',') }
    }
  });
}


if (minPrice && maxPrice) {
  pipeline.push({
    $match: {
      "Price": { $gte: minPrice, $lte: maxPrice }
    }
  });
}


const sortByPrice = req.query.sortPrice || null;  
const sortByName = req.query.sortName || null;   

if (sortByPrice) {
  pipeline.push({
    $sort: {
      "Price": sortByPrice === 'asc' ? 1 : -1  
    }
  });
}

if (sortByName) {
  pipeline.push({
    $sort: {
      "name": sortByName === 'asc' ? 1 : -1  
    }
  });
}


if (limit) {
  pipeline.push({
    $limit: limit
  });
}

if (page >= 0) {
  pipeline.push({
    $skip: page * limit
  });
}


    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})




router.get("/:id", async (req, res) => {

    const Product = db.collection("Product")

    try {

        data = await Product.findOne({ "_id": new ObjectId(req.params.id) })

        res.status(200).json({ "data": data })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})

router.post("/create/page/:id", async (req, res) => {

    const Product = db.collection("Product")
    const page = db.collection("page")

    const token = req.headers.token
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }


    try {

        owner = await page.findOne({ "owner": new ObjectId(req.user.id) })

        if (!owner) {
            return res.status(400).json({ messege: "not owner" })
        }


        newproduct = await Product.insertOne({
            "type": req.body.type,
            "category": req.body.category,
            "name": req.body.name,
            "Price": req.body.Price,
            "sale": req.body.sale,
            "stock": req.body.stock,
            "img": [],
            "details": req.body.details,
            "about": req.body.about,
            "pageid": new ObjectId(req.params.id)
        })


        res.status(200).json({ "productid": newproduct.insertedId })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }


})


router.post("/:id/img", upload.array("imgs"), async (req, res) => {

    const Product = db.collection("Product")
    const page = db.collection("page")

    const token = req.headers.token
    pageid = req.headers.pageid
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try {

        owner = await page.findOne({ "owner": new ObjectId(req.user.id) })

        if (owner._id != pageid) {

            return res.status(400).json({ messege: "not owner" })
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


        await Product.updateOne({ "_id": new ObjectId(req.params.id) }, {
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


router.put("/:id/pull/img", async (req, res) => {

    const Product = db.collection("Product")
    const page = db.collection("page")

    const token = req.headers.token
    pageid = req.headers.pageid
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }
    try {

        owner = await page.findOne({ "owner": new ObjectId(req.user.id) })

        if (owner._id != pageid) {

            return res.status(400).json({ messege: "not owner" })
        }

        await Product.updateOne({ "_id": new ObjectId(req.params.id) }, {
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


router.put("/:id/data", async (req, res) => {

    const Product = db.collection("Product")
    const page = db.collection("page")

    const token = req.headers.token
    pageid = req.headers.pageid
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try {

        owner = await page.findOne({ "owner": new ObjectId(req.user.id) })
        ownerproduct = await Product.findOne({ "_id": new ObjectId(req.params.id) })


        if (owner._id.toString() != ownerproduct.pageid.toString()) {

            return res.status(400).json({ messege: "not owner" })
        }

        await Product.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $set: {
                "type": req.body.type,
                "category": req.body.category,
                "name": req.body.name,
                "Price": req.body.Price,
                "sale": req.body.sale,
                "stock": req.body.stock,
                "details": req.body.details,
                "about": req.body.about,
            }
        })

        res.status(200).json({ message: "Product updated" })


    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }


})

router.delete("/:id", async (req, res) => {

    const Product = db.collection("Product")
    const page = db.collection("page")

    const token = req.headers.token
    pageid = req.headers.pageid
    req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
    } else {
        return res.status(400).json({ messege: "login frist" })
    }

    try {

        owner = await page.findOne({ "owner": new ObjectId(req.user.id) })
        ownerproduct = await Product.findOne({ "_id": new ObjectId(req.params.id) })


        if (owner._id.toString() != ownerproduct.pageid.toString()) {

            return res.status(400).json({ messege: "not owner" })
        }

        await Product.deleteOne({ "_id": new ObjectId(req.params.id) })

        res.status(200).json({ message: "product deleted" })

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})

module.exports = router;