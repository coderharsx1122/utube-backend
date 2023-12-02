import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

// Register User
const registerUser = asyncHandler(async (req, res) => {

        // extract data from the user req
        const { username, email, fullName, password } = req.body
        console.log("email:" + email)

        // validation of data
        if ([fullName, email, username, password].some((ele) => ele?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }

        // check wheather user already exist or not
        const isUser = await    User.findOne({ $or: [{ email }, { username }] })
        if (isUser) throw new ApiError(409, "User already exist")

        // check the images and avtar
        console.log("request.files => " + req.files[0])
        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImgLocalPath = req.files?.coverImage[0]?.path
        if (!avatarLocalPath) throw new ApiError(400, "Avtar is required")

        // upload them to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = coverImgLocalPath ? await uploadOnCloudinary(coverImgLocalPath) : ""
        if (!avatar) throw new ApiError(400, "Avtar is required")

        // create user object
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
        
        // check for user creation in db 
        if (!createdUser) throw new ApiError(500, "Something went wrong while registration")
        
        // send response
        return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"))

})


const loginUser = asyncHandler(async (req,res)=>{
    // extract data from req.body
    // check if user exist and validate the user
    // select and send the response
})
export { registerUser }