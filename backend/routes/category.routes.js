const express = require('express');
const router = express.Router();
const Category = require('../models/category.model');

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const cats = await Category.find({}).lean();
        res.json({ categories: cats.map((c) => ({ id: c._id, name: c.name, slug: c.slug })) });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
