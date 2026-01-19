import dotenv from 'dotenv';
import { app } from './app.js';
import connectDB from "./db/index.js";

dotenv.config();
connectDB()
.then(function(){
    app.listen(process.env.PORT || 8000, function(){
        
    })
})
.catch(function(err){
    
})