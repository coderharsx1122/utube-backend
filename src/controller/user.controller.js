import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from "jsonwebtoken"

// Generate Tokens -> Access and Refresh
const generate_Access_and_Refresh_Token = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        // save refreshToken in 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong on server side")
    }
}

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
    const isUser = await User.findOne({ $or: [{ email }, { username }] })
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


const loginUser = asyncHandler(async (req, res) => {
    // get data from req.body
    // get username or email from body and find user
    // check if user exist or not and validate the user
    // create access and refresh token 

    const { email, username, password } = req.body

    if (!username && !email) throw new ApiError(400, "Username or Email is required")

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User Does not exist")
    }

    const isPassCorrect = await user.isPasswordCorrect(password)
    if (!isPassCorrect) throw new ApiError(404, "Wrong Credentials")

    const { accessToken, refreshToken } = await generate_Access_and_Refresh_Token(user._id)

    const userdata = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true, // only server can modify the cookie (unlike by default nature of cookie)
        secure: true
    }

    // send back response
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: userdata,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                },
                "User Successfully logged in"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    // clear cookies from frontend
    // clear refresh token from the db
    const user = req.user
    await User.findByIdAndUpdate(
        user._id,
        {
            refreshToken: undefined
        },
        {
            new: true // return new values
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Succsesfully loggedout"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const reqRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!reqRefreshToken) {
        throw new ApiError(401, "Unauhtorized request")
    }
    try {

        const decodedToken = jwt.verify(refreshAccessToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (reqRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generate_Access_and_Refresh_Token(user?._id)
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Refreshed Access Token"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

const updateUser = asyncHandler(async (req, res) => {

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}