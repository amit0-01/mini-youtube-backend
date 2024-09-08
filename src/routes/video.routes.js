import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    // togglePublishStatus,
    updateVideo,
    getUsersVideos
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
    // router.use(verifyJWT); 

router
    .route("/videoActions")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(verifyJWT,getVideoById)
    // .delete(verifyJWT,deleteVideo)
    .patch(verifyJWT,upload.single("thumbnail"), updateVideo);

router
      .route("/:videoId/:userId")
      .delete(verifyJWT,deleteVideo)

router
    .route("/users/:userId")
    .get(verifyJWT,getUsersVideos);




// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router