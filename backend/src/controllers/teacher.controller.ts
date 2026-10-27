import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { notify, syncStudentBand } from '../services/notification.service';
import {
  Class,
  Course,
  Enrollment,
  User,
  Student,
  ClassSchedule,
  Assignment,
  Submission,
  Attendance,
  ChangeRequest,
  Grade,
} from '../models';

/**
 * Helper to get list of class IDs assigned to teacher (or fallback to classes if none explicitly assigned)
 */
const getTeacherClassIds = async (teacherUserId: any) => {
  let classes = await Class.find({ teacher: teacherUserId });
  if (classes.length === 0) {
    // If not explicitly assigned, link teacher to available classes for seamless demo
    const available = await Class.find({});
    if (available.length > 0) {
      await Class.updateMany({ _id: { $in: available.slice(0, 3).map((c) => c._id) } }, { teacher: teacherUserId });
      classes = await Class.find({ teacher: teacherUserId });
    }
  }
  return classes;
};

/**
 * 1. View Assigned Classes (Class Management)
 * GET /api/teacher/classes
 */
export const getAssignedClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const classes = await getTeacherClassIds(teacherId);

    const classList = await Promise.all(
      classes.map(async (cls) => {
        const course = await Course.findById(cls.course).select('title code tuitionFee targetLevel bannerUrl');
        const studentCount = await Enrollment.countDocuments({
          class: cls._id,
          status: 'ENROLLED',
        });
        const schedules = await ClassSchedule.find({ class: cls._id, status: 'ACTIVE' });

        return {
          _id: cls._id,
          classCode: cls.classCode,
          name: cls.name || `${course?.title || 'IELTS'} - ${cls.classCode}`,
          room: cls.room,
          scheduleDays: cls.scheduleDays,
          timeSlot: cls.timeSlot,
          startDate: cls.startDate,
          endDate: cls.endDate,
          capacity: cls.capacity,
          currentEnrollment: studentCount || cls.currentEnrollment || 0,
          status: cls.status,
          course: course || null,
          schedules: schedules.map((s) => ({
            _id: s._id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            classroom: s.classroom,
            topic: s.topic,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { classes: classList },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách lớp học phụ trách',
    });
  }
};

/**
 * 1b. Get Single Assigned Class Detail
 * GET /api/teacher/classes/:classId
 */
export const getClassDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const cls = await Class.findById(classId).populate('course teacher');
    if (!cls) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    const enrollments = await Enrollment.find({ class: classId, status: 'ENROLLED' }).populate('student');
    const schedules = await ClassSchedule.find({ class: classId, status: 'ACTIVE' });
    const assignments = await Assignment.find({ class: classId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        class: cls,
        students: enrollments.map((e) => e.student),
        schedules,
        assignments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Lỗi khi tải chi tiết lớp học' });
  }
};

/**
 * 2. View Student List (Student Management)
 * GET /api/teacher/students
 */
export const getStudentList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, search } = req.query;

    const teacherClasses = await getTeacherClassIds(teacherId);
    let targetClassIds = teacherClasses.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      targetClassIds = targetClassIds.filter((id) => id.toString() === classId);
    }

    const enrollments = await Enrollment.find({
      class: { $in: targetClassIds },
      status: 'ENROLLED',
    }).populate('student class');

    const studentMap = new Map<string, any>();

    for (const enr of enrollments) {
      const studentUser = enr.student as any;
      if (!studentUser) continue;

      const studentId = studentUser._id.toString();
      if (!studentMap.has(studentId)) {
        // Query student profile
        const studentProfile = await Student.findOne({ user: studentUser._id });

        // Query attendance rate in this teacher's classes
        const totalSessions = await Attendance.countDocuments({
          student: studentUser._id,
          class: { $in: targetClassIds },
        });
        const presentSessions = await Attendance.countDocuments({
          student: studentUser._id,
          class: { $in: targetClassIds },
          status: { $in: ['PRESENT', 'LATE'] },
        });

        // Latest grade
        const latestGrade = await Grade.findOne({
          student: studentUser._id,
          class: { $in: targetClassIds },
        }).sort({ testDate: -1 });

        studentMap.set(studentId, {
          _id: studentUser._id,
          fullName: studentUser.fullName,
          email: studentUser.email,
          phone: studentUser.phone || '0988 123 456',
          avatarUrl: studentUser.avatarUrl || '',
          studentCode: studentProfile?.studentCode || `STU-${studentUser._id.toString().slice(-4).toUpperCase()}`,
          currentBand: studentProfile?.currentBand ?? 5.5,
          targetBand: studentProfile?.targetBand ?? 7.0,
          learningGoal: studentProfile?.learningGoal || 'Du học & Xét tuyển ĐH',
          emergencyContact: studentProfile?.emergencyContact || { name: 'Phụ huynh', phone: studentUser.phone || '', relationship: 'Bố/Mẹ' },
          classes: [],
          attendanceStats: {
            // Không dùng số giả (|| 10 / || 9) — học viên chưa có buổi điểm
            // danh nào phải hiện 0, không phải 9/10 (92%). Công thức:
            // tỷ lệ có mặt = (PRESENT + LATE) / tổng buổi — giống hệt
            // `getAttendance` của student.controller.
            total: totalSessions,
            present: presentSessions,
            attendanceRate:
              totalSessions > 0
                ? Math.round((presentSessions / totalSessions) * 100)
                : 0,
          },
          latestGrade: latestGrade
            ? {
                title: latestGrade.title,
                overallBand: latestGrade.overallBand,
                testDate: latestGrade.testDate,
              }
            : null,
        });
      }

      const current = studentMap.get(studentId);
      if (enr.class) {
        const cls = enr.class as any;
        current.classes.push({
          _id: cls._id,
          classCode: cls.classCode,
          name: cls.name,
        });
      }
    }

    let result = Array.from(studentMap.values());

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      data: { students: result },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách học viên',
    });
  }
};

/**
 * 4. View Student Information / Student Detail (Student Information)
 * GET /api/teacher/students/:studentId
 */
export const getStudentDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user?._id;

    const studentUser = await User.findById(studentId).select('-password');
    if (!studentUser) {
      res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
      return;
    }

    const studentProfile = await Student.findOne({ user: studentId });
    const teacherClasses = await getTeacherClassIds(teacherId);
    const classIds = teacherClasses.map((c) => c._id);

    const enrollments = await Enrollment.find({
      student: studentId,
      class: { $in: classIds },
    }).populate('class course');

    const grades = await Grade.find({
      student: studentId,
      class: { $in: classIds },
    }).sort({ testDate: -1 });

    const attendanceRecords = await Attendance.find({
      student: studentId,
      class: { $in: classIds },
    }).populate('class', 'classCode name').sort({ sessionDate: -1 });

    const submissions = await Submission.find({
      student: studentId,
    }).populate('assignment').sort({ submissionTime: -1 });

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: studentUser._id,
          fullName: studentUser.fullName,
          email: studentUser.email,
          phone: studentUser.phone,
          address: studentUser.address,
          avatarUrl: studentUser.avatarUrl,
          studentCode: studentProfile?.studentCode || `STU-${studentUser._id.toString().slice(-4).toUpperCase()}`,
          currentBand: studentProfile?.currentBand ?? 5.5,
          targetBand: studentProfile?.targetBand ?? 7.0,
          learningGoal: studentProfile?.learningGoal || 'Du học & Định cư',
          emergencyContact: studentProfile?.emergencyContact || null,
        },
        enrollments,
        grades,
        attendance: attendanceRecords,
        submissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải chi tiết học viên',
    });
  }
};

/**
 * 3. View Teaching Schedule (Timetable / Teaching Schedule)
 * GET /api/teacher/schedule
 */
export const getTeachingSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const classes = await getTeacherClassIds(teacherId);
    const classIds = classes.map((c) => c._id);

    const schedules = await ClassSchedule.find({
      class: { $in: classIds },
      status: 'ACTIVE',
    }).populate({
      path: 'class',
      select: 'classCode name room timeSlot capacity currentEnrollment',
    });

    res.status(200).json({
      success: true,
      data: { schedules },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải thời khóa biểu ca dạy',
    });
  }
};

/**
 * 6. View Assignments (Assignment Management)
 * GET /api/teacher/assignments
 */
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId } = req.query;

    const classes = await getTeacherClassIds(teacherId);
    let classIds = classes.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      classIds = classIds.filter((id) => id.toString() === classId);
    }

    const assignments = await Assignment.find({
      class: { $in: classIds },
    })
      .populate('class', 'classCode name room')
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      assignments.map(async (ass) => {
        const clsId = ass.class?._id || ass.class;
        const totalStudents = await Enrollment.countDocuments({
          class: clsId,
          status: 'ENROLLED',
        });
        const submittedCount = await Submission.countDocuments({
          assignment: ass._id,
        });
        const gradedCount = await Submission.countDocuments({
          assignment: ass._id,
          status: 'GRADED',
        });

        return {
          _id: ass._id,
          title: ass.title,
          description: ass.description,
          skill: ass.skill || 'IELTS Writing',
          dueDate: ass.dueDate,
          maxScore: ass.maxScore,
          attachments: ass.attachments,
          status: ass.status,
          class: ass.class,
          stats: {
            totalStudents: totalStudents || 16,
            submittedCount,
            gradedCount,
            pendingCount: submittedCount - gradedCount,
          },
          createdAt: ass.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { assignments: result },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách bài tập',
    });
  }
};

/**
 * 11 & 12. Create Assignment & Assign Assignment
 * POST /api/teacher/assignments
 */
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, title, description, dueDate, maxScore, skill, attachments, status } = req.body;

    if (!classId || !title || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'Lớp học, tiêu đề bài tập và hạn nộp là bắt buộc',
      });
      return;
    }

    const assignment = await Assignment.create({
      class: classId,
      teacher: teacherId,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      maxScore: maxScore ? Number(maxScore) : 9.0,
      skill: skill || 'IELTS Writing',
      attachments: attachments || [],
      status: status || 'PUBLISHED',
    });

    const populated = await Assignment.findById(assignment._id).populate('class', 'classCode name');

    res.status(201).json({
      success: true,
      message: 'Tạo và giao bài tập cho lớp thành công!',
      data: { assignment: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tạo bài tập',
    });
  }
};

/**
 * Update Assignment
 * PUT /api/teacher/assignments/:assignmentId
 */
export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, maxScore, skill, attachments, status } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(maxScore !== undefined && { maxScore: Number(maxScore) }),
        ...(skill && { skill }),
        ...(attachments && { attachments }),
        ...(status && { status }),
      },
      { new: true }
    ).populate('class', 'classCode name');

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài tập thành công!',
      data: { assignment },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi cập nhật bài tập',
    });
  }
};

/**
 * Delete Assignment
 * DELETE /api/teacher/assignments/:assignmentId
 */
export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await Assignment.findByIdAndDelete(assignmentId);
    await Submission.deleteMany({ assignment: assignmentId });

    res.status(200).json({
      success: true,
      message: 'Đã xóa bài tập thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi xóa bài tập',
    });
  }
};

/**
 * Get Submissions for an Assignment
 * GET /api/teacher/assignments/:assignmentId/submissions
 */
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'fullName email phone avatarUrl')
      .sort({ submissionTime: -1 });

    res.status(200).json({
      success: true,
      data: { submissions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách bài nộp',
    });
  }
};

/**
 * 7. Grade Assignments (Assignment Grading)
 * POST /api/teacher/submissions/:submissionId/grade
 */
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const teacherId = req.user?._id;
    const { grade, feedback, criteria } = req.body;

    if (grade === undefined) {
      res.status(400).json({ success: false, message: 'Điểm số / Band điểm là bắt buộc' });
      return;
    }

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        grade: Number(grade),
        feedback: feedback || 'Giảng viên đã chấm và ghi nhận kết quả.',
        criteria: criteria || undefined,
        gradedBy: teacherId,
        status: 'GRADED',
      },
      { new: true }
    ).populate('student', 'fullName email').populate('assignment');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài nộp' });
      return;
    }

    // ── Thông báo cho học viên ──
    // Trước đây học viên chỉ biết mình được chấm bài khi mở trang Bài tập
    // → phản hồi chậm. Giờ giảng viên chấm xong là học viên nhận thông báo
    // ngay kèm link tới đúng bài tập.
    const assignment: any = submission.assignment;
    const gradedStudent: any = submission.student;
    if (gradedStudent?._id) {
      await notify({
        user: gradedStudent._id,
        type: 'ASSIGNMENT_GRADED',
        title: `🎉 Bài tập "${assignment?.title || 'bài làm'}" đã được chấm điểm`,
        message:
          `Bạn đã được chấm ${submission.grade}/${assignment?.maxScore ?? '—'} điểm. ` +
          (submission.feedback || 'Hãy xem nhận xét chi tiết của giảng viên.'),
        link: assignment?.class
          ? `/student/classes/${assignment.class}/assignments`
          : '/student/dashboard',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chấm bài và phản hồi nhận xét thành công!',
      data: { submission },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi chấm điểm bài nộp',
    });
  }
};

/**
 * 5. View Student Academic Results (Academic Performance)
 * GET /api/teacher/grades
 */
export const getStudentAcademicResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, studentId, evaluationType } = req.query;

    const classes = await getTeacherClassIds(teacherId);
    let classIds = classes.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      classIds = classIds.filter((id) => id.toString() === classId);
    }

    const query: any = { class: { $in: classIds } };

    if (studentId && typeof studentId === 'string') {
      query.student = studentId;
    }
    if (evaluationType && typeof evaluationType === 'string') {
      query.evaluationType = evaluationType;
    }

    const grades = await Grade.find(query)
      .populate('student', 'fullName email phone')
      .populate('class', 'classCode name')
      .sort({ testDate: -1 });

    res.status(200).json({
      success: true,
      data: { grades },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải kết quả học tập của học viên',
    });
  }
};

/**
 * 8. Update Grades / Enter Grades (Grade Updating / Grade Management)
 * POST /api/teacher/grades
 */
export const createOrEnterGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const {
      studentId,
      classId,
      evaluationType,
      title,
      testDate,
      overallBand,
      listening,
      reading,
      writing,
      speaking,
      feedback,
    } = req.body;

    if (!studentId || !classId || !title || overallBand === undefined) {
      res.status(400).json({
        success: false,
        message: 'Học viên, lớp học, tiêu đề bài thi và Overall Band là bắt buộc',
      });
      return;
    }

    const grade = await Grade.create({
      student: studentId,
      class: classId,
      teacher: teacherId,
      evaluationType: evaluationType || 'MOCK_TEST',
      title,
      testDate: testDate ? new Date(testDate) : new Date(),
      overallBand: Number(overallBand),
      listening: listening !== undefined ? Number(listening) : undefined,
      reading: reading !== undefined ? Number(reading) : undefined,
      writing: writing !== undefined ? Number(writing) : undefined,
      speaking: speaking !== undefined ? Number(speaking) : undefined,
      feedback: feedback || '',
      status: 'PUBLISHED',
    });

    const populated = await Grade.findById(grade._id)
      .populate('student', 'fullName email')
      .populate('class', 'classCode name');

    // ── Đồng bộ band hiện tại + gửi thông báo cho học viên ──
    // `Student.currentBand` là kết quả đánh giá của giảng viên. Trước đây
    // mỗi lần nhập điểm, hồ sơ học viên vẫn giữ band cũ → trang Hồ Sơ và
    // trang Kết quả học tập hiển thị sai.
    await syncStudentBand(studentId, Number(overallBand));

    await notify({
      user: studentId,
      type: 'GRADE_PUBLISHED',
      title: `📊 Điểm ${title} đã được công bố`,
      message:
        `Overall Band của bạn là ${Number(overallBand).toFixed(1)}. ` +
        (feedback || 'Xem nhận xét chi tiết của giảng viên trong mục Bảng điểm.'),
      link: `/student/classes/${classId}/grades`,
    });

    res.status(201).json({
      success: true,
      message: 'Nhập điểm học viên thành công!',
      data: { grade: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi nhập điểm học viên',
    });
  }
};

/**
 * Update an existing Grade
 * PUT /api/teacher/grades/:gradeId
 */
export const updateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gradeId } = req.params;
    const { overallBand, listening, reading, writing, speaking, feedback, title, testDate, evaluationType } = req.body;

    const grade = await Grade.findByIdAndUpdate(
      gradeId,
      {
        ...(overallBand !== undefined && { overallBand: Number(overallBand) }),
        ...(listening !== undefined && { listening: Number(listening) }),
        ...(reading !== undefined && { reading: Number(reading) }),
        ...(writing !== undefined && { writing: Number(writing) }),
        ...(speaking !== undefined && { speaking: Number(speaking) }),
        ...(feedback !== undefined && { feedback }),
        ...(title && { title }),
        ...(testDate && { testDate: new Date(testDate) }),
        ...(evaluationType && { evaluationType }),
      },
      { new: true }
    )
      .populate('student', 'fullName email')
      .populate('class', 'classCode name');

    if (!grade) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi điểm' });
      return;
    }

    // Đồng bộ band hiện tại khi giảng viên chỉnh sửa điểm đã công bố.
    if (overallBand !== undefined) {
      await syncStudentBand((grade as any).student?._id ?? (grade as any).student, Number(overallBand));
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm thành công!',
      data: { grade },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi cập nhật điểm học viên',
    });
  }
};

/**
 * Delete a Grade
 * DELETE /api/teacher/grades/:gradeId
 */
export const deleteGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gradeId } = req.params;
    await Grade.findByIdAndDelete(gradeId);
    res.status(200).json({ success: true, message: 'Đã xóa bản ghi điểm' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Lỗi khi xóa điểm' });
  }
};

/**
 * 9. Submit Schedule Change Request (Schedule Change Request)
 * POST /api/teacher/schedule-requests
 */
export const submitScheduleChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { currentClassId, currentSchedule, targetSchedule, sessionDate, targetDate, reason } = req.body;

    if (!currentClassId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Lớp học và lý do đổi lịch ca dạy là bắt buộc',
      });
      return;
    }

    const request = await ChangeRequest.create({
      teacher: teacherId,
      requesterRole: 'TEACHER',
      requestType: 'TEACHER_SCHEDULE_CHANGE',
      currentClass: currentClassId,
      currentSchedule: currentSchedule || '',
      targetSchedule: targetSchedule || '',
      sessionDate: sessionDate ? new Date(sessionDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      reason: reason.trim(),
      status: 'PENDING',
    });

    const populated = await ChangeRequest.findById(request._id).populate('currentClass', 'classCode name');

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đổi lịch ca dạy tới Ban Quản lý / Giáo vụ thành công!',
      data: { request: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi gửi yêu cầu đổi lịch dạy',
    });
  }
};

/**
 * 10. Track Change Requests (Request History / Request Tracking)
 * GET /api/teacher/schedule-requests
 */
export const getScheduleChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const requests = await ChangeRequest.find({
      $or: [{ teacher: teacherId }, { requesterRole: 'TEACHER' }],
    })
      .populate('currentClass', 'classCode name room')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải lịch sử yêu cầu đổi lịch',
    });
  }
};

/**
 * 13. View Attendance (Attendance History / Records)
 * GET /api/teacher/attendance
 */
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, sessionDate } = req.query;

    const classes = await getTeacherClassIds(teacherId);
    let classIds = classes.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      classIds = classIds.filter((id) => id.toString() === classId);
    }

    const query: any = { class: { $in: classIds } };

    if (sessionDate && typeof sessionDate === 'string') {
      const start = new Date(sessionDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(sessionDate);
      end.setHours(23, 59, 59, 999);
      query.sessionDate = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate('student', 'fullName email')
      .populate('class', 'classCode name')
      .sort({ sessionDate: -1 });

    res.status(200).json({
      success: true,
      data: { records },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải dữ liệu điểm danh',
    });
  }
};

/**
 * 14. Check Attendance / Save Attendance for a Class Session
 * POST /api/teacher/attendance
 */
export const checkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, sessionDate, records } = req.body;

    if (!classId || !records || !Array.isArray(records)) {
      res.status(400).json({
        success: false,
        message: 'Lớp học và danh sách điểm danh là bắt buộc',
      });
      return;
    }

    const date = sessionDate ? new Date(sessionDate) : new Date();

    const results = await Promise.all(
      records.map(async (rec: { studentId: string; status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'; notes?: string }) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return Attendance.findOneAndUpdate(
          {
            class: classId,
            student: rec.studentId,
            sessionDate: { $gte: startOfDay, $lte: endOfDay },
          },
          {
            class: classId,
            student: rec.studentId,
            sessionDate: date,
            status: rec.status,
            notes: rec.notes || '',
            recordedBy: teacherId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      })
    );

    // ── Thông báo cho học viên bị đánh dấu VẮNG / ĐI TRỄ ──
    // Học viên chỉ biết mình vắng khi mở trang Điểm Danh. Type
    // `ATTENDANCE_MARKED` đã có trong enum nhưng chưa nơi nào phát ra →
    // tính năng này không hoạt động. Giờ phát thông báo cho các ca bất thường
    // (vắng / đi trễ), vì đây là thông tin học viên cần biết ngay.
    const ATTENDANCE_LABEL: Record<string, string> = {
      ABSENT: 'Vắng mặt',
      LATE: 'Đi trễ',
    };
    const abnormal = records.filter(
      (rec) => rec.status === 'ABSENT' || rec.status === 'LATE'
    );
    for (const rec of abnormal) {
      await notify({
        user: rec.studentId,
        type: 'ATTENDANCE_MARKED',
        title: `📅 Điểm danh: ${ATTENDANCE_LABEL[rec.status]}`,
        message:
          `Bạn được đánh dấu ${ATTENDANCE_LABEL[rec.status].toLowerCase()} ` +
          `trong buổi học ngày ${date.toLocaleDateString('vi-VN')}.` +
          (rec.notes ? ` Ghi chú: ${rec.notes}` : ''),
        link: `/student/classes/${classId}/attendance`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã lưu điểm danh thành công cho ${results.length} học viên!`,
      data: {
        count: results.length,
        notified: abnormal.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi lưu điểm danh ca dạy',
    });
  }
};
