import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ITeacher extends Document {
  user: Types.ObjectId;
  teacherCode: string;
  specialization: string[];
  bio: string;
  qualifications: string[];
  ieltsBand?: number;
  yearsOfExperience: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tài khoản người dùng là bắt buộc'],
      unique: true,
    },
    teacherCode: {
      type: String,
      required: [true, 'Mã giảng viên là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    specialization: {
      type: [String],
      default: ['IELTS 4 Kỹ Năng'],
    },
    bio: {
      type: String,
      default: '',
    },
    qualifications: {
      type: [String],
      default: ['CELTA', 'IELTS 8.5+'],
    },
    ieltsBand: {
      type: Number,
      min: 0,
      max: 9.0,
      default: 8.5,
    },
    yearsOfExperience: {
      type: Number,
      default: 3,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Teacher: Model<ITeacher> = mongoose.model<ITeacher>('Teacher', teacherSchema);
