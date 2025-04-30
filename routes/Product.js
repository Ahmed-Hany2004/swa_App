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

    const departement = req.query.departement||null
    min = Number(req.query.min)|| 0
    max = Number(req.query.max)|| 10000000000000000000000
    limit = Number(req.query.limit)|| 10
     page = (Number(req.query.page) || 1) - 1;  
     name = req.query.name ||null
    try {
        
        let matchStage = {};

        if(name){
            matchStage.name = { $regex: name, $options: 'i' }; 
        }

        if (departement) {
          matchStage.departement = { $regex: departement, $options: 'i' };
        }
    
        if (min && max) {
            matchStage.Price = { $gte: min, $lte: max };
          } else if (min) {
            matchStage.Price = { $gte: min };
          } else if (max) {
            matchStage.Price = { $lte: max };
          }
         pipeline = [];
        
    
        
        
           pipeline = [
          
            { $match: matchStage },
        
            {
                $lookup: {
                  from: 'page',  
                  localField: 'pageid',
                  foreignField: '_id',  
                  as: 'pageDetails'  
                }
              },
            {
              $facet: {
               
                products: [
                  { $skip: page * limit },
                  { $limit: limit }
                ],
               
                maxPrice: [
                  { $group: { _id: null, maxPrice: { $max: "$Price" } } }
                ],
                totalCount: [
                    { $count: "count" }
                  ]
              }
            }
          ];
        
        
          const result = await Product.aggregate(pipeline).toArray()
        
          
          const data = result[0].products;
          const highestPrice = result[0].maxPrice.length > 0 ? result[0].maxPrice[0].maxPrice : 0;
          const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
        
          const lastPage = Math.ceil(totalCount / limit);

          res.status(200).json({
            data: data,         
            highestPrice: highestPrice ,
            lastPage: lastPage  ,
            totalCount:totalCount
          });

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})


router.get("/page/:id",async(req,res)=>{

    const Product = db.collection("Product")

     category = req.query.category||null
    min = Number(req.query.min)|| 0
    max = Number(req.query.max)|| 10000000000000000000000
    limit = Number(req.query.limit)|| 10
     page = (Number(req.query.page) || 1) - 1;  
     name = req.query.name ||null
     availability = req.query.availability 

     try{

        let matchStage = {
            "pageid": new ObjectId(req.params.id)
        };

        if(name){

            matchStage.name = { $regex: name, $options: 'i' };
        }

        if (category) {

             category= category.split(',')
            matchStage.category= { $in: category };
        }

        if (min && max) {
            matchStage.Price = { $gte: min, $lte: max };
          } else if (min) {
            matchStage.Price = { $gte: min };
          } else if (max) {
            matchStage.Price = { $lte: max };
          }

          if(availability == "stock"){
            matchStage.stock = {$gte: 1}
          }
          else if(availability == "notstock"){
            matchStage.stock = {$eq: 0}
          }

          pipeline = [];
        
    
        
        
          pipeline = [
         
           { $match: matchStage },
       
           {
               $lookup: {
                 from: 'page',  
                 localField: 'pageid',
                 foreignField: '_id',  
                 as: 'pageDetails'  
               }
             },
           {
             $facet: {
              
               products: [
                 { $skip: page * limit },
                 { $limit: limit }
               ],
              
               maxPrice: [
                 { $group: { _id: null, maxPrice: { $max: "$Price" } } }
               ],
               totalCount: [
                   { $count: "count" }
                 ]
             }
           }
         ];
       
       
         const result = await Product.aggregate(pipeline).toArray()
       
         
         const data = result[0].products;
         const highestPrice = result[0].maxPrice.length > 0 ? result[0].maxPrice[0].maxPrice : 0;
         const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
       
         const lastPage = Math.ceil(totalCount / limit);

         res.status(200).json({
           data: data,         
           highestPrice: highestPrice ,
           lastPage: lastPage  ,
           totalCount:totalCount
         });


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
            "departement": req.body.departement,
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