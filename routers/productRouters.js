import express from "express"
import { addProduct,getProducts,getSingleProduct,updateProduct,deleteProduct,deleteAllProducts } from "../controllers/productsControllers.js";
import { protectedRoute } from "../controllers/userController.js";

const router = express.Router();

// Public route to get all products for display
router.route('/all')
.get(getProducts);

// Protected routes for admin operations
router.route('/')
.get(protectedRoute,getProducts)
.post(protectedRoute,addProduct)
.delete(protectedRoute,deleteAllProducts);

router.route('/:id')
.get(protectedRoute,getSingleProduct)
.patch(protectedRoute,updateProduct)
.delete(protectedRoute,deleteProduct)

export default router;