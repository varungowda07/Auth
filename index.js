const express  = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/connDB');
const helmet= require('helmet');
const auth = require('./routers/authRouter')
const post = require('./routers/postRouters');


const app = express();
connectDB();


//middleware
app.use('/upload', express.static('upload'));
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(helmet());


app.use('/auth/api',auth);
app.use('/api',post)

mongoose.connection.once('open',()=> {
    app.listen(process.env.PORT,() => console.log(`Server Started at port ${process.env.PORT}`));
})