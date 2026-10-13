import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IStaff extends Document {
  user: Types.ObjectId;
  staffCode: string;
  department: string;
  position: string;
  joinDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tài khoản người dùng là bắt buộc'],
      unique: true,
    },
    staffCode: {
      type: String,
      required: [true, 'Mã nhân viên là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      default: 'Phòng Đào tạo',
      trim: true,
    },
    position: {
      type: String,
      default: 'Chuyên viên Đào tạo',
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
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

export const Staff: Model<IStaff> = mongoose.model<IStaff>('Staff', staffSchema);
