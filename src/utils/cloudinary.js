import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'

cloudinary.config({
    cloud_name: CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null
        // upload file on cloudinary
        const respone = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log('File successfully uploaded = ', respone.url)
        return respone
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove file from the server
        console.log('Upload to cloudinary failed')
    }
}