const Post = require('../models/postModel')

exports.createPost = async (req, res) => {
    const { title, description } = req.body;
    const { userId } = req.user;
    try {
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title or Description cannot be empty"
            });
        }
        const post = await Post.create({
            title,
            description,
            userId
        })
        return res.status(201).json({
            success: true,
            message: "Post created",
            post
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })

    }

} 
exports.getAllPost = async  (req,res) => {
    const {userId,email} = req.user;
    const posts = await Post.find().populate('userId','email');
    try {
        return res.status(200).json({
            success:true,
            message:"successfull",
            posts
        })
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:"Something went wrong"
        })
        
    }
}
exports.getPostById = async (req,res) => {
    const {id} = req.params;
    const {userId,email} = req.user
    const post = await Post.findById({_id:id}).populate('userId','email');
   try {
     if(!post) {
        return res.status(404).json({
            success:false,
            message:`We don't have any post in this Id : ${id}`
        });
    }
    return res.status(200).json({
        success:true,
        message:"Success",
        post
    });
   } catch (error) {
    return res.status(500).json({
        success:false,
        message:"Something went wrong",
        error
    })
    
   }

}
exports.updatePostById = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const { userId } = req.user; // logged-in user

  try {
    // Find the post by id
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found`
      });
    }

    // Check if logged-in user is the owner
    if (post.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this post"
      });
    }

    // Update the fields
    if (title) post.title = title;
    if (description) post.description = description;

    const updatedPost = await post.save();

    // Optionally populate user email
    await updatedPost.populate('userId', 'email');

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error
    });
  }
};

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const post = await Post.findById(id); // move inside try

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "No post found with this ID"
            });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not the owner of this post"
            });
        }

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error(error); // log actual error
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });
    }
};
