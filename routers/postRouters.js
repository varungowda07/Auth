const express = require('express');
const router = express.Router();
const verify = require('../middleware/verifyRoutes');
const postController = require('../controllers/postController');
const {storage,fileFilter} = require('../middleware/ImageUpload');
const multer = require('multer');
const upload = multer({storage,fileFilter});

// Posts
router.get('/posts',verify,postController.getAllPost);            // Get all posts
router.get('/posts/:id', verify, postController.getPostById);      // Get single post by ID
router.post('/posts', verify,upload.single('image'), postController.createPost);          // Create a post
router.put('/posts/:id', verify,upload.single('image'), postController.updatePostById);   // Update a post by ID
router.delete('/posts/:id', verify, postController.deletePost);    // Delete a post by ID

module.exports = router;
