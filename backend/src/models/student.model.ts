import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IStudent extends Document {
  user: Types.ObjectId;
  studentCode: string;
  birthDate?: Date;
  address?: string;
  major?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
      unique: true,
    },
    studentCode: {
      type: String,
      required: [true, 'Mã sinh viên là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    birthDate: {
      type: Date,
    },
    address: { type: String, default: '' },
    major: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Student: Model<IStudent> = mongoose.model<IStudent>('Student', studentSchema);
