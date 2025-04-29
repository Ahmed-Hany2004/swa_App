const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_Multiple_uplod,cloud_uplod, cloud_remove } = require("../cloud")
const { upload } = require("../multerfunction")
const path = require("path")
const fs = require("fs");
const { object } = require("joi");



const router = express.Router()

router.get("/",async(req,res)=>{

  const page = db.collection("page")

  try{
    search = req.query.search || null

    data = await page.findOne({"pagename":{ $regex: search, $options: "i"}})

    res.status(200).json({"data":data})

  }
catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }
})

router.get("/:id",async(req,res)=>{
    
  const page = db.collection("page")

  try{

   data = await page.findOne({"_id":new ObjectId(req.params.id)})

  res.status(200).json({"data":data})

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})


router.post("/create",async(req , res)=>{

 const page = db.collection("page")


 const token = req.headers.token
   req.user = null;
 
   if (token) {
     data = jwt.verify(token, process.env.secritkey)
     req.user = data
   } else {
     return res.status(400).json({ message: "you not login " })
   }

   try{

    newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

    if(newpage){

    return res.status(400).json({messege: "You already have a page"})
    }

    info = req.body.info ||{}
 data =  await page.insertOne({
    "pagename":req.body.pagename,
    "owner": new ObjectId(req.user.id),
    "img": {
        "url": null,
        "publicid": null,
        "originalname": null,
      },
      "cover": {
        "url": null,
        "publicid": null,
        "originalname": null,
      },
      "followers":0,
      "category":[],
      "info":info,
      "creationDate": Date.now()
   })

   res.status(200).json({"pageid": data.insertedId })
   }
   catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})


router.put("/data",async(req,res)=>{

  const token = req.headers.token
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey)
    req.user = data
  } else {
    return res.status(400).json({ message: "you not login " })
  }


  try{

    newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

    if(newpage){
    return res.status(400).json({messege: "You already have a page"})
    }

    await page.updateOne({"_id": new ObjectId(newpage._id)},{$set:{
      "pagename":req.body.pagename,
      "info":req.body.info,
    }})

    res.status(200).json({ message: "page updated" })
    
  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }

})

router.post("/img", upload.single("img"),async(req,res)=>{

    const page =db.collection("page")

    const token = req.headers.token
    req.user = null;
  
    if (token) {
      data = jwt.verify(token, process.env.secritkey)
      req.user = data
    } else {
      return res.status(400).json({ message: "you not login " })
    }


    try{

        newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

        if(!newpage){
    
        return res.status(400).json({messege: "You are not the owner"})
        }

        if (!req.file) {
            return res.status(403).json({ message: "you not send img" })
      
          }

           const pathimge = path.join(__dirname, "../upload/" + req.file.originalname)

            if (newpage.img.originalname == req.file.originalname) {
                 fs.unlinkSync(pathimge)
           
                 return res.status(200).json({ message: "upload img Succeed 1" })
               }

               result = await cloud_uplod(pathimge)

               if (newpage.img.publicid !== null) {
                 cloud_remove(newpage.img.publicid)
               }

               await page.updateOne({ "_id": new ObjectId(newpage._id) }, {
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


    }catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
  }


})


router.post("/cover",upload.single("img") ,async(req,res)=>{
   
    const page =db.collection("page")

    const token = req.headers.token
    req.user = null;
  
    if (token) {
      data = jwt.verify(token, process.env.secritkey)
      req.user = data
    } else {
      return res.status(400).json({ message: "you not login " })
    }
    
    try{

        newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

        if(!newpage){
    
        return res.status(400).json({messege: "You are not the owner"})
        }

        if (!req.file) {
            return res.status(403).json({ message: "you not send img" })
      
          }

          const pathimge = path.join(__dirname, "../upload/" + req.file.originalname)

          if (newpage.cover.originalname == req.file.originalname) {
            fs.unlinkSync(pathimge)
      
            return res.status(200).json({ message: "upload img Succeed 1" })
          }

    result = await cloud_uplod(pathimge)
    if (newpage.cover.publicid !== null) {
        cloud_remove(test.cover.publicid)
      }

      await page.updateOne({ "_id": new ObjectId(newpage._id) }, {
        $set: {
          "cover": {
            "url": result.secure_url,
            "publicid": result.public_id,
            "originalname": req.file.originalname,
          }
        }
      })
      fs.unlinkSync(pathimge)
      res.status(200).json({ message: "upload cover Succeed", })
    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
      }
})

router.delete("/img",async(req,res)=>{

    const page =db.collection("page")

    const token = req.headers.token
    req.user = null;

    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {
        return res.status(400).json({ message: "you not login " })
      }

      try{

        newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

        if(!newpage){
    
        return res.status(400).json({messege: "You are not the owner"})
        }

        cloud_remove(newpage.img.publicid)


        await page.updateOne({ "_id": new ObjectId(newpage._id) }, {
          $set: {
            "img": {
              "url": null,
              "publicid": null,
              "originalname": null,
            }
          }
        })

        res.status(200).json({ "message": "img delete" })

      }
      catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
      }

})


router.delete("/cover",async(req,res)=>{

    const page =db.collection("page")

    const token = req.headers.token
    req.user = null;

    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {
        return res.status(400).json({ message: "you not login " })
      }

      try{

        newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

        if(!newpage){
    
        return res.status(400).json({messege: "You are not the owner"})
        }

        cloud_remove(newpage.cover.publicid)


        await page.updateOne({ "_id": new ObjectId(newpage._id) }, {
          $set: {
            "cover": {
              "url": null,
              "publicid": null,
              "originalname": null,
            }
          }
        })

        res.status(200).json({ "message": "cover delete" })

      }
      catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
      }
})

router.get("/page/:id",async(req,res)=>{

  const post = db.collection("post")

  const page = req.query.page ||1;
    const limit = Number(req.query.limit)||5;
  
    const token = req.headers.token
    req.user = null;
  
  
    if (token) {
      data = jwt.verify(token, process.env.secritkey)
      req.user = data
    }

    try{

      z = await post.find({"pageId": new ObjectId(req.params.id) }).toArray()

    f = z.length;

    last_page = Math.ceil(f / limit);

    data = x = await post.aggregate([

      { $match: { "pageId": new ObjectId(req.params.id) } },
      { $sort: { data: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
      {
        $lookup:
        {
          from: "page",
          localField: "pageId",
          foreignField: "_id",
          as: "page"
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

router.post("/create/post",async(req,res)=>{

  const page =db.collection("page")
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

      newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

      if(!newpage){
  
      return res.status(400).json({messege: "You are not the owner"})
      }

      data = await post.insertOne({

        "link": req.body.link,
        "hastags": req.body.hastags,
        "mentions": req.body.mentions,
        "paragraph": req.body.paragraph,
        "reactCount": 0,
        "reacts": {
        },
        "commentCount": 0,
        "pageId": new ObjectId(newpage._id),
        "data": Date.now(),
        "img": [],
      })
  
      res.status(200).json({ messege: "post created Succeed","postId":data.insertedId })

    }
    catch (err) {
      console.log("=========>" + err);
      res.status(500).send("err in " + err)
    }


})



router.post("/post/img/:id",upload.array("imgs"),async(req,res)=>{

  const page =db.collection("page")
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
    
      newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

      if(!newpage){
  
      return res.status(400).json({messege: "You are not the owner"})
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


router.put("/update/:id",async(req,res)=>{x

  const page =db.collection("page")
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

      newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

      if(!newpage){
  
      return res.status(400).json({messege: "You are not the owner"})
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


router.put("/pull/img/:id",async(req,res)=>{

  const page =db.collection("page")
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
   
      newpage = await page.findOne({"owner":new ObjectId(req.user.id)})

      if(!newpage){
  
      return res.status(400).json({messege: "You are not the owner"})
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



router.get("/:id/category",async(req,res)=>{

  const page =db.collection("page")

    try{

      data = await page.findOne({"_id":new ObjectId(req.params.id)},{ projection: { category: 1 } })

      res.status(200).json({"data":data})

    }
    catch (err) {
      console.log("=========>" + err);
      res.status(500).send("err in " + err)
    }
})



router.put("/category",async(req,res)=>{
  const page =db.collection("page")

  const token = req.headers.token
  req.user = null;

  if (token) {
      data = jwt.verify(token, process.env.secritkey)
      req.user = data
    } else {
      return res.status(400).json({ message: "you not login " })
    }

    try{

     livepage = await page.findOne({"owner":new ObjectId(req.user.id) })

      if(!livepage){
   
        return res.status(400).json({messege: "You are not the owner"})
      }

      await page.updateOne({"_id":new ObjectId(livepage._id)},{$set:{

        "category":req.body.category
      }})

      res.status(200).json({messege:"category updated"})

    }
    catch (err) {
      console.log("=========>" + err);
      res.status(500).send("err in " + err)
    }
  
})




module.exports = router;