import mongoose from "mongoose";

// create a schema

const ProductSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true, "please add a title for the product"],
        unique:true,
        default:"just added product",
        trim:true,
        maxLength:[100, "you have exceeded the number of characters"],
        minLength:[50, "your title should be more than 50 characters"]
    },
    price: Number,
    description : String,
    category: String,
    image: String,
    rating: {
        rate: Number,
        count: Number
    }
})


// creating a model
export const product = mongoose.model('Product', ProductSchema)

// {
//     "id": 21,
//     "title": "DANVOUY Womens T Shirt Casual Cotton Short",
//     "price": 12.99,
//     "description": "95% Cotton, 5% Spandex casual V-neck short sleeve shirt. Soft and stretchy fabric for comfort and versatility.",
//     "category": "women's clothing",
//     "image": "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_t.png",
//     "rating": { "rate": 3.6, "count": 145 }
//   }