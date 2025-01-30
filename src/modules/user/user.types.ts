import mongoose from 'mongoose';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDTO {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  address: string;
  phoneNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Provider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
}

interface SocialLogin {
  provider: Provider;
  providerId: string;
}

interface Education {
  qualification: string;
  specialization: string;
  institutionName: string;
  yearOfGraduation: number;
  certifications: {
    expiryDate: any;
    name: string;
    date: Date;
  }[];
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  PERMANENT = 'PERMANENT',
  FRESHER = 'FRESHER',
  INTERNSHIP = 'INTERNSHIP',
}

interface ProfessionalDetails {
  currentJobTitle: string;
  currentEmployer: string;
  totalExperience: number;
  skills: string[];
  resume: string;
  keyAchievements: string;
  noticePeriod: string;
  currentCTC?: number;
  expectedCTC: number;
  employmentType: EmploymentType;
}
export enum WorkType {
  ON_SITE = 'ON_SITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

interface JobPreferences {
  preferredJobTitles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  workType: WorkType;
  expectedSalary: number;
  jobAlerts: boolean;
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
}
interface ApplicationsHistory {
  jobId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  appliedDate: Date;
}

interface JobSeekerDetails {
  education: Education[];
  professionalDetails: ProfessionalDetails;
  jobPreferences: JobPreferences;
  applicationsHistory: ApplicationsHistory[];
}

interface JobPosting {
  jobId: mongoose.Types.ObjectId;
  postingDate: Date;
}

interface EmployerDetails {
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  companySize: number;
  companyIndustry: string;
  companyDescription: string;
  jobPostings: JobPosting[];
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: {
    countryCode?: string;
    number: string;
  };
  password?: string;
  profilePicture?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  isVisible?: boolean;
  language?: string[];
  address?: {
    country?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
interface ActivityDetails {
  passwordResetToken: string | undefined;
  passwordResetExpires: number | undefined;
  accountStatus: AccountStatus;
  lastLogin: Date;
  accountCreationDate: Date;
}

export enum Role {
  JOBSEEKER = 'JOBSEEKER',
  EMPLOYER = 'EMPLOYER',
}

export interface IUser extends Document {
  passwordResetToken: any;
  role: Role;
  personalDetails: PersonalDetails;
  socialLogins: SocialLogin[];
  jobSeekerDetails?: JobSeekerDetails;
  employerDetails?: EmployerDetails;
  activityDetails: ActivityDetails;
  isDeleted: boolean;
}
