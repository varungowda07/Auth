const jwt = require('jsonwebtoken');
const { verify } = require('./sendMail');


 verifyJwt = (req,res,next) => {
    let token;
    if(req.headers.client ==='not browser') {
     token = req.headers.authorization;
    }
    else {
        token = req.cookies['jwt'];
    }
    if(!token) return res.status(401).json({success:false,message:"Your not authroized"});
    try {
        const userToken = token.split(' ')[1];
        const verifyJwt = jwt.verify(userToken,process.env.TOKEN_SECRET);
        if(verifyJwt) {
            req.user = verifyJwt;
            next();
        }
        else {
            throw new Error('error in the token')
        }
        
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success:true,
            message:"Your token expired"
        })
        
    }
 }
 module.exports = verifyJwt