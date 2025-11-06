import Router from "express";
import {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    getBalances
} from "../controller/group.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import groupExpenseRouter from "./groupExpense.route.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Group routes
router.route("/").get(getGroups).post(createGroup);

router
    .route("/:groupId")
    .get(getGroupById)
    .put(updateGroup)
    .delete(deleteGroup);

// Member management routes with parameter preservation
router.use("/:groupId/members", (req, res, next) => {
    // Store groupId in both params and a custom property
    const groupId = req.params.groupId;
    req.groupId = groupId;
    
    // Create a member-specific router
    const memberRouter = Router();
    
    // Ensure groupId is available in all member routes
    memberRouter.use((req, _, next) => {
        req.params.groupId = groupId;
        next();
    });

    // Define member routes
    memberRouter.route("/")
        .post(addMember);

    memberRouter.route("/:memberId")
        .delete(removeMember);

    // Use the member router
    memberRouter(req, res, next);
});

// Balance routes
router.route("/:groupId/balances").get(getBalances);

// Middleware to ensure groupId is available in the expense routes
router.use("/:groupId/expenses", (req, res, next) => {
    // Store groupId in both params and a custom property
    const groupId = req.params.groupId;
    req.groupId = groupId;
    
    // Create a new router just for this group's expenses
    const groupSpecificRouter = Router();
    groupSpecificRouter.use((req, _, next) => {
        req.params.groupId = groupId;
        next();
    });
    
    // Mount the expense router on this specific router
    groupSpecificRouter.use("/", groupExpenseRouter);
    
    // Use the specific router
    groupSpecificRouter(req, res, next);
});

export default router;
