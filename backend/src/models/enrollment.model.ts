import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  enrollmentDate: Date;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  tuitionStatus: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ENROLLED', 'DROPPED', 'COMPLETED'],
      default: 'ENROLLED',
    },
    tuitionStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PAID',
    },
  },
  {
    timestamps: true,
  }
);

export const Enrollment: Model<IEnrollment> = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
