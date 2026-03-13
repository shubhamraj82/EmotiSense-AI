import mongoose from 'mongoose';

const connectDB=async()=>{
    try {
        mongoose.connection.on('connected',()=>console.log('MongoDB connected'))
        await mongoose.connect(process.env.MONGODB_URI as string, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            tls: true,
        })
    } catch (error) {
        console.log('Error conneting to MongoDB:',error)
    }
}
export default connectDB;