import Router from "express";
import {
    getExpenses,
    createExpense,
    settleExpense
} from "../controller/expense.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access :groupId from parent router

// More detailed debug middleware
router.use((req, res, next) => {
    console.log('\nGroupExpense Router - Detailed Debug:');
    console.log('Full URL:', req.originalUrl);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('All Params:', JSON.stringify(req.params, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('GroupId from params:', req.params.groupId);
    
    // Validate groupId format
    if (req.params.groupId) {
        console.log('GroupId length:', req.params.groupId.length);
        console.log('Is valid ObjectId format:', /^[0-9a-fA-F]{24}$/.test(req.params.groupId));
    }
    next();
});

// All routes require authentication
router.use(verifyJWT);

// Group-specific expense routes
router.route("/").get(getExpenses).post(createExpense);

// Settlement route
router.route("/settle").post(settleExpense);

export default router;
