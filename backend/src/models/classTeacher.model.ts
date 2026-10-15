import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IClassTeacher extends Document {
  class: Types.ObjectId;
  teacher: Types.ObjectId;
  assignedDate: Date;
  role: 'PRIMARY' | 'ASSISTANT' | 'SUBSTITUTE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const classTeacherSchema = new Schema<IClassTeacher>(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giảng viên là bắt buộc'],
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['PRIMARY', 'ASSISTANT', 'SUBSTITUTE'],
      default: 'PRIMARY',
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

export const ClassTeacher: Model<IClassTeacher> = mongoose.model<IClassTeacher>('ClassTeacher', classTeacherSchema);
