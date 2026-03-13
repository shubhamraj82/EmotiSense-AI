import express, {Request,Response}  from "express";
import 'dotenv/config'
import cors from "cors";
import connectDB from "./config/db.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import AuthRouter from "./routes/AuthRoute.js";

declare module 'express-session' {
   interface SessionData {
      isLoggedIn:boolean;
      userId:string
   }
}


await connectDB();


 const app=express();
app.use(cors({
   origin:[ "http://localhost:5173", "http://localhost:5000"],
   credentials:true,
 }));

 app.use(session({
   secret:process.env.SESSION_SECRET as string,
   resave:false,
   saveUninitialized:false,
   cookie:{
      maxAge:1000*60*60*24*7,
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
   },
   store: MongoStore.create({
      mongoUrl:process.env.MONGODB_URI as string,
      collectionName:'session'
   })
 }))

  const port=process.env.PORT ||5000;
   app.use(express.json());
 app.get('/',(req:Request,res:Response)=>{
    res.send('Server is running');
 });

 app.use('/api/auth', AuthRouter);

 app.listen(port,()=>{
   console.log(`Server is running on port ${port}`);
 });