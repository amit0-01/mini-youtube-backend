import { Router } from 'express';
import {
    getLikedVideos,
    toogleCommentLike,
    toogleVideoLike,
    toogleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.route("/toggle/v/:videoId").post(toogleVideoLike);
router.route("/toggle/c/:commentId").post(toogleCommentLike);
router.route("/toggle/t/:tweetId").post(toogleTweetLike);
router.route("/videos/:videoId").get(getLikedVideos);

export default router