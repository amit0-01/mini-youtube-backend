import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { incrementView } from "../controllers/view.controller.js";
const router = Router();

router.use(verifyJWT);

router
      .route("/:videoId")
      .post(incrementView)

export default router;