import express from "express";
import controller from "./rating.controller.js";
import validation from "./rating.validation.js";
import middleware from "../../middlewares/authenticate.js";

const router = express.Router();

router.post("/rate", middleware.authenticate, validation.rateValidation, controller.rate);
router.delete("/remove/:postId", middleware.authenticate, validation.postParamValidation, controller.remove);
router.get("/summary/:postId", validation.postParamValidation, controller.summary);

export default router;
