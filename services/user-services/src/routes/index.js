// routes/v1/index.js
const express = require('express');
const router = express.Router();

// Import individual route modules
const userRoutes = require('./userRoutes');
const commonRoutes = require('./commonRoute');

// Mount routes under their respective paths
router.use('/users', userRoutes);
router.use('/common', commonRoutes);

module.exports = router;
