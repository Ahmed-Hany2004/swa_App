const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const {cloud_uplod,cloud_remove} =require("../cloud")
const {upload} =require("../multerfunction")
const path = require("path")
const fs = require("fs");



const router = express.Router()

//get all user
router.get("/", async (req, res) => {

    user = db.collection("user")

    try {
 
        data = await user.find({}).toArray()

        res.status(200).json({data : data})

    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})
 

//get one user by id
router.get("/:id", async(req,res)=>{

    user =db.collection("user")
    
    try{
  
  
      data =  await user.findOne({"_id": new ObjectId(req.params.id)}) 

      if(!data){

      return  res.status(400).json({"message": "dont find this user"})
      }

     
      
      res.status(200).json({"data": data})
    
    }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }
})


//Create new user
router.post("/Create",async(req,res)=>{

  user = db.collection("user")
  try{

    chuk_user = await user.findOne({"email":req.body.email}) 

    if(chuk_user){

        return res.status(400).json({"message": "This email is already used"})
    }

    data = await user.insertOne({

       "fristname":req.body.fristname,
       "lastname":req.body.lastname,
       "email":req.body.email,
       "password":req.body.password,
       "phone":req.body.phone,
       "brithdate":req.body.brithdate,
       "bio":req.body.bio,
       "cover":{
        "url": null,
        "publicid": null,
        "originalname": null,
      },
       "img":{
        "url": null,
        "publicid": null,
        "originalname": null,
      }
    })

    const token = jwt.sign({ id: data.insertedId }, process.env.secritkey);

    res.status(200).json({"userId":data.insertedId,
        "token":token
    })

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
}

})


//user login
router.post("/login",async(req,res)=>{
        
  user = db.collection("user")
  try{

    test = await user.findOne({ "email": req.body.email })


    if (test) {
        if (test.password == req.body.password) {
          const token = jwt.sign({ id: test._id, }, process.env.secritkey);
  
         
          res.status(200).json({ message: "Sign in Succeed", test, token })
        }
        else {
          res.status(400).json({ message: "invalid user name or pass" })
        }
      }
      else {
        res.status(400).json({ message: "invalid user name or pass" })
      }
  

  }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
}
})



//update user data
router.put("/:id",async(req,res)=>{

    user = db.collection("user")

    try{

        
        
    await user.updateOne({"_id":new ObjectId(req.params.id)},{$set:{
        "fristname":req.body.fristname,
       "lastname":req.body.lastname,
       "email":req.body.email,
       "password":req.body.password,
       "phone":req.body.phone,
       "brithdate":req.body.brithdate
    }}
    )
    

    res.status(200).json({"message":"user updated"})
    }
  catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err)
}

})


//uplod img or cover
router.post("/img/:id",upload.single("img"),async(req,res)=>{

    user = db.collection("user")

    try{


            if (!req.file) {
                return res.status(403).json({ message: "you not send img" })
        
              }

              test = await user.findOne({ "_id": new ObjectId(req.params.id) })

              const pathimge = path.join(__dirname, "../upload/" + req.file.originalname) 

              if (test.img.originalname == req.file.originalname) {
                fs.unlinkSync(pathimge)
        
                return res.status(200).json({ message: "upload img Succeed 1" })
              }

              result = await cloud_uplod(pathimge)

              if (test.img.publicid !== null) {
                cloud_remove(test.img.publicid)
              }
              

              await user.updateOne({ "_id": new ObjectId(req.params.id) }, {
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


router.post("/cover/:id",upload.single("img"),async(req,res)=>{

    user = db.collection("user")

    try{


            if (!req.file) {
                return res.status(403).json({ message: "you not send img" })
        
              }

              test = await user.findOne({ "_id": new ObjectId(req.params.id) })

              const pathimge = path.join(__dirname, "../upload/" + req.file.originalname) 

              if (test.cover.originalname == req.file.originalname) {
                fs.unlinkSync(pathimge)
        
                return res.status(200).json({ message: "upload img Succeed 1" })
              }

              result = await cloud_uplod(pathimge)

              if (test.cover.publicid !== null) {
                cloud_remove(test.cover.publicid)
              }
              

              await user.updateOne({ "_id": new ObjectId(req.params.id) }, {
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


router.delete("/img/:id",async(req,res)=>{

    user = db.collection("user")

    const token = req.headers.token
  req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {
        return res.status(400).json({ messege: "yor are not allaowed " })
      }

    try{
    
        const test = await user.findOne({ "_id": new ObjectId(req.params.id) })

        if (req.user.id != test._id) {
          return res.status(403).json({ message: "yor are not allaowed" })
        }


        cloud_remove(test.img.publicid)


        await user.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $set: {
              "img": {
                "url": null,
                "publicid": null,
                "originalname": null,
              }
            }
          })
        
          res.status(200).json({"message":"img delete"})
    
     }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})



router.delete("/cover/:id",async(req,res)=>{

    user = db.collection("user")

    const token = req.headers.token
  req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {
        return res.status(400).json({ messege: "yor are not allaowed " })
      }

    try{
    
        const test = await user.findOne({ "_id": new ObjectId(req.params.id) })

        if (req.user.id != test._id) {
          return res.status(403).json({ message: "yor are not allaowed" })
        }


        cloud_remove(test.cover.publicid)


        await user.updateOne({ "_id": new ObjectId(req.params.id) }, {
            $set: {
              "cover": {
                "url": null,
                "publicid": null,
                "originalname": null,
              }
            }
          })
        
          res.status(200).json({"message":"cover delete"})
    
     }
    catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})



router.delete("/:id",async(req,res)=>{
  
    user = db.collection("user")

    const token = req.headers.token
  req.user = null;


    if (token) {
        data = jwt.verify(token, process.env.secritkey)
        req.user = data
      } else {
        return res.status(400).json({ messege: "yor are not allaowed " })
      }

      try{

        const test = await user.findOne({ "_id": new ObjectId(req.params.id) })

        if (req.user.id != test._id) {
            return res.status(403).json({ message: "yor are not allaowed" })
          }
  
          if(test.cover.publicid != null){
            cloud_remove(test.cover.publicid)
          }
  
       if(test.img.publicid != null){

        cloud_remove(test.img.publicid)
       }

       await user.deleteOne({"_id":new ObjectId(req.params.id)})

       res.status(200).json({message:"user deleted"})
          
    }
      catch (err) {
        console.log("=========>" + err);
        res.status(500).send("err in " + err)
    }

})



module.exports = router;