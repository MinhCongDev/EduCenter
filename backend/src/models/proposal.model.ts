import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProposalCategory =
  | 'Mở lớp mới'
  | 'Học bổng'
  | 'Khảo thí & Điểm'
  | 'Cơ sở vật chất'
  | 'Chương trình học'
  | 'Khác';

export interface IProposal extends Document {
  code: string;
  title: string;
  description?: string;
  proposerName: string;
  proposerRole?: string;
  proposer?: Types.ObjectId;
  category: ProposalCategory | string;
  status: ProposalStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề đề xuất là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    proposerName: {
      type: String,
      required: [true, 'Tên người gửi đề xuất là bắt buộc'],
      trim: true,
    },
    proposerRole: {
      type: String,
      default: 'Giáo vụ',
      trim: true,
    },
    proposer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    category: {
      type: String,
      default: 'Khác',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewNote: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Proposal: Model<IProposal> = mongoose.model<IProposal>('Proposal', proposalSchema);
