/**
 * Kịch bản kiểm thử tự động cho module Student (không đụng payment).
 * Chạy: npx ts-node --transpile-only scripts/verify-student-flow.ts
 */
const BASE = 'http://localhost:5000/api';

async function call(path: string, opts: { method?: string; body?: any; token?: string } = {}) {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

async function login(email: string, password = 'Password123@') {
  const r = await call('/auth/login', { method: 'POST', body: { email, password } });
  if (!r.json?.success) throw new Error(`Login failed ${email}: ${JSON.stringify(r.json)}`);
  return r.json.data.accessToken || r.json.data.token;
}

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra?: any) {
  if (cond) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}

async function main() {
  console.log('== 1. Đăng nhập ==');
  const stuTok = await login('student.dang@gmail.com');
  const staffTok = await login('staff@educenter.edu.vn');
  const teachTok = await login('teacher.an@educenter.edu.vn');
  check('student login', !!stuTok);
  check('staff login', !!staffTok);
  check('teacher login', !!teachTok);

  console.log('\n== 2. Dashboard học viên ==');
  const dash = await call('/student/dashboard', { token: stuTok });
  check('dashboard 200', dash.status === 200, dash.json);
  const d = dash.json?.data;
  check('dashboard có stats', !!d?.stats);
  check('dashboard myClasses > 0', (d?.myClasses?.length || 0) > 0, d?.myClasses?.length);
  check('dashboard currentClass có', !!d?.currentClass?.class?.classCode, d?.currentClass);

  console.log('\n== 3. Lớp của tôi + open-classes ==');
  const my = await call('/student/classes', { token: stuTok });
  check('my classes 200', my.status === 200);
  const enrollments = my.json?.data?.classes || [];
  check('có enrollment active', Array.isArray(enrollments) && enrollments.length > 0, my.json?.data);
  const myClassId = enrollments[0]?.class?._id;

  const open = await call('/student/open-classes', { token: stuTok });
  check('open-classes 200', open.status === 200, open.json);
  const openClasses = open.json?.data?.classes || [];
  check('open-classes có danh sách', Array.isArray(openClasses), open.json?.data);
  check('mọi lớp mở đều status OPEN + startDate tương lai',
    openClasses.every((c: any) => c.status === 'OPEN' && new Date(c.startDate).getTime() >= Date.now()),
    openClasses.map((c: any) => ({ s: c.status, d: c.startDate })));
  check('open-classes có seatsLeft', openClasses.every((c: any) => typeof c.seatsLeft === 'number'), openClasses[0]);
  check('open-classes có canEnroll + myEnrollmentStatus',
    openClasses.every((c: any) => 'canEnroll' in c && 'myEnrollmentStatus' in c), openClasses[0]);
  check('seatsLeft = capacity - currentStudents',
    openClasses.every((c: any) => c.seatsLeft === Math.max(0, c.capacity - c.currentStudents)), openClasses[0]);
  console.log('   open classes:', openClasses.map((c: any) => `${c.classCode}(${c.seatsLeft} chỗ, canEnroll=${c.canEnroll})`).join(', '));

  console.log('\n== 4. Chi tiết lớp / lịch / bài tập / điểm danh / điểm ==');
  for (const [label, p] of [
    ['class detail', `/student/classes/${myClassId}`],
    ['assignments', `/student/classes/${myClassId}/assignments`],
    ['attendance', `/student/classes/${myClassId}/attendance`],
    ['grades', `/student/classes/${myClassId}/grades`],
    ['schedule', `/student/classes/${myClassId}/schedule`],
    ['feedback', `/student/classes/${myClassId}/feedback`],
  ] as const) {
    const r = await call(p, { token: stuTok });
    check(`${label} 200`, r.status === 200, r.json);
  }
  const comb = await call('/student/schedule/all', { token: stuTok });
  check('combined schedule 200', comb.status === 200, comb.json);
  const sched = comb.json?.data?.schedule || comb.json?.data || [];
  check('lịch tổng hợp có buổi', Array.isArray(sched) && sched.length > 0, comb.json?.data);

  console.log('\n== 5. Yêu cầu thay đổi của học viên ==');
  const reqs = await call('/student/requests', { token: stuTok });
  check('student requests 200', reqs.status === 200, reqs.json);
  const myReqs = reqs.json?.data?.requests || reqs.json?.data || [];
  check('có yêu cầu từ seed', myReqs.length > 0, myReqs.length);
  check('yêu cầu có currentClass populated', !!myReqs[0]?.currentClass?.classCode, myReqs[0]);

  console.log('\n== 6. Thông báo học viên ==');
  const noti = await call('/student/notifications', { token: stuTok });
  check('student notifications 200', noti.status === 200, noti.json);
  const items = noti.json?.data?.items || [];
  check('có thông báo từ seed', items.length > 0, items.length);
  check('linkUrl là route nội bộ', items.every((n: any) => !n.linkUrl || n.linkUrl.startsWith('/')), items.map((n: any) => n.linkUrl));

  console.log('\n== 7. Nhân viên: yêu cầu + phản hồi + thông báo ==');
  const sreqs = await call('/staff/requests', { token: staffTok });
  check('staff requests 200', sreqs.status === 200, sreqs.json);
  const sreqList = sreqs.json?.data?.requests || [];
  check('staff thấy yêu cầu', sreqList.length > 0, sreqList.length);
  check('staff requests có pagination', !!sreqs.json?.pagination, sreqs.json?.pagination);

  const ssearch = await call('/staff/requests?search=Alex', { token: staffTok });
  check('staff search 200', ssearch.status === 200);
  check('search lọc đúng (total <= toàn bộ)',
    (ssearch.json?.pagination?.total ?? 0) <= (sreqs.json?.pagination?.total ?? 0),
    { search: ssearch.json?.pagination, all: sreqs.json?.pagination });
  check('search trả về bản ghi khớp',
    (ssearch.json?.data?.requests || []).every((r: any) =>
      JSON.stringify(r).toLowerCase().includes('alex')), ssearch.json?.data?.requests?.[0]);

  const fb = await call('/staff/feedback', { token: staffTok });
  check('staff feedback 200', fb.status === 200, fb.json);
  const fbItems = fb.json?.data?.items || [];
  check('có phản hồi từ seed', fbItems.length > 0, fbItems.length);
  check('feedback có stats', !!fb.json?.stats, fb.json?.stats);
  check('feedback populate sender/class', !!fbItems[0]?.sender?.fullName && !!fbItems[0]?.class?.classCode, fbItems[0]);

  const snoti = await call('/staff/notifications', { token: staffTok });
  check('staff notifications 200', snoti.status === 200, snoti.json);
  const sItems = snoti.json?.data?.items || [];
  check('staff có thông báo từ seed', sItems.length > 0, sItems.length);

  if (sItems.length) {
    const rr = await call(`/staff/notifications/${sItems[0]._id}/read`, { method: 'PATCH', token: staffTok });
    check('staff mark read 200', rr.status === 200, rr.json);
    const ra = await call('/staff/notifications/read-all', { method: 'PATCH', token: staffTok });
    check('staff read-all 200', ra.status === 200, ra.json);
    // KHÔNG xoá notification ở đây: script chạy nhiều lần sẽ làm mất
    // dữ liệu seed và các lần chạy sau sẽ fail ở check
    // "staff có thông báo từ seed". Việc xoá được kiểm tra ở script
    // `verify-notifications` riêng (hoặc thủ công).
  }

  console.log('\n== 8. Phân quyền ==');
  const stuOnStaff = await call('/staff/requests', { token: stuTok });
  check('học viên bị chặn khỏi /staff/requests', stuOnStaff.status === 403, stuOnStaff.status);
  const teachOnStudent = await call('/student/dashboard', { token: teachTok });
  check('giảng viên bị chặn khỏi /student/dashboard', teachOnStudent.status === 403, teachOnStudent.status);
  const noAuth = await call('/student/dashboard');
  check('không token bị chặn', noAuth.status === 401, noAuth.status);

  console.log('\n== 9. Giảng viên: điểm danh + chấm bài ==');
  const tClasses = await call('/teacher/classes', { token: teachTok });
  check('teacher classes 200', tClasses.status === 200, tClasses.json);
  const tClassList = tClasses.json?.data?.classes || tClasses.json?.data || [];
  check('giảng viên có lớp', tClassList.length > 0, tClassList.length);
  const tClassId = tClassList[0]?._id;
  const tStudents = await call(`/teacher/students?classId=${tClassId}`, { token: teachTok });
  check('teacher students 200', tStudents.status === 200, tStudents.json);
  const tStuList = tStudents.json?.data?.students || tStudents.json?.data || [];
  check('lớp có học viên', tStuList.length > 0, tStuList.length);

  if (tStuList.length) {
    const sid = tStuList[0]._id;
    const att = await call('/teacher/attendance', {
      method: 'POST', token: teachTok,
      body: { classId: tClassId, records: [{ studentId: sid, status: 'ABSENT', notes: 'Vắng mặt kiểm thử' }] },
    });
    check('teacher check attendance 200', att.status === 200, att.json);
    check('attendance báo đã gửi thông báo', att.json?.data?.notified === 1, att.json?.data);

    const stuNoti = await call('/student/notifications', { token: stuTok });
    const stuItems = stuNoti.json?.data?.items || [];
    const hasAtt = stuItems.some((n: any) => n.type === 'ATTENDANCE_MARKED');
    check('học viên nhận thông báo điểm danh', hasAtt, stuItems.map((n: any) => n.type));
    check('link thông báo điểm danh hợp lệ',
      stuItems.filter((n: any) => n.type === 'ATTENDANCE_MARKED').every((n: any) => n.linkUrl?.startsWith('/student/classes/')),
      stuItems.filter((n: any) => n.type === 'ATTENDANCE_MARKED').map((n: any) => n.linkUrl));
  }

  console.log('\n== 10. Tự ghi danh lớp mở ==');
  const target = openClasses.find((c: any) => c.canEnroll && c.seatsLeft > 0);
  if (target) {
    const en = await call('/student/enrollments', { method: 'POST', token: stuTok, body: { classId: target._id } });
    check('self-enroll 201', en.status === 201, en.json);
    const en2 = await call('/student/enrollments', { method: 'POST', token: stuTok, body: { classId: target._id } });
    check('self-enroll lần 2 bị chặn (409)', en2.status === 409, en2.json);
    const drop = await call(`/student/enrollments/${en.json?.data?.enrollment?._id}`, { method: 'DELETE', token: stuTok });
    check('self-drop 200', drop.status === 200, drop.json);
  } else {
    console.log('  (bỏ qua: không có lớp mở nào để ghi danh)');
  }

  console.log('\n== 11. Duyệt yêu cầu (staff) ==');
  // Yêu cầu của học viên (không phải giảng viên) mới sinh thông báo cho học viên.
  const pending = sreqList.find((r: any) => r.status === 'PENDING' && r.requesterRole === 'STUDENT');
  if (pending) {
    const rev = await call(`/staff/requests/${pending._id}/review`, {
      method: 'PATCH', token: staffTok, body: { status: 'APPROVED', reviewNote: 'Kiểm thử duyệt' },
    });
    check('staff review 200', rev.status === 200, rev.json);
    const targetStuTok = pending.student?.email === 'student.dang@gmail.com'
      ? stuTok
      : await login(pending.student?.email);
    const stuNoti2 = await call('/student/notifications', { token: targetStuTok });
    const items2 = stuNoti2.json?.data?.items || [];
    check('học viên nhận thông báo duyệt/từ chối',
      items2.some((n: any) => n.type === 'REQUEST_APPROVED' || n.type === 'REQUEST_REJECTED'),
      items2.map((n: any) => n.type));
    check('link thông báo duyệt hợp lệ',
      items2.filter((n: any) => n.type === 'REQUEST_APPROVED' || n.type === 'REQUEST_REJECTED')
        .every((n: any) => n.linkUrl === '/student/requests'),
      items2.map((n: any) => n.linkUrl));
  } else {
    console.log('  (bỏ qua: không có yêu cầu PENDING của học viên)');
  }

  console.log(`\n===== KẾT QUẢ: ${pass} pass / ${fail} fail =====`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('LỖI:', e); process.exit(1); });
