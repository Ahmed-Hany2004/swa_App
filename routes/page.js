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
   })

   res.status(200).json({"pageid": data.insertedId })
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
      res.status(200).json({ message: "upload img Succeed", })
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






module.exports = router;