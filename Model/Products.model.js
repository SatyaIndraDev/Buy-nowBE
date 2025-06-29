const mongoose = require("mongoose");

const ProductsSchema = mongoose.Schema({
   image: String,
   name: { 
     type: String, 
     required: true,
     index: true // Index for search queries
   },
   rating: { 
     type: Number, 
     index: true // Index for rating filters
   },
   desc: String,
   price: { 
     type: Number, 
     index: true // Index for price filters
   },
   createdAt: {
     type: Date,
     default: Date.now,
     index: true // Index for sorting by date
   }
},{
    versionKey: false,
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for common query combinations
ProductsSchema.index({ name: 1, price: 1 });
ProductsSchema.index({ rating: 1, price: 1 });

const ProductsModel = mongoose.model("products", ProductsSchema);

module.exports = {
    ProductsModel
}