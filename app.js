const express = require("express");
const morgan = require("morgan");
var cors = require('cors');
const bodyparser = require("body-parser");
const { main } = require("./connection");


const app = express();


app.get("/", (req, res) => {

    res.send("run .....")
})

app.use(morgan("dev"));
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.use(cors())



const userpath = require("./routes/user")
const postpath = require("./routes/post")
const commentpath = require("./routes/comment")
const storypath = require("./routes/story")
const pagepath = require("./routes/page")
const chatpath = require("./routes/chat")

app.use("/user", userpath)
app.use("/post", postpath)
app.use("/comment", commentpath)
app.use("/story", storypath)
app.use("/page", pagepath)
app.use("/caht",chatpath)

main(app);