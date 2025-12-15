const {Router} = require('express');
const multer = require('multer');
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');

const user = require('../models/user');
const { route } = require('./user');
const router = Router();
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.resolve(`./public/uploads`));
    },
    filename:function(req,file,cb){
       
        cb(null,Date.now()+'-'+file.originalname);
    }
});
const upload = multer({ storage: storage })

router.get('/add-new', (req, res) => {
    return res.render('addBlog',{user: req.user});
});
router.get('/:blogId',async(req,res)=>{
    const {blogId}=req.params;
    const blog = await Blog.findById(blogId).populate('CREATED_BY');
    const comments = await Comment.find({BLOG_ID:blogId}).populate('CREATED_BY').sort({createdAt:-1});
    return res.render('blog',{blog,user:req.user,comments});
});

router.post('/comment/:blogId',async(req,res)=>{
   const comment = Comment.create({
    content:req.body.content,
    BLOG_ID:req.params.blogId,
    CREATED_BY:req.user._id
   });
    return res.redirect(`/blog/${req.params.blogId}`);
}
);

router.post('/',upload.single("coverImage"),async(req,res)=>{
    const {title ,body}=req.body;
    const blog = await Blog.create({
        title,
        body,
        CREATED_BY:req.user._id,
        coverImageURL:req.file?'/uploads/'+req.file.filename:null

    })
return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;