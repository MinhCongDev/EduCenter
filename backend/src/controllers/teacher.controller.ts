import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  Class,
  Enrollment,
  ClassSchedule,
  Assignment,
  Submission,
  ChangeRequest,
  Attendance,
  Student,
} from '../models';


/**
 * UC25: View Assigned Classes
 * GET /api/teacher/classes
 */
export const getAssignedClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    let classes = await Class.find({ teacher: teacherId })
      .populate('course')
      .populate('teacher', 'fullName email phone');

    if (classes.length === 0) {
      // Fallback for demo: show active classes
      classes = await Class.find().populate('course').populate('teacher', 'fullName email phone');
    }

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách lớp học của giảng viên',
    });
  }
};

/**
 * UC26: View Student List & UC28: Student Info & UC29: Student Academic Results
 * GET /api/teacher/classes/:classId/students
 */
export const getClassStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const enrollments = await Enrollment.find({ class: classId, status: 'ENROLLED' })
      .populate('student', 'fullName email phone address avatarUrl dob')
      .populate('course');

    const studentUserIds = enrollments.map((e) => (e.student as any)?._id).filter(Boolean);

    // Get student extra profiles
    const studentProfiles = await Student.find({ user: { $in: studentUserIds } });
    const profileMap = new Map();
    studentProfiles.forEach((p) => profileMap.set(p.user.toString(), p));

    // Get submissions for each student in this class
    const assignments = await Assignment.find({ class: classId });
    const assignmentIds = assignments.map((a) => a._id);

    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: { $in: studentUserIds },
    });

    const studentsData = enrollments.map((e) => {
      const u = e.student as any;
      const profile = u ? profileMap.get(u._id.toString()) : null;
      const studentSubs = submissions.filter((s) => s.student.toString() === u?._id?.toString());

      return {
        enrollmentId: e._id,
        user: u,
        profile: profile
          ? {
              studentCode: profile.studentCode,
              currentBand: profile.currentBand,
              targetBand: profile.targetBand,
              learningGoal: profile.learningGoal,
            }
          : null,
        finalScore: e.finalScore,
        midtermScore: e.midtermScore,
        academicResult: e.academicResult,
        tuitionStatus: e.tuitionStatus,
        submissionsCount: studentSubs.length,
        averageGrade:
          studentSubs.filter((s) => typeof s.grade === 'number').length > 0
            ? (
                studentSubs
                  .filter((s) => typeof s.grade === 'number')
                  .reduce((sum, s) => sum + (s.grade || 0), 0) /
                studentSubs.filter((s) => typeof s.grade === 'number').length
              ).toFixed(1)
            : 'Chưa có',
      };
    });

    res.status(200).json({
      success: true,
      data: studentsData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách học viên trong lớp',
    });
  }
};

/**
 * UC27: View Teaching Schedule
 * GET /api/teacher/schedule
 */
export const getTeachingSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    // Find classes taught by this teacher
    let classes = await Class.find({ teacher: teacherId });
    let classIds = classes.map((c) => c._id);

    let schedules = await ClassSchedule.find({
      ...(classIds.length > 0 ? { class: { $in: classIds } } : {}),
      status: 'ACTIVE',
    })
      .populate({
        path: 'class',
        populate: [{ path: 'course' }, { path: 'teacher' }],
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch dạy của giảng viên',
    });
  }
};

/**
 * UC30: View Assignments
 * GET /api/teacher/assignments
 */
export const getTeacherAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    const assignments = await Assignment.find({ teacher: teacherId })
      .populate('class', 'name classCode room currentEnrollment')
      .sort({ createdAt: -1 });

    // Fetch submission stats for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } });

    const result = assignments.map((a) => {
      const subs = submissions.filter((s) => s.assignment.toString() === a._id.toString());
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        class: a.class,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        type: a.type || 'HOMEWORK',
        status: a.status,
        submissionsCount: subs.length,
        gradedCount: subs.filter((s) => s.status === 'GRADED').length,
        pendingCount: subs.filter((s) => s.status !== 'GRADED').length,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách bài tập của giảng viên',
    });
  }
};

/**
 * UC35: Create Assignment & UC36: Assign Assignment
 * POST /api/teacher/assignments
 */
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, title, description, dueDate, maxScore, attachments, type } = req.body;

    if (!classId || !title || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lớp học, tiêu đề bài tập và hạn nộp',
      });
      return;
    }

    const assignment = await Assignment.create({
      class: classId,
      teacher: teacherId,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: new Date(dueDate),
      maxScore: Number(maxScore) || 10,
      attachments: attachments || [],
      type: type || 'HOMEWORK',
      status: 'PUBLISHED',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo và giao bài tập thành công!',
      data: assignment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo bài tập mới',
    });
  }
};

/**
 * Get Submissions for an assignment
 * GET /api/teacher/assignments/:assignmentId/submissions
 */
export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'fullName email phone avatarUrl')
      .sort({ submissionTime: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách bài nộp',
    });
  }
};

/**
 * UC31: Grade Assignments & UC32: Update Grades
 * POST /api/teacher/submissions/:submissionId/grade
 */
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập điểm số',
      });
      return;
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài nộp của học viên',
      });
      return;
    }

    submission.grade = Number(grade);
    submission.feedback = feedback?.trim() || '';
    submission.gradedBy = teacherId;
    submission.status = 'GRADED';
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Chấm điểm và gửi nhận xét thành công!',
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi chấm điểm bài tập',
    });
  }
};

/**
 * UC32: Update Final/Midterm Grades on Enrollment
 * PUT /api/teacher/enrollments/:enrollmentId/grade
 */
export const updateStudentGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.params;
    const { finalScore, midtermScore, academicResult } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ ghi danh của học viên',
      });
      return;
    }

    if (finalScore !== undefined) enrollment.finalScore = Number(finalScore);
    if (midtermScore !== undefined) enrollment.midtermScore = Number(midtermScore);
    if (academicResult) enrollment.academicResult = academicResult;

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm tổng kết của học viên thành công!',
      data: enrollment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật điểm học phần',
    });
  }
};

/**
 * UC33: Submit Schedule Change Request
 * POST /api/teacher/schedule-change-request
 */
export const createTeacherScheduleRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { currentClass, targetSchedule, reason } = req.body;

    if (!currentClass || !reason?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn lớp học và nhập lý do đổi lịch',
      });
      return;
    }

    if (!targetSchedule?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lịch dạy mong muốn dời sang',
      });
      return;
    }

    const request = await ChangeRequest.create({
      student: teacherId, // User reference
      requesterRole: 'TEACHER',
      requestType: 'SCHEDULE_CHANGE',
      currentClass,
      targetSchedule: targetSchedule.trim(),
      reason: reason.trim(),
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đổi lịch dạy tới Phòng Giáo vụ!',
      data: request,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi yêu cầu đổi lịch dạy',
    });
  }
};

/**
 * UC34: Track Change Requests (Teacher)
 * GET /api/teacher/change-requests
 */
export const getTeacherChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    const requests = await ChangeRequest.find({ student: teacherId, requesterRole: 'TEACHER' })
      .populate('currentClass', 'name classCode room')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tra cứu yêu cầu đổi lịch dạy',
    });
  }
};

/**
 * UC37: View Attendance
 * GET /api/teacher/attendance/:classId
 */
export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const attendanceRecords = await Attendance.find({ class: classId })
      .populate('student', 'fullName email phone')
      .populate('classSchedule')
      .sort({ sessionDate: -1 });

    res.status(200).json({
      success: true,
      data: attendanceRecords,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xem danh sách điểm danh lớp học',
    });
  }
};

/**
 * UC38: Check Attendance (Record attendance for session)
 * POST /api/teacher/attendance
 */
export const checkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, sessionDate, records } = req.body;
    // records: Array<{ studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', notes?: string }>

    if (!classId || !records || !Array.isArray(records)) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp và danh sách điểm danh học viên',
      });
      return;
    }

    const date = sessionDate ? new Date(sessionDate) : new Date();

    const createdRecords = await Promise.all(
      records.map(async (r: any) => {
        // Find existing record or upsert
        return Attendance.findOneAndUpdate(
          {
            class: classId,
            student: r.studentId,
            sessionDate: {
              $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
              $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
            },
          },
          {
            class: classId,
            student: r.studentId,
            sessionDate: date,
            status: r.status || 'PRESENT',
            notes: r.notes || '',
            recordedBy: teacherId,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(200).json({
      success: true,
      message: 'Lưu dữ liệu điểm danh thành công!',
      data: createdRecords,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi điểm danh học viên',
    });
  }
};
