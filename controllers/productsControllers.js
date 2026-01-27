import {product} from "../schemas/productSchema.js";

//Create or add to the database

export const addProduct = async (req, res) =>{
    const checkIfProductExists = product.exists({title:req.body.title});
    if(checkIfProductExists){

     const productToAdd = await product.insertOne(req.body);
    return res.status(201).json(productToAdd)

    }
    if(!checkIfProductExists){
        return res.status(400).json({
            message: "product already exists in the database"
        }
    )
}
   
}

export const getProducts = async (req, res) => {
    const findProduct = await product.find({});
    res.status(200).json({findProduct});
}

export const getSingleProduct = async (req, res) => {
    const id = req.params.id;
    const getProduct = await product.findById(id);
    res.status(200).json({getProduct});
}

export const updateProduct = async (req, res) => {
    const ProductId = req.params.id;
    const productToUpdate = await product.findByIdAndUpdate(ProductId, req.body, {new: true,});
    res.status(200).json({productToUpdate});
}

export const deleteProduct = async (req,res) => {
    const productId = req.params.id;
    const productToDelete = await product.findByIdAndDelete(productId,null,{new:true});
    res.status(204).json({
        message: `product with the id of ${productId} deleted successfully`
    });
}

export const deleteAllProducts = async (req,res) => {
    const deleteAll = await product.delete({});
    res.status(204).json({
        message: "all products deleted successfully"
    });
}