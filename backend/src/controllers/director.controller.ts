import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

import {
  User,
  Staff,
  Teacher,
  Student,
  Course,
  Class,
  Enrollment,
  Payment,
  Submission,
  Assignment,
  ChangeRequest,
  Attendance,
  Feedback,
} from '../models';

/**
 * UC52: View Staff Accounts List
 * GET /api/director/staff-list
 */
export const getStaffList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staffUsers = await User.find({ role: 'TRAINING_STAFF' }).sort({ createdAt: -1 });
    const userIds = staffUsers.map((s) => s._id);

    const staffProfiles = await Staff.find({ user: { $in: userIds } });
    const profileMap = new Map();
    staffProfiles.forEach((p) => profileMap.set(p.user.toString(), p));

    const result = staffUsers.map((s) => {
      const p = profileMap.get(s._id.toString());
      return {
        _id: s._id,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        address: s.address,
        status: s.status,
        createdAt: s.createdAt,
        staffCode: p?.staffCode || `STF-${s._id.toString().slice(-4)}`,
        department: p?.department || 'Phòng Đào tạo & Giáo vụ',
        position: p?.position || 'Chuyên viên Giáo vụ',
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách nhân viên giáo vụ',
    });
  }
};

/**
 * UC53: Add Staff Account
 * POST /api/director/staff-account
 */
export const addStaffAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, phone, address, department, position } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp họ tên, email và mật khẩu',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email này đã tồn tại trong hệ thống',
      });
      return;
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password,
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      role: 'TRAINING_STAFF',
      status: 'ACTIVE',
    });

    const staffCode = `STF-${Date.now().toString().slice(-4)}`;
    const staffProfile = await Staff.create({
      user: newUser._id,
      staffCode,
      department: department?.trim() || 'Phòng Đào tạo & Giáo vụ',
      position: position?.trim() || 'Chuyên viên Giáo vụ',
      joinDate: new Date(),
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân viên giáo vụ thành công!',
      data: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        staffCode: staffProfile.staffCode,
        department: staffProfile.department,
        position: staffProfile.position,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo tài khoản nhân viên',
    });
  }
};

/**
 * UC54: Monitor Center Operations
 * GET /api/director/operations
 */
export const monitorCenterOperations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalStaff,
      totalCourses,
      totalClasses,
      activeClasses,
      totalEnrollments,
      recentEnrollments,
      recentSubmissions,
      recentChangeRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'TEACHER' }),
      User.countDocuments({ role: 'TRAINING_STAFF' }),
      Course.countDocuments({ status: 'ACTIVE' }),
      Class.countDocuments(),
      Class.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      Enrollment.countDocuments(),
      Enrollment.find().populate('student course class').sort({ createdAt: -1 }).limit(5),
      Submission.find().populate('student assignment').sort({ submissionTime: -1 }).limit(5),
      ChangeRequest.find().populate('student currentClass').sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalStudents,
          totalTeachers,
          totalStaff,
          totalCourses,
          totalClasses,
          activeClasses,
          totalEnrollments,
        },
        recentActivities: {
          enrollments: recentEnrollments,
          submissions: recentSubmissions,
          changeRequests: recentChangeRequests,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi giám sát hoạt động trung tâm',
    });
  }
};

/**
 * Monitor Student Activities
 * GET /api/director/student-activities
 */
export const monitorStudentActivities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [submissions, attendances, enrollments] = await Promise.all([
      Submission.find()
        .populate('student', 'fullName email')
        .populate({ path: 'assignment', populate: { path: 'class' } })
        .sort({ submissionTime: -1 })
        .limit(20),
      Attendance.find()
        .populate('student', 'fullName')
        .populate('class', 'name classCode')
        .sort({ sessionDate: -1 })
        .limit(20),
      Enrollment.find()
        .populate('student', 'fullName email phone')
        .populate('course', 'title code')
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        attendances,
        enrollments,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi giám sát hoạt động học viên',
    });
  }
};

/**
 * Monitor Teacher Activities
 * GET /api/director/teacher-activities
 */
export const monitorTeacherActivities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await User.find({ role: 'TEACHER' });
    const teacherIds = teachers.map((t) => t._id);

    const [classes, assignments, gradedSubs, feedbacks] = await Promise.all([
      Class.find({ teacher: { $in: teacherIds } }).populate('course'),
      Assignment.find({ teacher: { $in: teacherIds } }),
      Submission.find({ gradedBy: { $in: teacherIds } }).populate('student'),
      Feedback.find({ receiver: { $in: teacherIds } }).populate('sender'),
    ]);

    const teacherActivities = teachers.map((t) => {
      const tClasses = classes.filter((c) => c.teacher?.toString() === t._id.toString());
      const tAssignments = assignments.filter((a) => a.teacher?.toString() === t._id.toString());
      const tGraded = gradedSubs.filter((g) => g.gradedBy?.toString() === t._id.toString());
      const tFeedbacks = feedbacks.filter((f) => f.receiver?.toString() === t._id.toString());
      const avgRating =
        tFeedbacks.length > 0
          ? (tFeedbacks.reduce((sum, f) => sum + f.rating, 0) / tFeedbacks.length).toFixed(1)
          : '5.0';

      return {
        _id: t._id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        activeClasses: tClasses.length,
        assignmentsCreated: tAssignments.length,
        submissionsGraded: tGraded.length,
        feedbacksCount: tFeedbacks.length,
        averageRating: avgRating,
      };
    });

    res.status(200).json({
      success: true,
      data: teacherActivities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi giám sát hoạt động giảng viên',
    });
  }
};

/**
 * UC56: View Student Reports
 * GET /api/director/reports/students
 */
export const getStudentReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [students, studentProfiles, enrollments, attendances] = await Promise.all([
      User.find({ role: 'STUDENT' }),
      Student.find(),
      Enrollment.find(),
      Attendance.find(),
    ]);

    const totalStudents = students.length;
    const bandDistribution: Record<string, number> = {
      'Dưới 5.0': 0,
      '5.0 - 6.0': 0,
      '6.5 - 7.5': 0,
      '8.0+': 0,
    };

    studentProfiles.forEach((p) => {
      const b = p.currentBand || 5.0;
      if (b < 5.0) bandDistribution['Dưới 5.0']++;
      else if (b <= 6.0) bandDistribution['5.0 - 6.0']++;
      else if (b <= 7.5) bandDistribution['6.5 - 7.5']++;
      else bandDistribution['8.0+']++;
    });

    const totalAttendance = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const avgAttendanceRate =
      totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 95;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        bandDistribution,
        totalEnrollments: enrollments.length,
        avgAttendanceRate: `${avgAttendanceRate}%`,
        activeLearners: students.filter((s) => s.status === 'ACTIVE').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo báo cáo học viên',
    });
  }
};

/**
 * UC57: View Teacher Reports
 * GET /api/director/reports/teachers
 */
export const getTeacherReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await User.find({ role: 'TEACHER' });
    const teacherProfiles = await Teacher.find();
    const classes = await Class.find();
    const feedbacks = await Feedback.find();

    const report = teachers.map((t) => {
      const p = teacherProfiles.find((tp) => tp.user.toString() === t._id.toString());
      const tClasses = classes.filter((c) => c.teacher?.toString() === t._id.toString());
      const tFeedbacks = feedbacks.filter((f) => f.receiver?.toString() === t._id.toString());
      const avgRating =
        tFeedbacks.length > 0
          ? (tFeedbacks.reduce((sum, f) => sum + f.rating, 0) / tFeedbacks.length).toFixed(1)
          : '5.0';

      return {
        _id: t._id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        ieltsBand: p?.ieltsBand || 8.5,
        specialization: p?.specialization || [],
        classesCount: tClasses.length,
        totalStudentsTaught: tClasses.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0),
        feedbackRating: avgRating,
        feedbackCount: tFeedbacks.length,
      };
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo báo cáo giảng viên',
    });
  }
};

/**
 * UC58: View Class Reports
 * GET /api/director/reports/classes
 */
export const getClassReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const classes = await Class.find()
      .populate('course', 'title code tuitionFee')
      .populate('teacher', 'fullName email phone');

    const totalClasses = classes.length;
    const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 20), 0);
    const totalEnrolled = classes.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0);
    const overallFillRate =
      totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    const classDetails = classes.map((c) => ({
      _id: c._id,
      classCode: c.classCode,
      name: c.name,
      courseTitle: (c.course as any)?.title,
      teacherName: (c.teacher as any)?.fullName || 'Chưa phân công',
      capacity: c.capacity,
      currentEnrollment: c.currentEnrollment,
      fillRate: c.capacity > 0 ? Math.round((c.currentEnrollment / c.capacity) * 100) : 0,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      room: c.room,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        totalCapacity,
        totalEnrolled,
        overallFillRate: `${overallFillRate}%`,
        classes: classDetails,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo báo cáo lớp học',
    });
  }
};

/**
 * UC59: View Course Reports
 * GET /api/director/reports/courses
 */
export const getCourseReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [courses, enrollments, classes] = await Promise.all([
      Course.find(),
      Enrollment.find(),
      Class.find(),
    ]);

    const report = courses.map((c) => {
      const cEnrollments = enrollments.filter((e) => e.course?.toString() === c._id.toString());
      const cClasses = classes.filter((cl) => cl.course?.toString() === c._id.toString());
      const totalRevenueFromCourse = cEnrollments
        .filter((e) => e.tuitionStatus === 'PAID')
        .length * c.tuitionFee;

      return {
        _id: c._id,
        code: c.code,
        title: c.title,
        tuitionFee: c.tuitionFee,
        format: c.format,
        status: c.status,
        classesCount: cClasses.length,
        enrollmentsCount: cEnrollments.length,
        estimatedRevenue: totalRevenueFromCourse,
        estimatedRevenueFormatted: `${totalRevenueFromCourse.toLocaleString('vi-VN')} ₫`,
      };
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo báo cáo khóa học',
    });
  }
};

/**
 * UC60: View Revenue Reports
 * GET /api/director/reports/revenue
 *
 * CRITICAL REQUIREMENTS:
 * - All revenue numbers MUST come from the database (`Payment` collection).
 * - Total revenue is computed directly from summing transactions with status 'SUCCESS'.
 * - Every transaction in the list accounts for part of the total revenue so it matches 100%!
 * - No need to partition by campus/branches ("web tính tổng revenue không cần chia ra các cơ sở").
 */
export const getRevenueReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch all successful transactions from Payment collection
    const transactions = await Payment.find({ status: 'SUCCESS' })
      .populate('student', 'fullName email phone')
      .populate('course', 'title code tuitionFee')
      .populate({ path: 'enrollment', populate: { path: 'class', select: 'name classCode' } })
      .sort({ paymentDate: -1 });

    // 2. Sum up total revenue strictly from database documents
    const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // 3. Payment methods breakdown
    const methodBreakdown: Record<string, { count: number; total: number }> = {};
    transactions.forEach((txn) => {
      const m = txn.method || 'OTHER';
      if (!methodBreakdown[m]) {
        methodBreakdown[m] = { count: 0, total: 0 };
      }
      methodBreakdown[m].count += 1;
      methodBreakdown[m].total += txn.amount || 0;
    });

    // 4. Pending / Failed stats
    const [pendingCount, pendingPayments] = await Promise.all([
      Payment.countDocuments({ status: 'PENDING' }),
      Payment.find({ status: 'PENDING' }).select('amount'),
    ]);
    const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalRevenueFormatted: `${totalRevenue.toLocaleString('vi-VN')} ₫`,
          totalTransactions: transactions.length,
          pendingTransactions: pendingCount,
          pendingTotal,
          pendingTotalFormatted: `${pendingTotal.toLocaleString('vi-VN')} ₫`,
          currency: 'VND',
        },
        methodBreakdown,
        transactions: transactions.map((t) => ({
          _id: t._id,
          transactionCode: t.transactionCode,
          studentName: (t.student as any)?.fullName || 'Học viên',
          studentEmail: (t.student as any)?.email,
          studentPhone: (t.student as any)?.phone,
          courseTitle: (t.course as any)?.title || 'Khóa học IELTS',
          className: ((t.enrollment as any)?.class as any)?.name || 'Lớp học IELTS',
          amount: t.amount,
          amountFormatted: `${t.amount.toLocaleString('vi-VN')} ₫`,
          method: t.method,
          status: t.status,
          paymentDate: t.paymentDate,
          note: t.note,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo báo cáo doanh thu',
    });
  }
};
