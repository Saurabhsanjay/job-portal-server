import { NextFunction, Request, Response } from 'express';
import { userService } from './user.service';
import { throwError } from '@utils/throwError';
import httpStatus from '@utils/httpStatus';
import { USER_MESSAGES } from './user.enum';
import User from './user.model';
import {uploadProfilePictureToS3, uploadResumeToS3} from '@utils/aws_helper';

export const userController = {
  register: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        phoneNumber,
        profilePicture,
        gender,
        isVisible,
        language,
        address,
        socialLogins,
        jobSeekerDetails,
        employerDetails,
        activityDetails,
      } = req.body;
      const userData = {
        personalDetails: {
          firstName,
          lastName,
          email,
          password,
          dateOfBirth,
          phoneNumber,
          profilePicture,
          gender,
          isVisible,
          language,
          address,
        },
        socialLogins,
        jobSeekerDetails,
        employerDetails,
        activityDetails,
      };
      const user = await userService.registerUser(userData);
      res.sendResponse(httpStatus.CREATED, user, USER_MESSAGES.USER_CREATED);
    } catch (error) {
      next(error);
    }
  },

  login: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const checkIsUserDeleted = await User.findOne({
        'personalDetails.email': email}).select('isDeleted -_id');
      if(checkIsUserDeleted?.isDeleted === true){
        return throwError(httpStatus.UNAUTHORIZED, USER_MESSAGES.USER_NOT_FOUND);
      }
      const user = await userService.loginUser(email, password);
      if (!user) {
        return throwError(
          httpStatus.UNAUTHORIZED,
          USER_MESSAGES.INVALID_CREDENTIALS,
        );
      }

      res.sendResponse(httpStatus.OK, user, USER_MESSAGES.USER_LOGGED_IN);
    } catch (error) {
      next(error);
    }
  },
  forgetPassword: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body;
      const user = await userService.forgetPassword(email);
      if (!user) {
        return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
      }
      res.sendResponse(httpStatus.OK, null, USER_MESSAGES.PASSOWRD_RESET_LINK_SEND);
    } catch (error) {
      next(error);
    }
  },
  resetPassword: async (  req: Request, res: Response, next: NextFunction, ): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const user = await userService.resetPassword(token, newPassword);
      if(!user){
        return throwError(httpStatus.TOKEN_EXPIRED, USER_MESSAGES.TOKEN_EXPIRED);
      }
      
      return res.sendResponse(httpStatus.OK, null, USER_MESSAGES.PASSOWRD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  },
  changePassword: async (  req: Request, res: Response, next: NextFunction, ): Promise<void> => {
    try {
      const { email, oldPassword, newPassword } = req.body;
      const user = await userService.changePassword(email, oldPassword, newPassword);
      if(!user){
        return throwError(httpStatus.UNAUTHORIZED, USER_MESSAGES.INVALID_PASSWORD);
      }
      return res.sendResponse(httpStatus.OK, null, USER_MESSAGES.PASSOWRD_CHANGED_SUCCESS);
    } catch (error) {
      next(error);
    }
  },
  updateProfile: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.body || !req.body.id) {
        return throwError(httpStatus.UNAUTHORIZED, USER_MESSAGES.USER_NOT_FOUND_WITH_ID);
      }
      const userId = req.body?.id; 
      const {
        firstName,
        lastName,
        phoneNumber,
        profilePicture,
        gender,
        jobSeekerDetails,
        employerDetails,
        activityDetails,
      } = req.body;
  
      const updatedUser = await userService.updateUserProfile(
        userId,
        {
          personalDetails: {
            firstName,
            lastName,
            phoneNumber,
            profilePicture,
            gender,
            email: ''
          },
          jobSeekerDetails,
          employerDetails,
          activityDetails,
        }
      );
  
      res.sendResponse(httpStatus.OK, updatedUser, USER_MESSAGES.USER_PROFILE_UPDATED);
    } catch (error) {
      next(error);
    }
  },
  getProfile:async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, gender, provider, employmentType, workType, applicationStatus, accountStatus } = req.query;
        const filters: any = {};

      if (role) filters.role = role;
      if (gender) filters['personalDetails.gender'] = gender;
      if (provider) filters['socialLogins.provider'] = provider;
      if (employmentType) filters['jobSeekerDetails.professionalDetails.employmentType'] = employmentType;
      if (workType) filters['jobSeekerDetails.jobPreferences.workType'] = workType;
      if (applicationStatus) filters['jobSeekerDetails.applicationsHistory.status'] = applicationStatus;
      if (accountStatus) filters['activityDetails.accountStatus'] = accountStatus;

      const users = await User.find({});
      res.sendResponse(httpStatus.OK, users, USER_MESSAGES.USER_PROFILE_FETCHED);
    } catch (error) {
      next(error);
    }
  },
  uploadProfilePicture: async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try{
      const { userId } = req.query;
    const pictureFile = req.file as Express.Multer.File;
    if(!pictureFile){
      return throwError(httpStatus.BAD_REQUEST,USER_MESSAGES.PROFILE_PICTURE_NOT_PROVIDED)
    }
    const profilePictureUrl: any = await uploadProfilePictureToS3(pictureFile);
    if (!profilePictureUrl) {
        return throwError(httpStatus.INTERNAL_SERVER_ERROR, USER_MESSAGES.FAILED_TO_UPLOAD_PROFILE_PICTURE)
    }
    const updatedUser = await userService.updateUserProfilePicture(userId, profilePictureUrl);
    if (!updatedUser) {
      return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
    }
    res.sendResponse(httpStatus.OK,updatedUser,USER_MESSAGES.USER_PROFILE_PICTURE_UPDATED);
    }catch(error){
      next(error);
    }
  },
  uploadResume: async(req: Request, res: Response, next: NextFunction):Promise<void> => {
    try{
      const { userId } = req.query;
    const resumeFile = req.file as Express.Multer.File;
    if(!resumeFile){
      return throwError(httpStatus.BAD_REQUEST,USER_MESSAGES.RESUME_NOT_PROVIDED)
    }
    const resumeUrl: any = await uploadResumeToS3(resumeFile);
    if (!resumeUrl) {
        return throwError(httpStatus.INTERNAL_SERVER_ERROR, USER_MESSAGES.FAILED_TO_UPLOAD_RESUME)
    }
    const updatedUser = await userService.updateResume(userId, resumeUrl);
    if (!updatedUser) {
      return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
    }
    res.sendResponse(httpStatus.OK,updatedUser,USER_MESSAGES.USER_RESUME_UPDATED);
    }catch(error){
      next(error);
    }
  },
  deleteUserProfile: async(req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
      const { userId } = req.body;
      const deletedUser = await userService.deleteUserProfile(userId);
      if (!deletedUser) {
        return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
      }
      res.sendResponse(httpStatus.OK,null,USER_MESSAGES.USER_PROFILE_DELETED);
    } catch(error){
      next(error);
    }
  }
};
