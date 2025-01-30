import { validateSchema } from '@middlewares/validation.middleware';
import { z } from 'zod';
import { AccountStatus, ApplicationStatus, EmploymentType, Gender, WorkType } from './user.types';

const userSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.string().optional(),
    number: z.string().nonempty('Phone number is required'),
  }),
  firstName: z
    .string()
    .min(3, 'First name must be at least 3 characters')
    .max(30, 'First name must be less than 30 characters'),
  lastName: z
    .string()
    .min(3, 'Last name must be at least 3 characters')
    .max(30, 'Last name must be less than 30 characters')
    .optional(),
  email: z.string().email('Invalid email format'),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  isVisible: z.boolean().optional(),
  language: z.array(z.string()).optional(),
  address: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email is required and must be a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(15, 'Password must be no more than 15 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email is required').trim(),
});

const resetPasswordSchema = z.object({
  token: z.string().nonempty('Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(15, 'Password must be no more than 15 characters'),
});
const changePasswordSchema = z.object({
  email: z.string().email('Email is required').trim(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(15, 'New password must be no more than 15 characters')
    .nonempty('New password is required'),
});
const updateUserSchema = z.object({
  id: z.string().nonempty('User id is required'),
  firstName: z
    .string()
    .min(3, 'First name must be at least 3 characters')
    .max(30, 'First name must be less than 30 characters')
    .optional(),
  lastName: z
    .string()
    .min(3, 'Last name must be at least 3 characters')
    .max(30, 'Last name must be less than 30 characters')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z
    .object({
      countryCode: z.string().optional(),
      number: z.string().nonempty('Phone number is required'),
    })
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(15, 'Password must be no more than 15 characters')
    .optional(),
  profilePicture: z.string().optional(),
  dateOfBirth: z.string().optional(),
  isVisible: z.boolean().optional(),
  language: z.array(z.string()).optional(),
  address: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  gender: z.nativeEnum(Gender, {
      errorMap: () => ({ message: 'Invalid Gender Value' }),
    }).optional(),

  education: z.array(
    z.object({
      qualification: z.string().optional(),
      specialization: z.string().optional(),
      institutionName: z.string().optional(),
      yearOfGraduation: z
        .number()
        .min(1900, 'Year of graduation must be a valid year')
        .optional(),
      certifications: z
        .array(
          z.object({
            name: z.string().optional(),
            date: z.string().optional(),
          }),
        )
        .optional(),
    }).optional(),
  ).optional(),

  currentJobTitle: z.string().optional(),
  currentEmployer: z.string().optional(),
  totalExperience: z
    .number()
    .min(0, 'Total experience must be a positive number')
    .optional(),
  skills: z.array(z.string()).optional(),
  resume: z.string().optional(),
  keyAchievements: z.string().optional(),
  noticePeriod: z.string().optional(),
  currentCTC: z
    .number()
    .min(0, 'Current CTC must be a positive number')
    .optional(),
  expectedCTC: z
    .number()
    .min(0, 'Expected CTC must be a positive number')
    .optional(),
  employmentType: z
    .nativeEnum(EmploymentType, {
      errorMap: () => ({ message: 'Invalid employment type' }),
    })
    .optional(),

  preferredJobTitles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  workType: z
    .nativeEnum(WorkType, {
      errorMap: () => ({ message: 'Invalid work type' }),
    })
    .optional(),
  expectedSalary: z
    .number()
    .min(0, 'Expected salary must be a positive number')
    .optional(),
  jobAlerts: z.boolean().optional(),

  jobId: z.string().optional(),
  status: z
    .nativeEnum(ApplicationStatus, {
      errorMap: () => ({ message: 'Invalid application status' }),
    })
    .optional(),
  appliedDate: z.string().optional(),

  companyName: z.string().optional(),
  companyLogo: z.string().optional(),
  companyWebsite: z.string().url('Invalid URL format').optional(),
  companySize: z.number().min(5, 'Company size must be at least 5').optional(),
  companyIndustry: z.string().optional(),
  companyDescription: z.string().optional(),
  jobPostings: z
    .array(
      z.object({
        jobId: z.string().optional(),
        postingDate: z.string().optional(),
      }),
    )
    .optional(),

  passwordResetToken: z.string().optional(),
  passwordResetExpires: z.string().optional(),
  accountStatus: z
    .nativeEnum(AccountStatus, {
      errorMap: () => ({ message: 'Invalid account status' }),
    })
    .optional(),
  lastLogin: z.string().optional(),
  accountCreationDate: z.string().optional(),
});

const profilePictureSchema = z.object({
  userId: z.string().nonempty('User id is required'),
  file: z.custom<File>((value) => {
    if (!value || typeof value !== 'object' || !value.buffer) {
      return { valid: false };
    }
    return { valid: true };
  }),
});

const resumeUploadSchema = z.object({
  userId: z.string().nonempty('User id is required'),
  file: z.custom<File>((value) => {
    if (!value || typeof value !== 'object' || !value.buffer) {
      return { valid: false };
    }
    return { valid: true };
  }),
})


export const validateUserMiddleware = validateSchema(userSchema, 'body');
export const validateLoginMiddleware = validateSchema(loginSchema, 'body');
export const validateForgotPasswordMiddleware = validateSchema(
  forgotPasswordSchema,
  'body',
);
export const validateResetPasswordMiddleware = validateSchema(
  resetPasswordSchema,
  'body',
);
export const validateChangePasswordMiddleware = validateSchema(
  changePasswordSchema,
  'body',
);
export const validateUpdateUserMiddleware = validateSchema(
  updateUserSchema,
  'body',
)
export const validateProfilePictureMiddleware = validateSchema(
  profilePictureSchema,
  'query',
);

export const validateResumeUploadMiddleware = validateSchema(
  resumeUploadSchema,
  'query',
);
