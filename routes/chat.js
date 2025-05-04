const express = require("express");
const { db } = require("../connection");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { cloud_uplod, cloud_remove } = require("../cloud");
const { upload } = require("../multerfunction");
const path = require("path");
const fs = require("fs");
const { object } = require("joi");

const router = express.Router();

router.get("/user", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    data = await chat
      .aggregate([
        {
          $match: {
            users: {
              $in: [new ObjectId(req.user.id)],
            },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "users",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            userDetails: {
              password: 0,
              cover: 0,
            },
          },
        },
      ])
      .toArray();

    res.status(200).json({ data: data });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.post("/one-one", async (req, res) => {
  const chat = db.collection("chat");
  const token = req.headers.token;
  req.user = null;
  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }
  try {
    ischat = await chat.findOne({
      isgroup: false,
      users: {
        $all: [new ObjectId(req.user.id), new ObjectId(req.body.userid)],
      },
    });
    if (ischat) {
      truechat = await chat
        .aggregate([
          {
            $match: {
              isgroup: false,
              users: {
                $all: [
                  new ObjectId(req.user.id),
                  new ObjectId(req.body.userid),
                ],
              },
            },
          },
          {
            $lookup: {
              from: "user",
              localField: "users",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $project: {
              userDetails: {
                password: 0,
                cover: 0,
              },
            },
          },
        ])
        .toArray();

      return res.status(200).json({ messege: "find chat 1", data: truechat });
    }
    const newChat = {
      chatName: "sender",
      isgroup: false,
      users: [new ObjectId(req.user.id), new ObjectId(req.body.userid)],
      createdAt: new Date(),
      lastmessege: null,
      pinnedMessage: [],
    };
    await chat.insertOne(newChat);
    data = await chat
      .aggregate([
        {
          $match: {
            isgroup: false,
            users: {
              $all: [new ObjectId(req.user.id), new ObjectId(req.body.userid)],
            },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "users",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            userDetails: {
              password: 0,
              cover: 0,
            },
          },
        },
      ])
      .toArray();

    res.status(200).json({ messege: "find chat ", data: data });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.post("/group", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    const groupMembers = req.body.members.map((id) => new ObjectId(id));

    newchat = await chat.insertOne({
      chatName: req.body.chatName,
      isgroup: true,
      users: [new ObjectId(req.user.id), ...groupMembers],
      createdAt: new Date(),
      img: {
        url: null,
        publicid: null,
        originalname: null,
      },
      lastmessege: null,
      pinnedMessage: [],
      admin: [new ObjectId(req.user.id)],
    });

    truechat = await chat
      .aggregate([
        {
          $match: { _id: newchat.insertedId },
        },
        {
          $lookup: {
            from: "user",
            localField: "users",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            userDetails: {
              password: 0,
              cover: 0,
            },
          },
        },
      ])
      .toArray();

    res.status(200).json({ messege: "find chat 1", data: truechat });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.put("/group/add/chat/:id", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (isadmin) {
      await chat.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $addToSet: { users: new ObjectId(req.body.userid) } }
      );

      return res.status(200).json({ messege: "add done" });
    }

    res.status(400).json({ messege: "not admin" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.put("/group/pull/chat/:id", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (isadmin) {
      await chat.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $pull: { users: new ObjectId(req.body.userid) } }
      );

      return res.status(200).json({ messege: "pull done" });
    }

    res.status(400).json({ messege: "not admin" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.post("/group/:id/img", upload.single("img"), async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (!isadmin) {
      return res.status(400).json({ messege: "not admin" });
    }

    if (!req.file) {
      return res.status(403).json({ message: "you not send img" });
    }

    const pathimge = path.join(__dirname, "../upload/" + req.file.originalname);

    if (livechat.img.originalname == req.file.originalname) {
      fs.unlinkSync(pathimge);

      return res.status(200).json({ message: "upload img Succeed 1" });
    }

    result = await cloud_uplod(pathimge);

    if (livechat.img.publicid !== null) {
      cloud_remove(test.img.publicid);
    }

    await chat.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          img: {
            url: result.secure_url,
            publicid: result.public_id,
            originalname: req.file.originalname,
          },
        },
      }
    );
    fs.unlinkSync(pathimge);
    res.status(200).json({ message: "upload img Succeed" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.delete("/group/:id/img", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (!isadmin) {
      return res.status(400).json({ messege: "not admin" });
    }

    cloud_remove(livechat.img.publicid);

    await chat.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          img: {
            url: null,
            publicid: null,
            originalname: null,
          },
        },
      }
    );

    res.status(200).json({ message: "img delete" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.put("/group/addadmin/chat/:id", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (!isadmin) {
      return res.status(400).json({ messege: "not admin" });
    }

    await chat.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $addToSet: { admin: new ObjectId(req.body.userid) } }
    );

    res.status(200).json({ messege: "add done" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

router.put("/group/pulladmin/chat/:id", async (req, res) => {
  const chat = db.collection("chat");

  const token = req.headers.token;
  req.user = null;

  if (token) {
    data = jwt.verify(token, process.env.secritkey);
    req.user = data;
  } else {
    return res.status(400).json({ messege: "login frist" });
  }

  try {
    livechat = await chat.findOne({ _id: new ObjectId(req.params.id) });

    Admins = livechat.admin;

    isadmin = Admins.map((id) => id.toString()).includes(
      req.user.id.toString()
    );

    if (!isadmin) {
      return res.status(400).json({ messege: "not admin" });
    }

    await chat.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { admin: new ObjectId(req.body.userid) } }
    );

    res.status(200).json({ messege: "pull done" });
  } catch (err) {
    console.log("=========>" + err);
    res.status(500).send("err in " + err);
  }
});

module.exports = router;
