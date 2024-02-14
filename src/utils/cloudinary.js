import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            console.log(`Deleted image with public ID: ${publicId} successfully`);
        } else {
            console.error(`Failed to delete image with public ID: ${publicId}`);
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error.message);
        throw error; // Throw the error for handling at a higher level
    }
};

const deleteVideoFromCloudinary = async (publicId) => {
    try {
        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
        if (result.result === 'ok') {
            console.log(`Deleted video with public ID: ${publicId} successfully`);
        } else {
            console.error(`Failed to delete video with public ID: ${publicId}`);
        }
    } catch (error) {
        console.error('Error deleting video from Cloudinary:', error.message);
        throw error; // Throw the error for handling at a higher level
    }
};

const extractPublicId = (imageUrl) => {
    const parts = imageUrl.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
};



export { uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary, extractPublicId }