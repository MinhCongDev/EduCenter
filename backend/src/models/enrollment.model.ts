import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type EnrollmentStatus = 'PENDING' | 'ENROLLED' | 'DROPPED' | 'COMPLETED';
export type TuitionStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  class?: Types.ObjectId;
  course?: Types.ObjectId;
  registrationDate: Date;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  tuitionStatus: TuitionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ENROLLED', 'DROPPED', 'COMPLETED'],
      default: 'ENROLLED',
    },
    tuitionStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollment of the same student into the same class
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
