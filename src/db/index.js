import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`\n MongodDB connected!! DB Host : ${connectionInstance.connection.host}`);
    }
    catch (error) {
        console.log("MongoDb error", error);
        process.exit(1)
    }
}
export default connnectDB;