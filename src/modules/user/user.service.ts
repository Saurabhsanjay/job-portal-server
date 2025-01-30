import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './user.model';
import { config } from '@config/env';
import { AccountStatus, IUser, Role } from './user.types';
import { throwError } from '@utils/throwError';
import httpStatus from '@utils/httpStatus';
import { USER_MESSAGES } from './user.enum';
import crypto from 'crypto';
import {sendEmail} from '@utils/emailService';
import passwordResetTemplate from '@email_template/forgetPassword';
export const userService = {
  registerUser: async (
    userData: Partial<IUser>
  ): Promise<IUser> => {
    const existingUser = await User.findOne({ 'personalDetails.email': userData.personalDetails?.email });
    if (existingUser) {
      throwError(httpStatus.BAD_REQUEST, USER_MESSAGES.EMAIL_ALREADY_EXISTS);
    } 

    const newUser = new User({
        role: Role.JOBSEEKER,
        personalDetails: {
        firstName: userData.personalDetails?.firstName,
        lastName: userData.personalDetails?.lastName || '',
        dateOfBirth: userData.personalDetails?.dateOfBirth,
        password: await bcrypt.hash(userData.personalDetails?.password!, 10),
        email: userData.personalDetails?.email,
        phoneNumber: userData.personalDetails?.phoneNumber,
        profilePicture: userData.personalDetails?.profilePicture,
        gender: userData.personalDetails?.gender,
        isVisible: userData.personalDetails?.isVisible || false,
        language: userData.personalDetails?.language || [],
        address: userData.personalDetails?.address || {},
      },
      socialLogins: userData.socialLogins || [],
      jobSeekerDetails: {
        ...userData.jobSeekerDetails,
        education: userData.jobSeekerDetails?.education?.map((edu) => ({
          ...edu,
          certifications: edu.certifications?.map((cert) => ({
            ...cert,
            expiryDate: cert.expiryDate,
            date: cert.date,
          })),
        })) || [],
      },
      employerDetails: userData.employerDetails || {},
      activityDetails: {
        accountStatus: userData.activityDetails?.accountStatus || AccountStatus.ACTIVE,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return newUser.save();
  },
  loginUser: async (email: string, password: string): Promise<string> => {
    const user = await User.findOne({ 'personalDetails.email': email }).select(
      '+personalDetails.password',
    );
    if (!user) {
      throwError(
        httpStatus.UNAUTHORIZED,
        USER_MESSAGES.INVALID_CREDENTIALS,
      );
    }
    if ( user && (!(await bcrypt.compare(password, user.personalDetails.password!)))) {
      throwError(
        httpStatus.UNAUTHORIZED,
        USER_MESSAGES.INVALID_CREDENTIALS,
      );
    }
    if (
      user &&
      (await bcrypt.compare(password, user.personalDetails.password!))
    ) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        config.JWT_SECRET || 'your_secret_key',
        { expiresIn: '1h' },
      );
      return token;
    } else {
      return throwError(
        httpStatus.UNAUTHORIZED,
        USER_MESSAGES.USER_ALREADY_EXISTS,
      );
    }
  },
  forgetPassword: async (email: string): Promise<IUser> => {
    const user = await User.findOne({ 'personalDetails.email': email });
    if (!user) {
      return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
    }
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.activityDetails.passwordResetToken = resetToken;
    user.activityDetails.passwordResetExpires = Date.now() + 600000;

    await user.save();
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    const emailContent = passwordResetTemplate(user,resetLink);
    await sendEmail(user.personalDetails.email, 'Forget Password Request', emailContent);
    return user;
  },

  resetPassword: async (token: string, newPassword: string): Promise<IUser> => {
    const user = await User.findOne({
      'activityDetails.passwordResetToken': token,
      'activityDetails.passwordResetExpires': { $gt: Date.now() },
    });
    if (!user) {
      return throwError(httpStatus.NOT_FOUND, USER_MESSAGES.TOKEN_EXPIRED);
    }
    user.personalDetails.password = await bcrypt.hash(newPassword, 10);
    user.activityDetails.passwordResetToken = undefined;
    user.activityDetails.passwordResetExpires =  undefined;
    await user.save();

    return user;
  },
  changePassword: async (email: string, oldPassword: string, newPassword: string): Promise<IUser> => {
    const user = await User.findOne({ 'personalDetails.email': email });
    if (!user) {
      return throwError(httpStatus.UNAUTHORIZED, USER_MESSAGES.USER_NOT_FOUND);
    }
    const isMatch = await bcrypt.compare(oldPassword, user.personalDetails.password!);
    if (!isMatch) {
      return throwError(httpStatus.UNAUTHORIZED, USER_MESSAGES.INVALID_PASSWORD);
    }
    user.personalDetails.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return user;
  },
  updateUserProfile: async (
    userId: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> => {
    const existingUser = await User.findById(userId);
  
    if (!existingUser) {
      throwError(httpStatus.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
    }
  
    if (updateData.personalDetails?.password) {
      updateData.personalDetails.password = await bcrypt.hash(updateData.personalDetails.password, 10);
    }
  
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'personalDetails.firstName': updateData.personalDetails?.firstName || existingUser?.personalDetails.firstName,
          'personalDetails.lastName': updateData.personalDetails?.lastName || existingUser?.personalDetails.lastName,
          'personalDetails.phoneNumber': updateData.personalDetails?.phoneNumber || existingUser?.personalDetails.phoneNumber,
          'personalDetails.profilePicture': updateData.personalDetails?.profilePicture || existingUser?.personalDetails.profilePicture,
          'personalDetails.gender': updateData.personalDetails?.gender || existingUser?.personalDetails.gender,
          jobSeekerDetails: updateData.jobSeekerDetails || existingUser?.jobSeekerDetails,
          employerDetails: updateData.employerDetails || existingUser?.employerDetails,
          activityDetails: updateData.activityDetails || existingUser?.activityDetails,
        }
      },
      { new: true } 
    );
  
    if (!updatedUser) {
      throwError(httpStatus.INTERNAL_SERVER_ERROR, USER_MESSAGES.USER_PROFILE_UPDATE_FAILED);  
    }
  
    return updatedUser;
  },
   updateUserProfilePicture : async (userId: any, profilePictureUrl: string) => {
    return await User.findByIdAndUpdate(
      userId,
      { 'personalDetails.profilePicture': profilePictureUrl },
      { new: true } 
    )},
    updateResume: async (userId: any, resumeUrl: string) => {
      return await User.findByIdAndUpdate(
        userId,
        { 'jobSeekerDetails.professionalDetails.resume': resumeUrl },
        { new: true } 
      )
    },
    deleteUserProfile: async (userId: string) => {
      return await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
    },
};
