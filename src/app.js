import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);


app.use(express.json({limit: "100mb", parameterLimit:50000}))
app.use(express.urlencoded({extended: true,limit: "100mb", parameterLimit:50000}))
app.use(express.static("public"))
app.use(cookieParser())


//router import 

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import viewRouter from "./routes/view.routes.js"
import chatBotRoute from './routes/chatbot.route.js';

app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/view", viewRouter)
app.use("/api/v1/chatBot", chatBotRoute);

export {app}

