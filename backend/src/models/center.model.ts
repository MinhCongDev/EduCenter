import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBranch {
  branchName: string;
  address: string;
  phone: string;
  isHeadquarters: boolean;
}

export interface IFacility {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface ICenter extends Document {
  name: string;
  slogan: string;
  introduction: string;
  vision?: string;
  mission?: string;
  hotline: string;
  email: string;
  workingHours: string;
  address: string;
  branches: IBranch[];
  facilities: IFacility[];
  achievements: { label: string; value: string; icon?: string }[];
  socialLinks: {
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const centerSchema = new Schema<ICenter>(
  {
    name: {
      type: String,
      required: [true, 'Tên trung tâm là bắt buộc'],
      default: 'EduCenter IELTS Academy',
    },
    slogan: {
      type: String,
      default: 'Bứt phá band điểm IELTS cùng giảng viên 8.5+ & công nghệ phòng thi máy chuẩn khảo thí quốc tế',
    },
    introduction: {
      type: String,
      default: 'EduCenter là tổ chức đào tạo tiếng Anh và luyện thi IELTS hàng đầu, đối tác đăng ký thi chính thức của IDP và British Council.',
    },
    vision: {
      type: String,
      default: 'Trở thành học viện khảo thí và đào tạo IELTS chuẩn mực số 1 tại Việt Nam.',
    },
    mission: {
      type: String,
      default: 'Giúp 100.000 học viên Việt Nam chinh phục mục tiêu IELTS 7.0+ phục vụ du học, săn học bổng và hội nhập quốc tế.',
    },
    hotline: {
      type: String,
      default: '1900 6868 - 0988 123 456',
    },
    email: {
      type: String,
      default: 'contact@educenter.edu.vn',
    },
    workingHours: {
      type: String,
      default: 'Thứ 2 - Chủ Nhật: 08:00 - 21:30',
    },
    address: {
      type: String,
      default: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, Hà Nội',
    },
    branches: [
      {
        branchName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        isHeadquarters: { type: Boolean, default: false },
      },
    ],
    facilities: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
      },
    ],
    achievements: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
        icon: { type: String, default: '' },
      },
    ],
    socialLinks: {
      facebook: { type: String, default: 'https://facebook.com/educenter' },
      youtube: { type: String, default: 'https://youtube.com/@educenter' },
      tiktok: { type: String, default: 'https://tiktok.com/@educenter' },
      website: { type: String, default: 'https://educenter.edu.vn' },
    },
  },
  {
    timestamps: true,
  }
);

export const Center: Model<ICenter> = mongoose.model<ICenter>('Center', centerSchema);
