import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IStudent extends Document {
  user: Types.ObjectId;
  studentCode: string;
  dob?: Date;
  currentBand?: number;
  targetBand?: number;
  learningGoal?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'ACTIVE' | 'GRADUATED' | 'RESERVED' | 'DROPPED';
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tài khoản người dùng là bắt buộc'],
      unique: true,
    },
    studentCode: {
      type: String,
      required: [true, 'Mã học viên là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    dob: {
      type: Date,
    },
    currentBand: {
      type: Number,
      min: 0,
      max: 9.0,
      default: 0,
    },
    targetBand: {
      type: Number,
      min: 0,
      max: 9.0,
      default: 7.0,
    },
    learningGoal: {
      type: String,
      default: 'Du học & Định cư',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'GRADUATED', 'RESERVED', 'DROPPED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Student: Model<IStudent> = mongoose.model<IStudent>('Student', studentSchema);
