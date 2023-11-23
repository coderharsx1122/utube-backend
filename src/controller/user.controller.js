import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const registerUser = (async (req, res) => {
  
    
    // extract data from the user req

    const {username,email,fullname,avatar,coverimage,password} = req.body

    // check wheather user already exist or not
    // validate the data
    // check the images and avtar
    // upload them to cloudinary
    // create user object
    // save data into the database
    // send response

})

export { registerUser }