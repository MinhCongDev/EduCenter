import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Payment, Enrollment } from '../models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Lỗi: MONGODB_URI không tồn tại trong file .env');
  process.exit(1);
}

function generateDistributedDates(): Date[] {
  const dates: Date[] = [];

  // 1. Tháng 6/2026 (16 giao dịch): Tuyển sinh hè sớm (từ 05/06 đến 29/06)
  for (let i = 0; i < 16; i++) {
    const day = 5 + Math.floor((i * 24) / 16);
    const hour = 8 + ((i * 7) % 12);
    const min = (i * 17) % 60;
    const sec = (i * 23) % 60;
    dates.push(new Date(2026, 5, day, hour, min, sec));
  }

  // 2. Tháng 7/2026 (22 giao dịch): Tuyển sinh đợt 2 hè (từ 02/07 đến 30/07)
  for (let i = 0; i < 22; i++) {
    const day = 2 + Math.floor((i * 28) / 22);
    const hour = 8 + ((i * 5) % 13);
    const min = (i * 19) % 60;
    const sec = (i * 29) % 60;
    dates.push(new Date(2026, 6, day, hour, min, sec));
  }

  // 3. Tháng 8/2026 (32 giao dịch): Chuẩn bị kỳ nhập học mùa thu (từ 01/08 đến 31/08)
  for (let i = 0; i < 32; i++) {
    const day = 1 + Math.floor((i * 30) / 32);
    const hour = 8 + ((i * 7) % 13);
    const min = (i * 13) % 60;
    const sec = (i * 31) % 60;
    dates.push(new Date(2026, 7, day, hour, min, sec));
  }

  // 4. Tháng 9/2026 (48 giao dịch): Cao điểm khai giảng mùa thu (từ 01/09 đến 30/09)
  for (let i = 0; i < 48; i++) {
    const day = 1 + Math.floor((i * 29) / 48);
    const hour = 8 + ((i * 11) % 13);
    const min = (i * 23) % 60;
    const sec = (i * 37) % 60;
    dates.push(new Date(2026, 8, day, hour, min, sec));
  }

  // 5. Tháng 10/2026 (36 giao dịch): Nhập học bổ sung & đợt giữa kỳ (từ 01/10 đến 31/10)
  for (let i = 0; i < 36; i++) {
    const day = 1 + Math.floor((i * 30) / 36);
    const hour = 8 + ((i * 7) % 13);
    const min = (i * 29) % 60;
    const sec = (i * 41) % 60;
    dates.push(new Date(2026, 9, day, hour, min, sec));
  }

  // 6. Tháng 11/2026 (28 giao dịch): Tháng hiện tại (từ 01/11 đến 14/11/2026)
  // - 13 giao dịch từ 01/11 đến 07/11 (trong 30 ngày qua)
  for (let i = 0; i < 13; i++) {
    const day = 1 + Math.floor((i * 6) / 13);
    const hour = 8 + ((i * 5) % 13);
    const min = (i * 17) % 60;
    const sec = (i * 43) % 60;
    dates.push(new Date(2026, 10, day, hour, min, sec));
  }
  // - 8 giao dịch từ 08/11 đến 12/11 (trong 7 ngày qua)
  for (let i = 0; i < 8; i++) {
    const day = 8 + Math.floor((i * 4) / 8);
    const hour = 9 + ((i * 3) % 11);
    const min = (i * 21) % 60;
    const sec = (i * 47) % 60;
    dates.push(new Date(2026, 10, day, hour, min, sec));
  }
  // - 3 giao dịch ngày 13/11 (hôm qua)
  dates.push(new Date(2026, 10, 13, 9, 15, 20));
  dates.push(new Date(2026, 10, 13, 14, 30, 45));
  dates.push(new Date(2026, 10, 13, 17, 45, 10));

  // - 4 giao dịch ngày 14/11 (hôm nay)
  dates.push(new Date(2026, 10, 14, 8, 45, 12));
  dates.push(new Date(2026, 10, 14, 10, 20, 35));
  dates.push(new Date(2026, 10, 14, 14, 15, 50));
  dates.push(new Date(2026, 10, 14, 16, 30, 18));

  return dates;
}

async function run() {
  console.log('====================================================');
  console.log('📅 CẬP NHẬT PHÂN BỔ DOANH THU THEO CÁC NGÀY THÁNG');
  console.log('====================================================');

  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI as string);
    console.log(`✅ Kết nối thành công! Database: ${mongoose.connection.name}`);

    const payments = await Payment.find().sort({ _id: 1 });
    console.log(`📊 Tìm thấy ${payments.length} giao dịch học phí trong cơ sở dữ liệu.`);

    const generatedDates = generateDistributedDates();

    // Để các khóa học và lớp học đều có học viên phân bổ đều các tháng,
    // ta sử dụng bước nhảy phân tán (stride) giúp xáo trộn đều học viên giữa các lớp
    const totalCount = payments.length;
    const stride = 37; // số nguyên tố cùng nhau với 182 để tạo permutation tuần hoàn

    let updatedCount = 0;
    const monthlyStats: Record<string, { count: number; totalAmount: number }> = {};

    for (let i = 0; i < totalCount; i++) {
      const p = payments[i];
      // Ánh xạ phân tán để mỗi lớp đều có giao dịch ở các tháng khác nhau
      const dateIndex = (i * stride) % generatedDates.length;
      const targetDate = generatedDates[dateIndex];

      const monthKey = `T${String(targetDate.getMonth() + 1).padStart(2, '0')}/${targetDate.getFullYear()}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { count: 0, totalAmount: 0 };
      }
      monthlyStats[monthKey].count += 1;
      monthlyStats[monthKey].totalAmount += p.amount || 0;

      const yr = targetDate.getFullYear();
      const mo = String(targetDate.getMonth() + 1).padStart(2, '0');
      const da = String(targetDate.getDate()).padStart(2, '0');
      const invoiceId = `INV-${yr}${mo}-${String(i + 1).padStart(4, '0')}`;
      const transactionCode = `TXN${yr.toString().slice(-2)}${mo}${da}${String(i + 1).padStart(4, '0')}`;

      // Cập nhật Payment
      await Payment.collection.updateOne(
        { _id: p._id },
        {
          $set: {
            paymentDate: targetDate,
            createdAt: targetDate,
            updatedAt: targetDate,
            invoiceId: invoiceId,
            transactionCode: transactionCode,
          },
        }
      );

      // Cập nhật Enrollment tương ứng
      if (p.enrollment) {
        const regDate = new Date(targetDate.getTime() - 2 * 24 * 60 * 60 * 1000); // đăng ký trước 2 ngày
        await Enrollment.collection.updateOne(
          { _id: p.enrollment },
          {
            $set: {
              registrationDate: regDate,
              enrollmentDate: targetDate,
            },
          }
        );
      }

      updatedCount++;
    }

    console.log(`\n✅ Đã cập nhật thành công ${updatedCount} giao dịch học phí.`);
    console.log('\n📈 BẢNG TỔNG HỢP DOANH THU THEO TỪNG THÁNG:');
    console.table(
      Object.entries(monthlyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          'Tháng': month,
          'Số lượng GD': `${data.count} GD`,
          'Doanh thu (VNĐ)': new Intl.NumberFormat('vi-VN').format(data.totalAmount) + ' đ',
        }))
    );

    // Kiểm tra bộ lọc ngày
    const now = Date.now();
    const allUpdated = await Payment.find({ status: 'SUCCESS' }).lean();
    const todayTxns = allUpdated.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt).getTime();
      return now - d <= 24 * 60 * 60 * 1000;
    });
    const sevenDaysTxns = allUpdated.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt).getTime();
      return now - d <= 7 * 24 * 60 * 60 * 1000;
    });
    const thirtyDaysTxns = allUpdated.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt).getTime();
      return now - d <= 30 * 24 * 60 * 60 * 1000;
    });
    const thisMonthTxns = allUpdated.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      const cur = new Date();
      return d.getMonth() === cur.getMonth() && d.getFullYear() === cur.getFullYear();
    });

    console.log('\n🔍 KIỂM TRA BỘ LỌC THỜI GIAN GIAO DỊCH (DIRECTOR DASHBOARD):');
    console.log(`- Hôm nay (TODAY - 24 giờ qua):   ${todayTxns.length} GD thành công`);
    console.log(`- 7 ngày qua (7_DAYS):           ${sevenDaysTxns.length} GD thành công`);
    console.log(`- 30 ngày qua (30_DAYS):         ${thirtyDaysTxns.length} GD thành công`);
    console.log(`- Tháng này (THIS_MONTH - T11):  ${thisMonthTxns.length} GD thành công`);

    console.log('\n====================================================');
    console.log('🎉 CẬP NHẬT DOANH THU THEO NGÀY THÁNG HOÀN TẤT!');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Lỗi khi phân bổ doanh thu:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn với MongoDB Atlas.');
  }
}

run();

