import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import {
  User,
  Staff,
  Teacher,
  Student,
  Course,
  Class,
  Enrollment,
  ClassTeacher,
  ClassSchedule,
  Assignment,
  Submission,
  Attendance,
  Payment,
  Announcement,
  Notification,
  Feedback,
  Center,
  ChangeRequest,
  Grade,
  StudentProgress,
} from '../models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Lỗi: MONGODB_URI không tồn tại trong file .env');
  process.exit(1);
}

// 182 distinct Vietnamese names
const VIETNAMESE_NAMES: Array<{ fullName: string; gender: 'Nam' | 'Nữ'; goal: string }> = [
  // Beginner 01 (15 students)
  { fullName: 'Nguyễn Minh Quân', gender: 'Nam', goal: 'Xây dựng lại nền tảng phát âm và từ vựng cơ bản' },
  { fullName: 'Trần Thảo Vy', gender: 'Nữ', goal: 'Lấy lại căn bản tiếng Anh sau 4 năm đi làm' },
  { fullName: 'Lê Hoàng Long', gender: 'Nam', goal: 'Chuẩn bị nhập học đại học và giao tiếp tự tin' },
  { fullName: 'Phạm Khánh Ngọc', gender: 'Nữ', goal: 'Cải thiện phản xạ nghe nói tiếng Anh hàng ngày' },
  { fullName: 'Vũ Đình Khôi', gender: 'Nam', goal: 'Học ngữ pháp từ đầu để phục vụ công việc IT' },
  { fullName: 'Đỗ Phương Anh', gender: 'Nữ', goal: 'Xóa mất gốc tiếng Anh và định hướng thi IELTS' },
  { fullName: 'Hoàng Gia Bảo', gender: 'Nam', goal: 'Luyện tập phát âm chuẩn IPA và từ vựng cốt lõi' },
  { fullName: 'Bùi Thanh Trúc', gender: 'Nữ', goal: 'Lấy lại tự tin khi nói tiếng Anh trước đám đông' },
  { fullName: 'Đặng Quang Huy', gender: 'Nam', goal: 'Nâng cao khả năng đọc hiểu tài liệu chuyên ngành' },
  { fullName: 'Ngô Bảo Hân', gender: 'Nữ', goal: 'Học bài bản từ con số 0 để chuẩn bị du học' },
  { fullName: 'Phan Tiến Đạt', gender: 'Nam', goal: 'Cải thiện phản xạ nghe cơ bản trong 2 tháng' },
  { fullName: 'Dương Mỹ Linh', gender: 'Nữ', goal: 'Tự tin viết email và giao tiếp tiếng Anh cơ bản' },
  { fullName: 'Tạ Hải Đăng', gender: 'Nam', goal: 'Nắm chắc 12 thì cơ bản và cấu trúc câu thông dụng' },
  { fullName: 'Lý Ngọc Diệp', gender: 'Nữ', goal: 'Phát âm chuẩn giọng Anh - Mỹ từ cơ bản' },
  { fullName: 'Trịnh Công Sơn', gender: 'Nam', goal: 'Xây dựng thói quen tự học tiếng Anh mỗi ngày' },

  // Beginner 02 (18 students)
  { fullName: 'Mai Tuyết Nhi', gender: 'Nữ', goal: 'Lấy lại gốc tiếng Anh để đổi môi trường làm việc' },
  { fullName: 'Cao Đức Mạnh', gender: 'Nam', goal: 'Bắt đầu từ bảng phiên âm IPA và 1000 từ vựng cốt lõi' },
  { fullName: 'Chu Hồng Nhung', gender: 'Nữ', goal: 'Nâng cao phản xạ giao tiếp với đồng nghiệp nước ngoài' },
  { fullName: 'Hà Quốc Trung', gender: 'Nam', goal: 'Củng cố ngữ pháp căn bản để thi các chứng chỉ quốc tế' },
  { fullName: 'Tô Minh Thư', gender: 'Nữ', goal: 'Khắc phục tâm lý sợ nói tiếng Anh khi gặp người lạ' },
  { fullName: 'Đinh Tuấn Tú', gender: 'Nam', goal: 'Chuẩn bị kiến thức nền tảng để học tiếp IELTS 4.0' },
  { fullName: 'Lương Gia Linh', gender: 'Nữ', goal: 'Cải thiện kỹ năng nghe hiểu qua phim ảnh và podcast' },
  { fullName: 'Vương Thành Nam', gender: 'Nam', goal: 'Học từ vựng theo chủ đề đời sống thông dụng' },
  { fullName: 'Nghiêm Kiều Trang', gender: 'Nữ', goal: 'Rèn luyện khả năng đặt câu và phản xạ hội thoại' },
  { fullName: 'Kiều Anh Tuấn', gender: 'Nam', goal: 'Hệ thống hóa toàn bộ ngữ pháp tiếng Anh từ đầu' },
  { fullName: 'Thái Bảo Ngọc', gender: 'Nữ', goal: 'Tự tin tham gia các buổi phỏng vấn bằng tiếng Anh' },
  { fullName: 'La Minh Đức', gender: 'Nam', goal: 'Cải thiện điểm số tiếng Anh tại trường đại học' },
  { fullName: 'Doãn Thu Uyên', gender: 'Nữ', goal: 'Xây dựng nền tảng từ vựng để chuẩn bị du học hè' },
  { fullName: 'Khổng Trọng Nghĩa', gender: 'Nam', goal: 'Học kỹ năng phát âm nối âm, nuốt âm cơ bản' },
  { fullName: 'Mạc Kim Ngân', gender: 'Nữ', goal: 'Chuẩn bị kiến thức tiếng Anh cho công việc du lịch' },
  { fullName: 'Từ Nhật Hào', gender: 'Nam', goal: 'Khắc phục việc nghe không kịp các đoạn hội thoại ngắn' },
  { fullName: 'Quách Thanh Vân', gender: 'Nữ', goal: 'Luyện tập ngữ điệu tự nhiên khi giao tiếp' },
  { fullName: 'Bạch Xuân Trường', gender: 'Nam', goal: 'Xóa bỏ rào cản tiếng Anh sau nhiều năm không dùng' },

  // Foundation 01 (16 students)
  { fullName: 'Lưu Tường Vi', gender: 'Nữ', goal: 'Làm quen định dạng bài thi IELTS 4 kỹ năng' },
  { fullName: 'Âu Dương Phong', gender: 'Nam', goal: 'Nâng band từ 3.0 lên 4.0 trong 3 tháng' },
  { fullName: 'Phùng Gia Kiệt', gender: 'Nam', goal: 'Luyện tập phát âm chuẩn và bổ sung 1500 từ vựng' },
  { fullName: 'Hồ Bảo Trâm', gender: 'Nữ', goal: 'Luyện nghe các dạng bài Section 1 & 2 IELTS' },
  { fullName: 'Trương Hoàng Nam', gender: 'Nam', goal: 'Học cách làm bài đọc hiểu IELTS Passage 1 cơ bản' },
  { fullName: 'Đoàn Thùy Dung', gender: 'Nữ', goal: 'Luyện tập viết câu phức và đoạn văn mạch lạc' },
  { fullName: 'Lâm Quốc Anh', gender: 'Nam', goal: 'Mở rộng vốn từ học thuật Academic Word List' },
  { fullName: 'Võ Mai Chi', gender: 'Nữ', goal: 'Tập nói Part 1 IELTS trôi chảy không bị ngập ngừng' },
  { fullName: 'Nguyễn Đức Trọng', gender: 'Nam', goal: 'Cải thiện kỹ năng Skimming & Scanning trong Reading' },
  { fullName: 'Trần Lan Hương', gender: 'Nữ', goal: 'Nắm vững phương pháp làm bài nghe Form Completion' },
  { fullName: 'Lê Việt Hùng', gender: 'Nam', goal: 'Phát triển ý tưởng cho bài thi Speaking Part 1 & 2' },
  { fullName: 'Phạm Thu Hằng', gender: 'Nữ', goal: 'Học cách viết biểu đồ cơ bản IELTS Writing Task 1' },
  { fullName: 'Hoàng Hữu Thắng', gender: 'Nam', goal: 'Xây dựng phương pháp ghi chép hiệu quả khi làm Listening' },
  { fullName: 'Vũ Yến Nhi', gender: 'Nữ', goal: 'Chuẩn bị hồ sơ xét tuyển thẳng đại học bằng chứng chỉ IELTS' },
  { fullName: 'Đỗ Thế Vinh', gender: 'Nam', goal: 'Cải thiện ngữ pháp câu bị động và mệnh đề quan hệ' },
  { fullName: 'Bùi Kim Chi', gender: 'Nữ', goal: 'Tăng tốc độ đọc hiểu và mở rộng từ đồng nghĩa Synonyms' },

  // Foundation 02 (17 students)
  { fullName: 'Đặng Khắc Huy', gender: 'Nam', goal: 'Luyện đề IELTS Foundation định kỳ mỗi tuần' },
  { fullName: 'Ngô Thùy Linh', gender: 'Nữ', goal: 'Học chiến thuật tránh bẫy trong Listening Section 1' },
  { fullName: 'Phan Đăng Khoa', gender: 'Nam', goal: 'Rèn luyện phản xạ phát âm chuẩn giọng quốc tế' },
  { fullName: 'Dương Quỳnh Anh', gender: 'Nữ', goal: 'Tự tin đạt Band 4.0 - 4.5 trước kỳ xét tốt nghiệp' },
  { fullName: 'Tạ Trọng Nhân', gender: 'Nam', goal: 'Cải thiện kỹ năng viết đoạn thân bài Task 1 rõ ràng' },
  { fullName: 'Lý Minh Châu', gender: 'Nữ', goal: 'Học cách liên kết câu bằng Cohesive Devices cơ bản' },
  { fullName: 'Trịnh Tuấn Kiệt', gender: 'Nam', goal: 'Mở rộng vốn từ vựng chủ đề Giáo dục và Môi trường' },
  { fullName: 'Mai Thục Quyên', gender: 'Nữ', goal: 'Luyện tập kỹ năng Paraphrasing cho câu mở bài Task 1' },
  { fullName: 'Cao Trí Dũng', gender: 'Nam', goal: 'Làm quen dạng bài True / False / Not Given trong Reading' },
  { fullName: 'Chu Cẩm Ly', gender: 'Nữ', goal: 'Khắc phục lỗi sai số ít số nhiều khi điền từ Listening' },
  { fullName: 'Hà Nhật Minh', gender: 'Nam', goal: 'Rèn luyện kỹ năng nghe chính tả chính xác từng từ' },
  { fullName: 'Tô Khánh Linh', gender: 'Nữ', goal: 'Phát triển phản xạ trả lời nhanh trong Speaking Part 1' },
  { fullName: 'Đinh Hữu Phước', gender: 'Nam', goal: 'Củng cố các chủ điểm ngữ pháp trọng yếu trong bài thi' },
  { fullName: 'Lương Thảo Nguyên', gender: 'Nữ', goal: 'Nâng cao sự tự tin khi đối thoại trực tiếp với giáo viên' },
  { fullName: 'Vương Minh Trí', gender: 'Nam', goal: 'Luyện tập các dạng bài đọc hiểu Multiple Choice cơ bản' },
  { fullName: 'Nghiêm Thu Trang', gender: 'Nữ', goal: 'Học cách dùng Linking Words tự nhiên không gượng ép' },
  { fullName: 'Kiều Quốc Huy', gender: 'Nam', goal: 'Đạt mục tiêu chuyển lớp sang Pre-Intermediate sớm nhất' },

  // Pre-Intermediate 01 (14 students)
  { fullName: 'Thái Diệu Huyền', gender: 'Nữ', goal: 'Bứt phá mục tiêu Band 5.0 phục vụ du học hè' },
  { fullName: 'La Văn Toàn', gender: 'Nam', goal: 'Làm quen Writing Task 2 dạng Opinion Essay' },
  { fullName: 'Doãn Bích Phương', gender: 'Nữ', goal: 'Cải thiện kỹ năng nghe Section 2 & Section 3' },
  { fullName: 'Khổng Anh Dũng', gender: 'Nam', goal: 'Luyện kỹ năng nói liền mạch 2 phút trong Speaking Part 2' },
  { fullName: 'Mạc Thanh Mai', gender: 'Nữ', goal: 'Nắm vững kỹ thuật Skim & Scan dạng bài Matching Headings' },
  { fullName: 'Từ Hùng Cường', gender: 'Nam', goal: 'Nâng vốn từ Collocations chủ đề Công nghệ và Đời sống' },
  { fullName: 'Quách Phương Thảo', gender: 'Nữ', goal: 'Học cách phân tích đề và lập dàn ý Writing Task 2 trong 5 phút' },
  { fullName: 'Bạch Trọng Hiếu', gender: 'Nam', goal: 'Khắc phục việc mất tập trung trong bài thi Nghe kéo dài 30 phút' },
  { fullName: 'Lưu Kiều Oanh', gender: 'Nữ', goal: 'Luyện tập phát âm có ngữ điệu và trọng âm câu tự nhiên' },
  { fullName: 'Âu Duy Khánh', gender: 'Nam', goal: 'Nâng điểm Reading bằng cách phân tích từ vựng bẫy' },
  { fullName: 'Phùng Diễm My', gender: 'Nữ', goal: 'Luyện tập miêu tả biểu đồ đường và biểu đồ cột trong Task 1' },
  { fullName: 'Hồ Hoàng Hải', gender: 'Nam', goal: 'Tự tin trình bày ý kiến cá nhân trong Speaking Part 3' },
  { fullName: 'Trương Thúy Nga', gender: 'Nữ', goal: 'Bổ sung các cụm Phrasal Verbs học thuật hữu ích' },
  { fullName: 'Đoàn Nam Phong', gender: 'Nam', goal: 'Tăng band điểm tổng thể từ 4.5 lên 5.5 trong khóa này' },

  // Pre-Intermediate 02 (16 students)
  { fullName: 'Lâm Minh Hằng', gender: 'Nữ', goal: 'Chinh phục kỳ thi IELTS máy tính quý 1 năm sau' },
  { fullName: 'Võ Quốc Thắng', gender: 'Nam', goal: 'Nâng cao kỹ năng viết luận học thuật đúng cấu trúc 4 đoạn' },
  { fullName: 'Nguyễn Bích Ngọc', gender: 'Nữ', goal: 'Luyện kỹ năng nghe nhận diện quan điểm của người nói' },
  { fullName: 'Trần Gia Huy', gender: 'Nam', goal: 'Khắc phục lỗi ngắt quãng khi nói tiếng Anh' },
  { fullName: 'Lê Thùy Trang', gender: 'Nữ', goal: 'Học phương pháp giải đề Matching Information nhanh chóng' },
  { fullName: 'Phạm Đức Duy', gender: 'Nam', goal: 'Cải thiện kỹ năng triển khai luận điểm trong Writing Task 2' },
  { fullName: 'Hoàng Mai Phương', gender: 'Nữ', goal: 'Luyện tập mô tả bản đồ Maps và quy trình Process trong Task 1' },
  { fullName: 'Vũ Quốc Bảo', gender: 'Nam', goal: 'Mở rộng vốn từ vựng chuyên sâu về Môi trường & Đô thị' },
  { fullName: 'Đỗ Kim Oanh', gender: 'Nữ', goal: 'Tập trung luyện đề Cambridge IELTS 14 - 17 định kỳ' },
  { fullName: 'Bùi Thế Anh', gender: 'Nam', goal: 'Rèn luyện khả năng paraphrasing đề bài và câu chủ đề' },
  { fullName: 'Đặng Ngọc Ánh', gender: 'Nữ', goal: 'Phát triển ý tưởng phong phú cho các chủ đề Speaking trừu tượng' },
  { fullName: 'Ngô Thanh Tùng', gender: 'Nam', goal: 'Khắc phục lỗi ngữ pháp mạo từ a/an/the và giới từ' },
  { fullName: 'Phan Thu Hà', gender: 'Nữ', goal: 'Học kỹ thuật đoán nghĩa từ vựng mới qua ngữ cảnh văn bản' },
  { fullName: 'Dương Hải Nam', gender: 'Nam', goal: 'Cải thiện tốc độ làm bài Reading đảm bảo hoàn thành 3 bài đọc' },
  { fullName: 'Tạ Minh Thư', gender: 'Nữ', goal: 'Xây dựng phong thái tự tin khi giao tiếp cùng giám khảo' },
  { fullName: 'Lý Quốc Đạt', gender: 'Nam', goal: 'Đạt chuẩn 5.0 để xin học bổng chương trình trao đổi sinh viên' },

  // Intermediate 01 (15 students)
  { fullName: 'Trịnh Hoàng Yến', gender: 'Nữ', goal: 'Chinh phục mục tiêu 6.0 IELTS để miễn thi tốt nghiệp ĐH' },
  { fullName: 'Mai Văn Hùng', gender: 'Nam', goal: 'Thành thạo các dạng biểu đồ phối hợp trong Writing Task 1' },
  { fullName: 'Cao Quỳnh Dao', gender: 'Nữ', goal: 'Nâng band Listening từ 5.5 lên 6.5 bằng phương pháp nghe chép' },
  { fullName: 'Chu Đình Trọng', gender: 'Nam', goal: 'Luyện phản xạ lập luận logic trong Speaking Part 3' },
  { fullName: 'Hà Phương Linh', gender: 'Nữ', goal: 'Học cách tránh bẫy câu hỏi Yes / No / Not Given nâng cao' },
  { fullName: 'Tô Đức Anh', gender: 'Nam', goal: 'Sử dụng cấu trúc câu đảo ngữ và câu điều kiện hỗn hợp' },
  { fullName: 'Đinh Lan Anh', gender: 'Nữ', goal: 'Tăng tốc độ đọc hiểu học thuật và phân tích bài đọc dài' },
  { fullName: 'Lương Hữu Đức', gender: 'Nam', goal: 'Luyện tập viết các dạng luận Discussion & Both Views' },
  { fullName: 'Vương Bảo Trâm', gender: 'Nữ', goal: 'Khắc phục việc thiếu ý tưởng khi gặp đề bài Writing trừu tượng' },
  { fullName: 'Nghiêm Minh Quân', gender: 'Nam', goal: 'Phát triển ngữ điệu và trọng âm câu đạt chuẩn 6.5+' },
  { fullName: 'Kiều Thúy Hằng', gender: 'Nữ', goal: 'Học cách chọn lọc thông tin nổi bật nhất trong Task 1' },
  { fullName: 'Thái Hoàng Long', gender: 'Nam', goal: 'Luyện tập kỹ năng nghe bài giảng Section 4 không bị miss ý' },
  { fullName: 'La Ngọc Mai', gender: 'Nữ', goal: 'Xây dựng vốn từ vựng C1 về Kinh tế và Khoa học công nghệ' },
  { fullName: 'Doãn Thanh Phong', gender: 'Nam', goal: 'Nâng điểm thi thử 4 kỹ năng đạt mức ổn định 6.0' },
  { fullName: 'Khổng Thảo My', gender: 'Nữ', goal: 'Chuẩn bị hồ sơ săn học bổng du học Anh quốc' },

  // Intermediate 02 (18 students)
  { fullName: 'Mạc Quang Huy', gender: 'Nam', goal: 'Nâng band Writing Task 2 lên mức 6.5 phục vụ định cư' },
  { fullName: 'Từ Bích Hạnh', gender: 'Nữ', goal: 'Luyện tập bài nghe Section 3 học thuật về nghiên cứu khoa học' },
  { fullName: 'Quách Đức Minh', gender: 'Nam', goal: 'Phát triển vốn Collocations tự nhiên cho bài thi Speaking' },
  { fullName: 'Bạch Thu Trang', gender: 'Nữ', goal: 'Luyện tập quản lý thời gian thi Reading dưới áp lực thật' },
  { fullName: 'Lưu Nhật Quang', gender: 'Nam', goal: 'Sử dụng thuần thục các liên từ học thuật và trạng từ nối' },
  { fullName: 'Âu Phương Thảo', gender: 'Nữ', goal: 'Luyện tập giải đề thi thật tại phòng thi máy tính EduCenter' },
  { fullName: 'Phùng Minh Khôi', gender: 'Nam', goal: 'Học cách lập luận chặt chẽ tránh lỗi Fallacy trong Writing' },
  { fullName: 'Hồ Thùy Chi', gender: 'Nữ', goal: 'Nâng điểm Speaking Part 2 với dàn ý PEEL chuyên sâu' },
  { fullName: 'Trương Gia Huy', gender: 'Nam', goal: 'Khắc phục điểm yếu kỹ năng Đọc và Nghe các chủ đề Lịch sử' },
  { fullName: 'Đoàn Yến Nhi', gender: 'Nữ', goal: 'Tập trung luyện dạng bài Summary Completion trong Reading' },
  { fullName: 'Lâm Hoàng Bách', gender: 'Nam', goal: 'Học chiến thuật ghi nhớ nhanh từ khóa khi đọc câu hỏi nghe' },
  { fullName: 'Võ Minh Thư', gender: 'Nữ', goal: 'Cải thiện cách sử dụng từ ngữ trang trọng trong thư từ học thuật' },
  { fullName: 'Nguyễn Đức Toàn', gender: 'Nam', goal: 'Chinh phục kỳ thi IELTS Computer-delivered đạt 6.5+' },
  { fullName: 'Trần Bảo Ngọc', gender: 'Nữ', goal: 'Rèn luyện khả năng mở rộng câu trả lời bằng ví dụ thực tế' },
  { fullName: 'Lê Tiến Dũng', gender: 'Nam', goal: 'Sử dụng vốn từ đa dạng không lặp từ trong bài viết luận' },
  { fullName: 'Phạm Thu Thảo', gender: 'Nữ', goal: 'Đạt điều kiện chuẩn đầu vào thạc sĩ tại trường ĐH RMIT' },
  { fullName: 'Hoàng Quốc Khánh', gender: 'Nam', goal: 'Luyện tập chiến thuật nghe phân biệt các giọng Anh, Úc, Mỹ' },
  { fullName: 'Vũ Mai Linh', gender: 'Nữ', goal: 'Tối ưu hóa điểm số Speaking Part 1 và Part 3 cùng giáo viên bản xứ' },

  // Upper-Intermediate 01 (12 students)
  { fullName: 'Đỗ Hữu Thịnh', gender: 'Nam', goal: 'Chinh phục Band 7.0 mục tiêu du học châu Âu' },
  { fullName: 'Bùi Thanh Hằng', gender: 'Nữ', goal: 'Nâng cao độ chính xác và tính học thuật trong Writing Task 2' },
  { fullName: 'Đặng Tuấn Anh', gender: 'Nam', goal: 'Đạt điểm Reading 8.0+ bằng kỹ thuật phân tích câu phức' },
  { fullName: 'Ngô Diễm Quỳnh', gender: 'Nữ', goal: 'Sử dụng các cấu trúc C1 - C2 tự nhiên trong bài thi Nói' },
  { fullName: 'Phan Minh Trí', gender: 'Nam', goal: 'Luyện tập phản xạ trả lời câu hỏi phản biện chuyên sâu Part 3' },
  { fullName: 'Dương Thảo Linh', gender: 'Nữ', goal: 'Nắm vững kỹ năng viết bài Process và Multiple Charts nâng cao' },
  { fullName: 'Tạ Quốc Đạt', gender: 'Nam', goal: 'Đạt điểm Listening 8.0+ tại kỳ thi chính thức' },
  { fullName: 'Lý Mai Anh', gender: 'Nữ', goal: 'Bổ sung vốn Idiomatic Vocabulary tự nhiên và tinh tế' },
  { fullName: 'Trịnh Hoàng Long', gender: 'Nam', goal: 'Rèn luyện kỹ năng viết luận Problem - Solution chuyên sâu' },
  { fullName: 'Mai Bảo Trâm', gender: 'Nữ', goal: 'Săn học bổng toàn phần du học bậc đại học tại Hà Lan' },
  { fullName: 'Cao Thế Vinh', gender: 'Nam', goal: 'Phát triển tư duy phản biện Critical Thinking trong bài viết' },
  { fullName: 'Chu Thanh Trúc', gender: 'Nữ', goal: 'Luyện đề cấp tốc cùng cựu giám khảo chấm thi IELTS' },

  // Upper-Intermediate 02 (15 students)
  { fullName: 'Hà Minh Khôi', gender: 'Nam', goal: 'Đạt chứng chỉ IELTS 7.0 xét tuyển thẳng Đại học Bách Khoa' },
  { fullName: 'Tô Thu Hương', gender: 'Nữ', goal: 'Tối ưu hóa điểm số Task 1 và Task 2 đạt tối thiểu 6.5 Writing' },
  { fullName: 'Đinh Trọng Nghĩa', gender: 'Nam', goal: 'Nâng band điểm Speaking lên 7.5 bằng cách mở rộng ý tưởng' },
  { fullName: 'Lương Kiều Anh', gender: 'Nữ', goal: 'Rèn luyện kỹ năng nghe hiểu các bài thuyết trình chuyên sâu' },
  { fullName: 'Vương Gia Kiệt', gender: 'Nam', goal: 'Làm chủ kỹ thuật phân tích lỗi sai trong đề Cambridge 16 - 19' },
  { fullName: 'Nghiêm Thùy Trang', gender: 'Nữ', goal: 'Học cách liên kết ý tưởng logic chặt chẽ trong bài essay' },
  { fullName: 'Kiều Hải Đăng', gender: 'Nam', goal: 'Chuẩn bị hồ sơ ứng tuyển vị trí chuyên viên đối ngoại' },
  { fullName: 'Thái Phương Thảo', gender: 'Nữ', goal: 'Sử dụng từ ngữ học thuật chính xác về sắc thái biểu cảm' },
  { fullName: 'La Đức Mạnh', gender: 'Nam', goal: 'Tập trung luyện đề thi thử trên máy tính mô phỏng phòng thi thật' },
  { fullName: 'Doãn Kim Ngân', gender: 'Nữ', goal: 'Luyện kỹ năng kiểm soát thời gian thi Viết 60 phút nghiêm ngặt' },
  { fullName: 'Khổng Minh Đức', gender: 'Nam', goal: 'Phát triển vốn thành ngữ và cụm từ cố định tự nhiên' },
  { fullName: 'Mạc Hồng Nhung', gender: 'Nữ', goal: 'Bảo đảm kết quả đầu ra cam kết theo hợp đồng đào tạo' },
  { fullName: 'Từ Quốc Trung', gender: 'Nam', goal: 'Chinh phục band điểm overall 7.0 - 7.5' },
  { fullName: 'Quách Mỹ Linh', gender: 'Nữ', goal: 'Luyện phản xạ tư duy hoàn toàn bằng tiếng Anh' },
  { fullName: 'Bạch Tuấn Tú', gender: 'Nam', goal: 'Học hỏi chiến lược đạt điểm cao từ các cựu học viên 8.0+' },

  // Advanced 01 (12 students)
  { fullName: 'Lưu Gia Bảo', gender: 'Nam', goal: 'Chinh phục mục tiêu IELTS 8.0+ trở thành giảng viên trung tâm' },
  { fullName: 'Âu Mai Chi', gender: 'Nữ', goal: 'Săn học bổng Thạc sĩ Chevening tại Vương quốc Anh' },
  { fullName: 'Phùng Hoàng Nam', gender: 'Nam', goal: 'Đạt điểm Reading và Listening tối đa 9.0' },
  { fullName: 'Hồ Lan Hương', gender: 'Nữ', goal: 'Hoàn thiện kỹ năng viết Task 2 đạt band điểm 7.5 - 8.0' },
  { fullName: 'Trương Việt Hùng', gender: 'Nam', goal: 'Luyện phong thái và ngữ điệu tự nhiên như người bản xứ' },
  { fullName: 'Đoàn Thu Hằng', gender: 'Nữ', goal: 'Sử dụng cấu trúc câu biến hóa linh hoạt trong mọi chủ đề' },
  { fullName: 'Lâm Hữu Thắng', gender: 'Nam', goal: 'Phân tích và khắc phục những lỗi sai tinh vi trong bài thi' },
  { fullName: 'Võ Yến Nhi', gender: 'Nữ', goal: 'Đạt mục tiêu IELTS 8.0 phục vụ định cư Canada diện tay nghề cao' },
  { fullName: 'Nguyễn Thế Vinh', gender: 'Nam', goal: 'Luyện tập các đề thi Speaking khó nhất cùng chuyên gia 9.0' },
  { fullName: 'Trần Kim Chi', gender: 'Nữ', goal: 'Tham gia các diễn đàn học thuật quốc tế bằng tiếng Anh' },
  { fullName: 'Lê Khắc Huy', gender: 'Nam', goal: 'Nâng cao khả năng sử dụng tiếng Anh học thuật trong nghiên cứu' },
  { fullName: 'Phạm Thùy Linh', gender: 'Nữ', goal: 'Chinh phục cột mốc IELTS 8.5 trước kỳ tốt nghiệp' },

  // Advanced 02 (14 students)
  { fullName: 'Hoàng Đăng Khoa', gender: 'Nam', goal: 'Đạt chứng chỉ IELTS 8.0+ để giảng dạy chuyên sâu' },
  { fullName: 'Vũ Quỳnh Anh', gender: 'Nữ', goal: 'Luyện kỹ năng tranh biện và bảo vệ luận điểm tiếng Anh học thuật' },
  { fullName: 'Đỗ Trọng Nhân', gender: 'Nam', goal: 'Tối ưu hóa điểm số Speaking và Writing đạt mức xuất sắc' },
  { fullName: 'Bùi Minh Châu', gender: 'Nữ', goal: 'Chuẩn bị hồ sơ nghiên cứu sinh tiến sĩ tại Australia' },
  { fullName: 'Đặng Tuấn Kiệt', gender: 'Nam', goal: 'Làm chủ các chủ đề triết học, nghệ thuật và xã hội học' },
  { fullName: 'Ngô Thục Quyên', gender: 'Nữ', goal: 'Đạt điểm tuyệt đối trong các bài thi thử Listening định kỳ' },
  { fullName: 'Phan Trí Dũng', gender: 'Nam', goal: 'Rèn luyện khả năng phát âm chuẩn xác từng âm vị học thuật' },
  { fullName: 'Dương Cẩm Ly', gender: 'Nữ', goal: 'Săn học bổng Fulbright Hoa Kỳ' },
  { fullName: 'Tạ Nhật Minh', gender: 'Nam', goal: 'Luyện tập kỹ thuật viết luận đỉnh cao không có lỗi ngữ pháp' },
  { fullName: 'Lý Khánh Linh', gender: 'Nữ', goal: 'Tự tin thuyết trình hội thảo trước các chuyên gia quốc tế' },
  { fullName: 'Trịnh Hữu Phước', gender: 'Nam', goal: 'Phát triển khả năng phản xạ và diễn đạt sâu sắc' },
  { fullName: 'Mai Thảo Nguyên', gender: 'Nữ', goal: 'Đạt Overall 8.0+ khẳng định năng lực tiếng Anh vượt trội' },
  { fullName: 'Cao Minh Trí', gender: 'Nam', goal: 'Trở thành trợ giảng và giáo viên luyện thi IELTS' },
  { fullName: 'Chu Thu Trang', gender: 'Nữ', goal: 'Chinh phục kỳ thi IELTS chính thức với thành tích cao nhất' },
];

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

async function seedAtlas() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU QUY TRÌNH TẠO DỮ LIỆU DEMO MONGODB ATLAS');
  console.log('====================================================');

  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI as string);
    console.log(`✅ Kết nối thành công! Database: ${mongoose.connection.name}`);

    // ==========================================
    // BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ TRÊN CÁC COLLECTIONS
    // ==========================================
    console.log('\n🧹 Bước 1: Xóa sạch dữ liệu cũ trong các collections hiện tại...');
    await Promise.all([
      User.deleteMany({}),
      Staff.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Enrollment.deleteMany({}),
      ClassTeacher.deleteMany({}),
      ClassSchedule.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      Center.deleteMany({}),
      ChangeRequest.deleteMany({}),
      Grade.deleteMany({}),
      StudentProgress.deleteMany({}),
    ]);
    console.log('✨ Đã làm sạch toàn bộ dữ liệu cũ.');

    // Xóa indexes cũ có thể gây lỗi trên attendances
    try {
      await Attendance.collection.dropIndexes();
    } catch {
      // bỏ qua nếu chưa có
    }

    // Password raw - Mongoose userSchema.pre('save') sẽ tự động hash bằng bcrypt
    const defaultRawPassword = 'EduCenter@2026';

    // ==========================================
    // BƯỚC 2: TẠO THÔNG TIN TRUNG TÂM (CENTER)
    // ==========================================
    console.log('\n🏛️ Bước 2: Tạo thông tin Trung tâm EduCenter IELTS Academy...');
    await Center.create({
      name: 'EduCenter IELTS Academy',
      slogan: 'Học viện Luyện thi IELTS 8.0+ Chuẩn Khảo thí Quốc tế IDP & BC',
      introduction:
        'EduCenter là tổ chức giáo dục đào tạo IELTS hàng đầu Việt Nam, đối tác chính thức của IDP và British Council. Đội ngũ 100% giảng viên đạt 8.5 - 9.0 IELTS Overall, hệ thống phòng thi máy tính độc quyền và hợp đồng cam kết đầu ra bằng văn bản pháp lý.',
      vision: 'Trở thành học viện khảo thí và đào tạo IELTS chuẩn mực số 1 tại Việt Nam.',
      mission: 'Kiến tạo môi trường học tiếng Anh chuẩn học thuật quốc tế, giúp học viên Việt Nam tự tin chinh phục học bổng, du học và định cư.',
      hotline: '1900 6868 - 0988 123 456',
      email: 'contact@educenter.edu.vn',
      workingHours: 'Thứ 2 - Chủ Nhật: 08:00 - 21:30',
      address: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
      branches: [
        { branchName: 'Cơ sở 1 (Trụ sở chính Cầu Giấy)', address: 'EduCenter Tower, 128 Cầu Giấy, Hà Nội', phone: '024 3789 6868', isHeadquarters: true },
        { branchName: 'Cơ sở 2 (Đống Đa)', address: 'Số 254 Tây Sơn, Đống Đa, Hà Nội', phone: '024 3789 6869', isHeadquarters: false },
        { branchName: 'Cơ sở 3 (Bách Khoa)', address: 'Số 86 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội', phone: '024 3789 6870', isHeadquarters: false },
        { branchName: 'Cơ sở 4 (TP. HCM - Quận 1)', address: 'Tòa nhà Bitexco Nam, 180 Nguyễn Thị Minh Khai, Q. 1, TP. HCM', phone: '028 3988 6868', isHeadquarters: false },
        { branchName: 'Cơ sở 5 (TP. HCM - Quận 10)', address: 'Số 387 Sư Vạn Hạnh, Q. 10, TP. HCM', phone: '028 3988 6869', isHeadquarters: false },
      ],
    });

    // ==========================================
    // BƯỚC 3: TẠO ADMIN & 2 STAFF
    // ==========================================
    console.log('\n👤 Bước 3: Tạo tài khoản Admin và 2 Cán bộ Giáo vụ...');
    // 1 Admin (tạo tài khoản chính admin@educenter.edu.vn và giữ director@educenter.edu.vn cùng admin)
    const adminUser = await User.create({
      email: 'admin@educenter.edu.vn',
      password: defaultRawPassword,
      fullName: 'Nguyễn Minh Công (Giám đốc Điều hành / Admin)',
      phone: '0988123456',
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      address: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, Hà Nội',
      dob: new Date('1988-06-15'),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    });

    // Đồng thời tạo user director@educenter.edu.vn trỏ vai trò ADMIN để người dùng đăng nhập bằng tài khoản cũ vẫn thành công
    await User.create({
      email: 'director@educenter.edu.vn',
      password: defaultRawPassword,
      fullName: 'Ban Giám Đốc EduCenter',
      phone: '0988123457',
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      address: '128 Cầu Giấy, Hà Nội',
      dob: new Date('1988-06-15'),
    });

    // 2 Staff
    const staff1User = await User.create({
      email: 'staff1@educenter.edu.vn',
      password: defaultRawPassword,
      fullName: 'Nguyễn Thu Hà',
      phone: '0977234567',
      role: 'TRAINING_STAFF',
      status: 'ACTIVE',
      isVerified: true,
      address: 'Số 45 Chùa Láng, Đống Đa, Hà Nội',
      dob: new Date('1994-03-22'),
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop',
    });

    await Staff.create({
      user: staff1User._id,
      staffCode: 'STF001',
      department: 'Phòng Đào tạo & Quản lý Giáo vụ',
      position: 'Trưởng ban Giáo vụ',
      joinDate: new Date('2021-08-15'),
      status: 'ACTIVE',
    });

    const staff2User = await User.create({
      email: 'staff2@educenter.edu.vn',
      password: defaultRawPassword,
      fullName: 'Trần Quốc Bảo',
      phone: '0983345678',
      role: 'TRAINING_STAFF',
      status: 'ACTIVE',
      isVerified: true,
      address: 'Số 12 Nguyễn Trãi, Thanh Xuân, Hà Nội',
      dob: new Date('1996-11-10'),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    });

    await Staff.create({
      user: staff2User._id,
      staffCode: 'STF002',
      department: 'Phòng Tuyển sinh & Hỗ trợ Khảo thí',
      position: 'Chuyên viên Khảo thí',
      joinDate: new Date('2022-03-01'),
      status: 'ACTIVE',
    });

    // Tạo alias staff@educenter.edu.vn để tương thích tài khoản cũ
    await User.create({
      email: 'staff@educenter.edu.vn',
      password: defaultRawPassword,
      fullName: 'Phòng Giáo Vụ EduCenter',
      phone: '0983345679',
      role: 'TRAINING_STAFF',
      status: 'ACTIVE',
      isVerified: true,
    });

    // ==========================================
    // BƯỚC 4: TẠO 8 GIÁO VIÊN (TEACHERS)
    // ==========================================
    console.log('\n👨‍🏫 Bước 4: Tạo 8 Giáo viên chuẩn IELTS 8.5+ - 9.0...');
    const TEACHER_INFOS = [
      {
        fullName: 'ThS. Đặng Hoàng Nam',
        email: 'teacher1@educenter.edu.vn',
        phone: '0912111222',
        specialization: ['IELTS Foundation', 'IELTS Beginner - Mất Gốc', 'Ngữ pháp & Phát âm'],
        bio: 'Thạc sĩ Ngôn ngữ Anh tại Đại học Quốc gia Hà Nội. 7 năm kinh nghiệm giảng dạy IELTS, chuyên sâu giúp học viên mất gốc lấy lại căn bản trong thời gian ngắn nhất.',
        qualifications: ['IELTS 8.5 Overall', 'Thạc sĩ Ngôn ngữ Anh (VNU)', 'Chứng chỉ giảng dạy CELTA (Cambridge)'],
        ieltsBand: 8.5,
        yearsOfExperience: 7,
      },
      {
        fullName: 'Cô Emily Watson',
        email: 'teacher2@educenter.edu.vn',
        phone: '0913222333',
        specialization: ['IELTS Speaking & Listening', 'IELTS Beginner & Foundation', 'Phát âm chuẩn IPA'],
        bio: 'Cử nhân Sư phạm Tiếng Anh tại Đại học Manchester (UK). 6 năm kinh nghiệm đào tạo học viên Việt Nam từ con số 0, giúp phát triển phản xạ giao tiếp tự nhiên.',
        qualifications: ['IELTS 9.0 Overall', 'CELTA Certificate (Pass A)', 'Cử nhân Ngôn ngữ Anh (Manchester)'],
        ieltsBand: 9.0,
        yearsOfExperience: 6,
      },
      {
        fullName: 'ThS. Trần Phương Thảo',
        email: 'teacher3@educenter.edu.vn',
        phone: '0914333444',
        specialization: ['IELTS Pre-Intermediate', 'IELTS Intermediate', 'Writing Task 1 & 2'],
        bio: 'Thạc sĩ TESOL Đại học New South Wales (Úc). Chuyên gia phân tích cấu trúc bài thi IELTS, từng đào tạo hơn 200 học viên đạt Band 6.5 - 7.5.',
        qualifications: ['IELTS 8.5 Overall (Writing 8.5)', 'Thạc sĩ TESOL (UNSW)', 'Chứng chỉ giảng dạy quốc tế DELTA'],
        ieltsBand: 8.5,
        yearsOfExperience: 8,
      },
      {
        fullName: 'Thầy Lê Minh Đức',
        email: 'teacher4@educenter.edu.vn',
        phone: '0915444555',
        specialization: ['IELTS Pre-Intermediate', 'IELTS Reading & Listening', 'Phương pháp Skimming & Scanning'],
        bio: 'Cựu du học sinh Singapore, 5 năm kinh nghiệm giảng dạy tại các trung tâm khảo thí lớn. Phương pháp dạy trực quan, dễ nhớ, áp dụng công nghệ vào luyện đề.',
        qualifications: ['IELTS 8.5 Overall (Reading 9.0)', 'Cử nhân Sư phạm Tiếng Anh', 'Chứng chỉ TESOL 120h'],
        ieltsBand: 8.5,
        yearsOfExperience: 5,
      },
      {
        fullName: 'Cô Vũ Hải Yến',
        email: 'teacher5@educenter.edu.vn',
        phone: '0916555666',
        specialization: ['IELTS Intermediate', 'IELTS Upper-Intermediate', 'IELTS Speaking & Writing'],
        bio: 'Tốt nghiệp xuất sắc Đại học Ngoại thương Hà Nội, học bổng toàn phần Thạc sĩ tại Anh. Chuyên sâu rèn luyện tư duy phản biện và cấu trúc bài luận C1.',
        qualifications: ['IELTS 8.5 Overall (Speaking 8.5)', 'Thạc sĩ Truyền thông Quốc tế (UK)', 'Chứng chỉ CELTA'],
        ieltsBand: 8.5,
        yearsOfExperience: 6,
      },
      {
        fullName: 'ThS. Phạm Gia Huy',
        email: 'teacher6@educenter.edu.vn',
        phone: '0917666777',
        specialization: ['IELTS Upper-Intermediate', 'IELTS Academic Writing', 'Chiến thuật phòng thi'],
        bio: 'Thạc sĩ Giảng dạy Tiếng Anh tại Đại học Melbourne. Kinh nghiệm hướng dẫn học viên chinh phục mức điểm 7.0+ để nộp hồ sơ xin học bổng toàn phần.',
        qualifications: ['IELTS 8.5 Overall', 'Thạc sĩ Giáo dục (Melbourne)', 'Chứng chỉ sư phạm Quốc tế'],
        ieltsBand: 8.5,
        yearsOfExperience: 7,
      },
      {
        fullName: 'ThS. Nguyễn Ngọc Anh',
        email: 'teacher7@educenter.edu.vn',
        phone: '0918777888',
        specialization: ['IELTS Advanced', 'Luyện đề 7.5 - 8.5+', 'IELTS Writing Chuyên sâu'],
        bio: 'Cựu Giám khảo khảo thí IELTS, tác giả nhiều đầu sách luyện thi IELTS bán chạy tại Việt Nam. 10 năm kinh nghiệm dẫn dắt các lớp Advanced chuyên sâu.',
        qualifications: ['IELTS 9.0 Overall', 'Thạc sĩ Ngôn ngữ học Ứng dụng (Australia)', 'Cựu chuyên gia chấm thi khảo thí'],
        ieltsBand: 9.0,
        yearsOfExperience: 10,
      },
      {
        fullName: 'ThS. David Miller',
        email: 'teacher8@educenter.edu.vn',
        phone: '0919888999',
        specialization: ['IELTS Advanced Masterclass', 'IELTS Speaking Band 9.0', 'Tư duy học thuật Academic'],
        bio: 'Giảng viên bản ngữ với 12 năm kinh nghiệm giảng dạy luyện thi IELTS tại châu Á. Chuyên gia đào tạo kỹ năng Speaking và viết luận phản biện cấp độ C2.',
        qualifications: ['IELTS 9.0 Native Speaker', 'Thạc sĩ Ngôn ngữ Anh (Oxford)', 'Chứng chỉ DELTA (Cambridge)'],
        ieltsBand: 9.0,
        yearsOfExperience: 12,
      },
    ];

    const teacherUsers: any[] = [];
    for (let i = 0; i < TEACHER_INFOS.length; i++) {
      const info = TEACHER_INFOS[i];
      const user = await User.create({
        email: info.email,
        password: defaultRawPassword,
        fullName: info.fullName,
        phone: info.phone,
        role: 'TEACHER',
        status: 'ACTIVE',
        isVerified: true,
        address: `Cơ sở EduCenter Hà Nội`,
        dob: new Date(`198${5 + i}-05-12`),
      });

      await Teacher.create({
        user: user._id,
        teacherCode: `TCH00${i + 1}`,
        specialization: info.specialization,
        bio: info.bio,
        qualifications: info.qualifications,
        ieltsBand: info.ieltsBand,
        yearsOfExperience: info.yearsOfExperience,
        status: 'ACTIVE',
      });

      teacherUsers.push(user);
    }
    console.log(`✅ Đã tạo thành công 8 giáo viên.`);

    // ==========================================
    // BƯỚC 5: TẠO 6 KHÓA HỌC THEO YÊU CẦU
    // ==========================================
    console.log('\n📚 Bước 5: Tạo 6 Khóa học IELTS chuẩn hóa...');
    const COURSE_DEFS = [
      {
        code: 'IELTS-BEGINNER',
        title: 'IELTS Beginner – Mất Gốc',
        description: 'Xây dựng lại nền tảng phát âm chuẩn IPA, ngữ pháp cốt lõi và 1.200 từ vựng căn bản cho người mất gốc hoàn toàn.',
        category: 'Lộ trình IELTS',
        entryLevel: 'Mất gốc – 3.0',
        targetLevel: '3.0',
        sessions: 24, // 2 tháng (12 tuần * 2 buổi/tuần hoặc 8 tuần * 3 buổi)
        tuitionFee: 4500000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Nắm chắc 44 âm trong bảng phiên âm quốc tế IPA',
          'Làm chủ 12 thì cơ bản và cấu trúc câu thông dụng',
          'Tích lũy 1.200 từ vựng cốt lõi đời sống',
          'Phản xạ giao tiếp tự tin các chủ đề quen thuộc',
        ],
        syllabus: ['Tuần 1-3: Phát âm chuẩn IPA & Trọng âm', 'Tuần 4-6: Ngữ pháp cốt lõi & Cấu trúc câu', 'Tuần 7-8: Phản xạ giao tiếp & Đọc hiểu cơ bản'],
      },
      {
        code: 'IELTS-FOUNDATION',
        title: 'IELTS Foundation',
        description: 'Làm quen với cấu trúc đề thi 4 kỹ năng IELTS chuẩn quốc tế, trang bị chiến thuật làm bài cơ bản và từ vựng học thuật.',
        category: 'Lộ trình IELTS',
        entryLevel: '3.0 – 4.0',
        targetLevel: '4.0',
        sessions: 36, // 3 tháng
        tuitionFee: 5800000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Làm quen định dạng đề thi 4 kỹ năng Listening, Reading, Writing, Speaking',
          'Luyện nghe Section 1 & 2, luyện đọc hiểu Passage 1',
          'Viết câu phức và đoạn văn Task 1 mạch lạc',
          'Nói trôi chảy Part 1 về các chủ đề cá nhân',
        ],
        syllabus: ['Tháng 1: Tổng quan đề thi & Listening Sec 1-2', 'Tháng 2: Reading Passage 1 & Speaking Part 1', 'Tháng 3: Writing Task 1 cơ bản & Thi thử giữa kỳ'],
      },
      {
        code: 'IELTS-PRE-INTERMEDIATE',
        title: 'IELTS Pre-Intermediate',
        description: 'Mở rộng vốn từ vựng học thuật Academic, phát triển phản xạ Speaking Part 2 và làm chủ bài viết Writing Task 1 biểu đồ.',
        category: 'Lộ trình IELTS',
        entryLevel: '4.0 – 5.0',
        targetLevel: '5.0',
        sessions: 36, // 3 tháng
        tuitionFee: 6800000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Thành thạo kỹ thuật Skimming & Scanning trong Reading',
          'Nói Part 2 mạch lạc trong 2 phút không ngắt quãng',
          'Hoàn thành bài viết Task 1 miêu tả biểu đồ chuẩn cấu trúc',
          'Xử lý tốt các câu hỏi bẫy trong Listening Section 2',
        ],
        syllabus: ['Tháng 1: Reading Skimming & Scanning & Task 1 Biểu đồ', 'Tháng 2: Speaking Part 2 dàn ý PEEL & Listening Sec 2-3', 'Tháng 3: Làm quen Writing Task 2 & Luyện đề chuẩn hóa'],
      },
      {
        code: 'IELTS-INTERMEDIATE',
        title: 'IELTS Intermediate',
        description: 'Tập trung bứt phá điểm số lên 6.0, làm chủ toàn bộ các dạng bài Writing Task 2 và phát triển lập luận logic Speaking Part 3.',
        category: 'Lộ trình IELTS',
        entryLevel: '5.0 – 6.0',
        targetLevel: '6.0',
        sessions: 36, // 3 tháng
        tuitionFee: 7900000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Viết Task 2 đúng cấu trúc 4 đoạn chặt chẽ, luận điểm sâu sắc',
          'Trả lời Speaking Part 3 với tư duy phân tích đa chiều',
          'Chinh phục dạng bài True/False/Not Given và Matching Headings khó',
          'Nghe hiểu trọn vẹn Section 3 & 4 bài giảng học thuật',
        ],
        syllabus: ['Tháng 1: Writing Task 2 chuyên sâu các dạng Opinion & Discussion', 'Tháng 2: Speaking Part 3 tư duy phản biện & Reading chuyên đề', 'Tháng 3: Giải đề Cambridge 15 - 18 & Thi thử phòng máy'],
      },
      {
        code: 'IELTS-UPPER-INTERMEDIATE',
        title: 'IELTS Upper-Intermediate',
        description: 'Chinh phục cột mốc Band 7.0 học thuật, tối ưu hóa vốn từ C1 - C2 và kỹ thuật viết bài luận đạt điểm Lexical Resource cao.',
        category: 'Lộ trình IELTS',
        entryLevel: '6.0 – 7.0',
        targetLevel: '7.0',
        sessions: 36, // 3 tháng
        tuitionFee: 9200000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Sử dụng Collocations và Idiomatic expressions tự nhiên',
          'Tối ưu hóa thời gian thi Reading và Listening đạt tối thiểu 7.5',
          'Phân tích sâu sắc bài viết Task 1 Process/Map phức tạp',
          'Speaking trôi chảy, ngữ điệu tự nhiên, phản xạ linh hoạt',
        ],
        syllabus: ['Tháng 1: Writing Task 2 nâng cao & Từ vựng chủ đề C1', 'Tháng 2: Tối ưu điểm số Reading & Listening mục tiêu 8.0', 'Tháng 3: Luyện Speaking cường độ cao & Mock test định kỳ'],
      },
      {
        code: 'IELTS-ADVANCED',
        title: 'IELTS Advanced',
        description: 'Khóa học cao cấp hướng tới mục tiêu 7.5 - 8.5+, đào tạo trực tiếp cùng cựu giám khảo chấm thi và giảng viên 9.0 bản ngữ.',
        category: 'Lộ trình IELTS',
        entryLevel: '7.0 – 8.5+',
        targetLevel: '8.5+',
        sessions: 36, // 3 tháng
        tuitionFee: 11500000,
        format: 'OFFLINE' as const,
        status: 'ACTIVE' as const,
        bannerUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
        learningObjectives: [
          'Chinh phục điểm số Reading & Listening tuyệt đối 8.5 - 9.0',
          'Writing phong cách học thuật xuất sắc, mạch lạc tuyệt đối',
          'Speaking tự tin, tinh tế như người bản ngữ với phản xạ tư duy nhanh',
          'Sẵn sàng nộp hồ sơ học bổng chính phủ toàn phần (Chevening, Fulbright)',
        ],
        syllabus: ['Tháng 1: Advanced Writing Mastery cùng cựu Giám khảo', 'Tháng 2: Speaking Masterclass & Academic Discussion', 'Tháng 3: Comprehensive Mock Test 1-on-1 & Feedback chi tiết'],
      },
    ];

    const courses: any[] = [];
    for (const cDef of COURSE_DEFS) {
      const course = await Course.create(cDef);
      courses.push(course);
    }
    console.log(`✅ Đã tạo thành công 6 khóa học.`);

    // ==========================================
    // BƯỚC 6: TẠO 12 LỚP HỌC & PHÂN CÔNG GIÁO VIÊN
    // ==========================================
    console.log('\n🏫 Bước 6: Tạo 12 lớp học và phân công 8 giáo viên đúng yêu cầu...');
    // Phân công giáo viên theo đúng yêu cầu:
    // - Giáo viên 1: Beginner 01, Foundation 01
    // - Giáo viên 2: Beginner 02, Foundation 02
    // - Giáo viên 3: Pre-Intermediate 01, Intermediate 01
    // - Giáo viên 4: Pre-Intermediate 02
    // - Giáo viên 5: Intermediate 02, Upper-Intermediate 01
    // - Giáo viên 6: Upper-Intermediate 02
    // - Giáo viên 7: Advanced 01
    // - Giáo viên 8: Advanced 02
    const CLASS_CONFIGS = [
      {
        classCode: 'IELTS-BEG-01',
        name: 'Lớp IELTS Beginner 01 (Mất Gốc)',
        courseIndex: 0, // Beginner
        teacherIndex: 0, // Teacher 1
        targetCount: 15,
        room: 'Phòng Lab 301 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-BEG-02',
        name: 'Lớp IELTS Beginner 02 (Mất Gốc)',
        courseIndex: 0, // Beginner
        teacherIndex: 1, // Teacher 2
        targetCount: 18,
        room: 'Phòng Lab 302 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:30 - 21:30',
      },
      {
        classCode: 'IELTS-FOU-01',
        name: 'Lớp IELTS Foundation 01',
        courseIndex: 1, // Foundation
        teacherIndex: 0, // Teacher 1
        targetCount: 16,
        room: 'Phòng 201 (Cơ sở Đống Đa)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '19:30 - 21:30',
      },
      {
        classCode: 'IELTS-FOU-02',
        name: 'Lớp IELTS Foundation 02',
        courseIndex: 1, // Foundation
        teacherIndex: 1, // Teacher 2
        targetCount: 17,
        room: 'Phòng 202 (Cơ sở Đống Đa)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-PRE-01',
        name: 'Lớp IELTS Pre-Intermediate 01',
        courseIndex: 2, // Pre-Intermediate
        teacherIndex: 2, // Teacher 3
        targetCount: 14,
        room: 'Phòng Lab 401 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-PRE-02',
        name: 'Lớp IELTS Pre-Intermediate 02',
        courseIndex: 2, // Pre-Intermediate
        teacherIndex: 3, // Teacher 4
        targetCount: 16,
        room: 'Phòng Lab 402 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:30 - 21:30',
      },
      {
        classCode: 'IELTS-INT-01',
        name: 'Lớp IELTS Intermediate 01',
        courseIndex: 3, // Intermediate
        teacherIndex: 2, // Teacher 3
        targetCount: 15,
        room: 'Phòng 303 (Cơ sở Bách Khoa)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '19:30 - 21:30',
      },
      {
        classCode: 'IELTS-INT-02',
        name: 'Lớp IELTS Intermediate 02',
        courseIndex: 3, // Intermediate
        teacherIndex: 4, // Teacher 5
        targetCount: 18,
        room: 'Phòng 304 (Cơ sở Bách Khoa)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-UPP-01',
        name: 'Lớp IELTS Upper-Intermediate 01',
        courseIndex: 4, // Upper-Intermediate
        teacherIndex: 4, // Teacher 5
        targetCount: 12,
        room: 'Phòng Khảo thí 501 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '19:30 - 21:30',
      },
      {
        classCode: 'IELTS-UPP-02',
        name: 'Lớp IELTS Upper-Intermediate 02',
        courseIndex: 4, // Upper-Intermediate
        teacherIndex: 5, // Teacher 6
        targetCount: 15,
        room: 'Phòng Khảo thí 502 (Cơ sở Cầu Giấy)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-ADV-01',
        name: 'Lớp IELTS Advanced 01 Masterclass',
        courseIndex: 5, // Advanced
        teacherIndex: 6, // Teacher 7
        targetCount: 12,
        room: 'Phòng Hội thảo Quốc tế A1',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:00 - 20:00',
      },
      {
        classCode: 'IELTS-ADV-02',
        name: 'Lớp IELTS Advanced 02 Masterclass',
        courseIndex: 5, // Advanced
        teacherIndex: 7, // Teacher 8
        targetCount: 14,
        room: 'Phòng Hội thảo Quốc tế A2',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:30 - 21:30',
      },
    ];

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // đã bắt đầu 1 tháng trước
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 28); // kết thúc sau 2 tháng nữa

    const classes: any[] = [];
    for (const cfg of CLASS_CONFIGS) {
      const cls = await Class.create({
        classCode: cfg.classCode,
        name: cfg.name,
        course: courses[cfg.courseIndex]._id,
        teacher: teacherUsers[cfg.teacherIndex]._id,
        room: cfg.room,
        scheduleDays: cfg.scheduleDays,
        timeSlot: cfg.timeSlot,
        startDate: startDate,
        endDate: endDate,
        capacity: 25,
        currentEnrollment: cfg.targetCount,
        status: 'IN_PROGRESS',
      });

      // Tạo ClassTeacher reference
      await ClassTeacher.create({
        class: cls._id,
        teacher: teacherUsers[cfg.teacherIndex]._id,
        assignedDate: startDate,
        role: 'PRIMARY',
        status: 'ACTIVE',
      });

      classes.push(cls);
    }
    console.log(`✅ Đã tạo thành công 12 lớp học.`);

    // ==========================================
    // BƯỚC 7: TẠO 182 HỌC VIÊN & ENROLLMENT VÀO 12 LỚP
    // ==========================================
    console.log('\n🎓 Bước 7: Tạo 182 học viên tiếng Việt, phân bổ chuẩn xác vào 12 lớp...');
    const distributedDates = generateDistributedDates();
    let studentIndex = 0;
    const allStudentUsers: any[] = [];
    const allStudents: any[] = [];
    const allEnrollments: any[] = [];
    const allPayments: any[] = [];
    const allGrades: any[] = [];
    const allAttendances: any[] = [];

    for (let cIdx = 0; cIdx < CLASS_CONFIGS.length; cIdx++) {
      const cfg = CLASS_CONFIGS[cIdx];
      const cls = classes[cIdx];
      const course = courses[cfg.courseIndex];

      for (let s = 0; s < cfg.targetCount; s++) {
        studentIndex++;
        const info = VIETNAMESE_NAMES[studentIndex - 1];
        const studentCode = `STU${String(studentIndex).padStart(3, '0')}`;
        const email = `student${String(studentIndex).padStart(3, '0')}@educenter.edu.vn`;

        // Tạo số điện thoại hợp lệ theo regex: /^(03|05|07|08|09)\d{8}$/
        const prefix = ['03', '05', '07', '08', '09'][studentIndex % 5];
        const phone = `${prefix}${String(10000000 + studentIndex * 317).slice(-8)}`;

        const birthYear = 2000 + (studentIndex % 6); // 2000 - 2005 (19 - 24 tuổi)
        const birthMonth = (studentIndex % 12) + 1;
        const birthDay = (studentIndex % 27) + 1;
        const dob = new Date(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`);

        const addressList = [
          'Số 12 Chùa Láng, Q. Đống Đa, Hà Nội',
          'Số 45 Trần Đại Nghĩa, Q. Hai Bà Trưng, Hà Nội',
          'Số 88 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
          'Số 102 Nguyễn Trãi, Q. Thanh Xuân, Hà Nội',
          'Số 26 Hoàng Quốc Việt, Q. Cầu Giấy, Hà Nội',
          'Số 15 Lê Văn Lương, Q. Thanh Xuân, Hà Nội',
          'Số 39 Tôn Đức Thắng, Q. Đống Đa, Hà Nội',
          'Số 74 Đại Cồ Việt, Q. Hai Bà Trưng, Hà Nội',
          'Số 56 Nguyễn Chí Thanh, Q. Đống Đa, Hà Nội',
          'Số 180 Nguyễn Thị Minh Khai, Quận 1, TP. HCM',
          'Số 387 Sư Vạn Hạnh, Quận 10, TP. HCM',
        ];
        const address = addressList[studentIndex % addressList.length];

        const user = await User.create({
          email: email,
          password: defaultRawPassword,
          fullName: info.fullName,
          phone: phone,
          role: 'STUDENT',
          status: 'ACTIVE',
          isVerified: true,
          address: address,
          dob: dob,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(info.fullName)}&backgroundColor=047857,059669,10b981`,
        });

        // Current & Target bands theo level khóa học
        let currentBand = 2.5;
        let targetBand = 4.0;
        if (cfg.courseIndex === 0) {
          currentBand = 1.5;
          targetBand = 3.5;
        } else if (cfg.courseIndex === 1) {
          currentBand = 3.0;
          targetBand = 4.5;
        } else if (cfg.courseIndex === 2) {
          currentBand = 4.0;
          targetBand = 5.5;
        } else if (cfg.courseIndex === 3) {
          currentBand = 5.0;
          targetBand = 6.5;
        } else if (cfg.courseIndex === 4) {
          currentBand = 6.0;
          targetBand = 7.5;
        } else if (cfg.courseIndex === 5) {
          currentBand = 7.0;
          targetBand = 8.5;
        }

        const student = await Student.create({
          user: user._id,
          studentCode: studentCode,
          dob: dob,
          currentBand: currentBand,
          targetBand: targetBand,
          learningGoal: info.goal,
          placementTestScore: currentBand,
          placementTestDate: new Date('2026-09-20'),
          emergencyContact: {
            name: `Phụ huynh ${info.fullName.split(' ').slice(-1)[0]}`,
            relationship: 'Phụ huynh',
            phone: `09${String(80000000 + studentIndex).slice(-8)}`,
          },
          status: 'ACTIVE',
        });

        allStudentUsers.push(user);
        allStudents.push(student);

        // Trạng thái học phí: ~75% Paid, ~15% Partially Paid, ~10% Unpaid
        let tuitionStatus: 'PAID' | 'PENDING' = 'PAID';
        if (s % 7 === 0) tuitionStatus = 'PENDING';

        // Phân bổ ngày giao dịch theo tháng & ngày thực tế
        const dateIndex = ((studentIndex - 1) * 37) % distributedDates.length;
        const paymentDate = distributedDates[dateIndex];
        const regDate = new Date(paymentDate.getTime() - 2 * 24 * 60 * 60 * 1000);

        const enrollment = await Enrollment.create({
          student: user._id,
          class: cls._id,
          course: course._id,
          registrationDate: regDate,
          enrollmentDate: paymentDate,
          status: 'ENROLLED',
          tuitionStatus: tuitionStatus,
        });
        allEnrollments.push(enrollment);

        // Tạo dữ liệu thanh toán (Payment)
        let payAmount = course.tuitionFee;
        let payStatus: 'SUCCESS' | 'PENDING' = 'SUCCESS';
        if (tuitionStatus === 'PENDING') {
          payStatus = 'PENDING';
        } else if (s % 5 === 0) {
          // Partially paid (đặt cọc đợt 1: 50%)
          payAmount = Math.round(course.tuitionFee / 2);
        }

        const yr = paymentDate.getFullYear();
        const mo = String(paymentDate.getMonth() + 1).padStart(2, '0');
        const da = String(paymentDate.getDate()).padStart(2, '0');
        const invoiceId = `INV-${yr}${mo}-${String(studentIndex).padStart(4, '0')}`;
        const transactionCode = `TXN${yr.toString().slice(-2)}${mo}${da}${String(studentIndex).padStart(4, '0')}`;

        const payment = await Payment.create({
          student: user._id,
          course: course._id,
          amount: payAmount,
          invoiceId: invoiceId,
          transactionCode: transactionCode,
          enrollment: enrollment._id,
          method: ['VIETQR', 'BANK_TRANSFER', 'VNPAY', 'CASH'][studentIndex % 4],
          status: payStatus,
          paymentDate: paymentDate,
          createdAt: paymentDate,
          updatedAt: paymentDate,
          note: `Thanh toán học phí khóa ${course.title} - Lớp ${cls.classCode}`,
        });
        allPayments.push(payment);

        // Tạo điểm kiểm tra giữa kỳ (Grade)
        const gradeNoise = (s % 3) * 0.5 - 0.5;
        const studentMidScore = Math.min(9.0, Math.max(1.0, currentBand + 0.5 + gradeNoise));
        const grade = await Grade.create({
          student: user._id,
          class: cls._id,
          teacher: cls.teacher,
          evaluationType: 'MID_TERM',
          title: 'Bài Kiểm Tra Định Kỳ Giữa Khóa (Mid-term Evaluation)',
          period: 'Tháng 10/2026',
          rating: studentMidScore >= targetBand ? 'EXCELLENT' : studentMidScore >= currentBand ? 'GOOD' : 'SATISFACTORY',
          testDate: new Date('2026-10-25'),
          overallBand: studentMidScore,
          listening: Math.min(9.0, studentMidScore + 0.5),
          reading: studentMidScore,
          writing: Math.max(1.0, studentMidScore - 0.5),
          speaking: studentMidScore,
          feedback: `Học viên ${info.fullName} có tiến bộ rõ rệt trong kỹ năng Nghe và Nói. Cần tiếp tục duy trì việc giải đề định kỳ.`,
          status: 'PUBLISHED',
        });
        allGrades.push(grade);
      }
    }
    console.log(`✅ Đã tạo thành công 182 học viên với Enrollment, Payment và Grade.`);

    // ==========================================
    // BƯỚC 8: TẠO LỊCH HỌC (CLASSSCHEDULE) & ĐIỂM DANH (ATTENDANCE)
    // ==========================================
    console.log('\n🗓️ Bước 8: Tạo Lịch học và Điểm danh buổi học cho 12 lớp...');
    for (let cIdx = 0; cIdx < classes.length; cIdx++) {
      const cls = classes[cIdx];
      const cfg = CLASS_CONFIGS[cIdx];

      // Tạo các buổi học chi tiết trong lịch (3 buổi/tuần trong 8 tuần đã qua)
      const dayMapping: Record<string, number> = {
        'Thứ 2': 1,
        'Thứ 3': 2,
        'Thứ 4': 3,
        'Thứ 5': 4,
        'Thứ 6': 5,
        'Thứ 7': 6,
        'Chủ Nhật': 0,
      };

      const daysOfWeekNum = cfg.scheduleDays.map((d) => dayMapping[d] ?? 1);
      const [startHour, endHour] = cfg.timeSlot.split('-').map((s) => s.trim());

      let currentDay = new Date(startDate);
      let sessionCount = 0;
      const classSchedules: any[] = [];

      while (sessionCount < 12 && currentDay <= now) {
        if (daysOfWeekNum.includes(currentDay.getDay())) {
          sessionCount++;
          const dayName = Object.keys(dayMapping).find((k) => dayMapping[k] === currentDay.getDay()) || 'Thứ 2';
          const sched = await ClassSchedule.create({
            class: cls._id,
            sessionDate: new Date(currentDay),
            dayOfWeek: dayName,
            startTime: startHour,
            endTime: endHour,
            classroom: cfg.room,
            topic: `Buổi ${sessionCount}: Luyện tập kỹ năng trọng tâm & Phân tích chuyên sâu`,
            status: 'ACTIVE',
          });
          classSchedules.push(sched);
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // Tạo điểm danh (Attendance) cho 2 buổi học gần nhất
      const classEnrollments = allEnrollments.filter((e) => e.class.toString() === cls._id.toString());
      const recentSessions = classSchedules.slice(-2);

      for (const sess of recentSessions) {
        for (let eIdx = 0; eIdx < classEnrollments.length; eIdx++) {
          const enr = classEnrollments[eIdx];
          let attStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' = 'PRESENT';
          if (eIdx % 11 === 0) attStatus = 'ABSENT';
          else if (eIdx % 7 === 0) attStatus = 'LATE';

          const att = await Attendance.create({
            class: cls._id,
            classSchedule: sess._id,
            student: enr.student,
            sessionDate: sess.sessionDate,
            status: attStatus,
            recordedBy: cls.teacher,
            notes: attStatus === 'LATE' ? 'Đến muộn 15 phút do kẹt xe' : '',
          });
          allAttendances.push(att);
        }
      }

      // Tạo 1 bài tập (Assignment) cho mỗi lớp
      await Assignment.create({
        class: cls._id,
        teacher: cls.teacher,
        title: `Bài tập tuần: Phân tích & Luyện viết Essay Task 2 (${cls.classCode})`,
        description: 'Yêu cầu hoàn thành bài viết tối thiểu 250 từ, sử dụng từ vựng chủ đề và nộp đúng hạn.',
        skill: 'IELTS Writing',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        maxScore: 10,
        attachments: [],
        status: 'PUBLISHED',
      });
    }
    console.log(`✅ Đã tạo thành công Lịch học, Điểm danh và Bài tập cho 12 lớp.`);

    // ==========================================
    // BƯỚC 9: TẠO BẢN TIN THÔNG BÁO (ANNOUNCEMENTS)
    // ==========================================
    console.log('\n📢 Bước 9: Tạo các bản tin thông báo học thuật & sự kiện...');
    await Announcement.create([
      {
        title: 'Lịch Thi Thử IELTS Trên Máy Tính (Computer-Delivered) Chuẩn Khảo Thí Tháng 11/2026',
        summary: 'Kỳ thi thử quy mô toàn diện mô phỏng 100% phần mềm thi chính thức của IDP & BC, có giáo viên 8.5+ chấm Speaking trực tiếp.',
        content: `Học viện EduCenter thông báo mở đăng ký kỳ thi thử IELTS trên máy tính tháng 11/2026 dành cho toàn bộ học viên 12 lớp và thí sinh tự do.
- Địa điểm: Phòng Khảo thí tiêu chuẩn Quốc tế - Cơ sở Cầu Giấy & Quận 1 TP. HCM.
- Thời gian: 08:30 - 12:00, Chủ Nhật ngày 22/11/2026.
- Kết quả và bảng phân tích năng lực chi tiết sẽ được gửi qua email trong vòng 48 giờ sau khi hoàn thành.`,
        author: adminUser._id,
        category: 'Khảo thí & Điểm thi',
        targetAudience: 'ALL',
        isPinned: true,
        status: 'PUBLISHED',
        publicationDate: new Date('2026-11-01'),
        views: 245,
      },
      {
        title: 'Workshop Chuyên Sâu: Chiến Lược Nâng Band Writing Task 2 Từ 5.5 Lên 7.0+',
        summary: 'Buổi chia sẻ độc quyền cùng ThS. Trần Phương Thảo và cựu Giám khảo khảo thí Nguyễn Ngọc Anh.',
        content: `Nhằm hỗ trợ học viên các lớp Intermediate và Upper-Intermediate khắc phục các lỗi diễn đạt và cấu trúc bài luận, EduCenter tổ chức buổi Workshop học thuật:
- Thời gian: 19:30 Thứ 7 ngày 28/11/2026.
- Hình thức: Trực tiếp tại Hội trường A1 và Livestream qua EduCenter Portal.
- Quà tặng: Bộ tài liệu 50 bài luận mẫu Band 8.0+ tuyển chọn.`,
        author: staff1User._id,
        category: 'Học thuật & Đào tạo',
        targetAudience: 'STUDENTS',
        isPinned: true,
        status: 'PUBLISHED',
        publicationDate: new Date('2026-11-05'),
        views: 189,
      },
      {
        title: 'Thông Báo Nghỉ Lễ & Lịch Học Bù Dành Cho Toàn Thể Giảng Viên Và Học Viên',
        summary: 'Chi tiết lịch điều chỉnh các ca học phòng máy và lịch kiểm tra định kỳ trong tuần tới.',
        content: `Phòng Giáo vụ thông báo chi tiết lịch học bù cho các lớp có ca học trùng ngày lễ. Giảng viên và học viên vui lòng kiểm tra mục Thời khóa biểu trên Portal cá nhân để cập nhật thời gian chính xác.`,
        author: staff2User._id,
        category: 'Học vụ & Lịch học',
        targetAudience: 'ALL',
        isPinned: false,
        status: 'PUBLISHED',
        publicationDate: new Date('2026-11-10'),
        views: 134,
      },
    ]);
    console.log(`✅ Đã tạo các bản tin thông báo.`);

    // ==========================================
    // BƯỚC 10: XÁC MINH SỐ LƯỢNG DOCUMENT TRÊN ATLAS
    // ==========================================
    console.log('\n====================================================');
    console.log('🔍 BƯỚC 10: TRUY VẤN VÀ KIỂM TRA SỐ LƯỢNG TRÊN MONGODB ATLAS');
    console.log('====================================================');

    const counts = {
      users: await User.countDocuments(),
      adminUsers: await User.countDocuments({ role: 'ADMIN' }),
      staffUsers: await User.countDocuments({ role: 'TRAINING_STAFF' }),
      teacherUsers: await User.countDocuments({ role: 'TEACHER' }),
      studentUsers: await User.countDocuments({ role: 'STUDENT' }),
      staffProfiles: await Staff.countDocuments(),
      teacherProfiles: await Teacher.countDocuments(),
      studentProfiles: await Student.countDocuments(),
      courses: await Course.countDocuments(),
      classes: await Class.countDocuments(),
      enrollments: await Enrollment.countDocuments(),
      classTeachers: await ClassTeacher.countDocuments(),
      classSchedules: await ClassSchedule.countDocuments(),
      attendances: await Attendance.countDocuments(),
      grades: await Grade.countDocuments(),
      payments: await Payment.countDocuments(),
      assignments: await Assignment.countDocuments(),
      announcements: await Announcement.countDocuments(),
      centers: await Center.countDocuments(),
    };

    console.log('📊 Thống kê document thực tế trên MongoDB Atlas:');
    console.table(counts);

    // Kiểm tra phân bổ sinh viên trên 12 lớp
    console.log('\n🏫 Kiểm tra phân bổ học viên thực tế trên 12 lớp:');
    const classStats = await Class.find().populate('course teacher').sort({ classCode: 1 });
    for (const c of classStats) {
      const enrollCount = await Enrollment.countDocuments({ class: c._id });
      console.log(`- Mã lớp: ${c.classCode.padEnd(16)} | Khóa: ${(c.course as any)?.title.padEnd(25)} | GV: ${(c.teacher as any)?.fullName.padEnd(22)} | Sĩ số: ${enrollCount} HV`);
    }

    console.log('\n====================================================');
    console.log('🎉 QUY TRÌNH SEED DỮ LIỆU ATLAS ĐÃ HOÀN TẤT THÀNH CÔNG!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Lỗi khi thực hiện seed dữ liệu Atlas:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn với MongoDB Atlas.');
  }
}

seedAtlas();
