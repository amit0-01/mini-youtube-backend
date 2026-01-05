import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import { mongoose } from "mongoose";
import { upload } from "../middlewares/multer.middleware.js";
const generateAccesTokenAdnRefreshTokens = async function(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
}

const registerdUser = asyncHandler(async function (req, res) {
  const { fullname, email, username, password } = req.body;

  if ([fullname, email, username, password].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  );
});

const loginUser = asyncHandler(async function(req, res) {
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccesTokenAdnRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async function(req, res) {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, { userId: req.user._id }, "User logged out"));
});

const refreshAccessToken = asyncHandler(async function(req,res){
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or userd")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
    const {accessToken, newRefreshToken} = await
    generateAccesTokenAdnRefreshTokens(user._id)
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken,options)
    .json(
      new ApiResponse(
          200,
          {accessToken,refreshToken: newRefreshToken},
          "Acces token refreshed"
  
      )
    )
  
  } catch (error) {
    throw new ApiError(401, error?.message ||
      "Invalid refresh token")
  }
});

const changeCurrentPassword = asyncHandler(async function(req,res){
      const {oldPassword, newPassword} = req.body

      const user = await User.findById(req.user?._id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
      if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
      }
      user.password = newPassword
      await user.save({validateBeforeSave: false})

      return res.status(200).json(new ApiResponse(200, {}, "Password changed succesfully"))
});

const getCurrentUser = asyncHandler(async function(req,res){
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched succesfully"));
});

const updateAccountDetails = asyncHandler(async function(req,res){
  const {fullname, email, username}  = req.body
  if(!fullname || !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
     $set:{
      fullname, 
      email: email,
      username : username
     }
    },
    {new: true}
  ).select('-password')


  return res.status(200).json(new ApiResponse(200, user, "Account details updaated succesfully"))
});

const updateUserAvatar = asyncHandler(async function(req,res){
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password")
  return res.status(200).json(new ApiResponse(200, user, "Avatar image updated succesfully"))
});

const updateCoverImage = asyncHandler(async function(req,res){
  console.log('req',req.file);
  
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Imgae file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading CoverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, user, "Cover image updated succesfully"))
});

const getUserChannelProfile = asyncHandler(async function(req,res){
  const {username } = req.params;

  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

 const channel = await User.aggregate([
  {
    $match:{
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from : "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribersCount: {
        $size: "$subscribers"
      },
      channelSubscribedToCount: {
        $size: "$subscribedTo"
      },
      isSubscribed :{
              $cond: {
                if: {$in: [req.user?._id, "$subscribers.subscriver"]},
                then: true,
                else: false
              }
      }
    }
  },
  {
    $project: {
      fullname: 1,
      username: 1,
      subscribersCount: 1,
      channelSubscribedToCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1
    }
  }

])
 
if(!channel?.length){
  throw new ApiError(404, "channel does not exists")
}

return res
.status(200)
.json(
  new ApiResponse(200, channel[0], "User channel feteched succesfully")
)
});

const getWatchHistory = asyncHandler(async function(req,res){
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from : "videos", 
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from :"users",
              localField: "owner",
              foreignField: "_id",
              as:"owner",
              pipeline:[
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    },
  ])
  return res.status(200).json(new ApiResponse(200,user[0].watchHistory, "Watch history fetched successfully" ))
})


export { registerdUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword,getCurrentUser, updateAccountDetails,updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory };
