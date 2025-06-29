const express = require("express");
const { ProductsModel } = require("../Model/Products.model");

const ProductRouter = express.Router();

// Cache for storing frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Optimized GET all products with pagination
ProductRouter.get("/", async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Create cache key based on query parameters
        const cacheKey = `products_${page}_${limit}`;
        
        // Check cache first
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Use lean() for better performance and projection to select only needed fields
        const products = await ProductsModel.find({}, 'name price rating image desc')
            .lean()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await ProductsModel.countDocuments();
        
        const response = {
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };

        // Cache the response
        setCachedData(cacheKey, response);
        
        res.status(200).json(response);
    } catch(err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Optimized search and filter endpoint
ProductRouter.get('/search', async (req, res) => {
    try {
        const { search, rating, priceMin, priceMax, sortField, sortOrder, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let filter = {};
        
        // Optimize search with text index
        if (search) {
            filter.$text = { $search: search };
        }
        
        if (rating) {
            filter.rating = { $gte: parseInt(rating) };
        }
        
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) filter.price.$gte = parseFloat(priceMin);
            if (priceMax) filter.price.$lte = parseFloat(priceMax);
        }

        let sort = {};
        if (sortField) {
            sort[sortField] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sort = { createdAt: -1 }; // Default sort
        }

        // Create cache key
        const cacheKey = `search_${JSON.stringify(req.query)}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const products = await ProductsModel.find(filter, 'name price rating image desc')
            .lean()
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ProductsModel.countDocuments(filter);

        const response = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        };

        setCachedData(cacheKey, response);
        res.json(response);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

ProductRouter.post("/", async(req, res) => {
    try {
        const post = new ProductsModel(req.body);
        await post.save();
        
        // Clear cache when new data is added
        cache.clear();
        
        res.status(201).json({ msg: "Product created successfully", product: post });
    } catch(err) {
        console.error('Error creating product:', err);
        res.status(400).json({ error: "Invalid product data" });
    }
});

ProductRouter.patch("/:id", async (req, res) => {
    try {
        const postID = req.params.id;
        const updatedProduct = await ProductsModel.findByIdAndUpdate(
            { _id: postID }, 
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        // Clear cache when data is updated
        cache.clear();
        
        res.status(200).json({ msg: "Product updated successfully", product: updatedProduct });
    } catch(err) {
        console.error('Error updating product:', err);
        res.status(400).json({ error: "Invalid update data" });
    }
});

ProductRouter.delete("/:id", async(req, res) => {
    try {
        const postID = req.params.id;
        const deletedProduct = await ProductsModel.findByIdAndDelete({ _id: postID });
        
        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        // Clear cache when data is deleted
        cache.clear();
        
        res.status(200).json({ msg: "Product deleted successfully" });
    } catch(err) {
        console.error('Error deleting product:', err);
        res.status(400).json({ error: "Invalid product ID" });
    }
});

module.exports = {
    ProductRouter
} 