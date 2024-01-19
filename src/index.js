// require("dotenv").config({ path: "./env" })
import dotenv from "dotenv"
import connnectDB from "./db/index.js"

dotenv.config({
    path: "./.env"
})

connnectDB();