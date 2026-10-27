// ===========================
// IELTS Band utilities
// ===========================

/**
 * Trọng số 4 kỹ năng theo chuẩn IELTS quốc tế.
 * Overall Band = trung bình có trọng số của Listening, Reading, Writing, Speaking.
 */
export const IELTS_SKILL_WEIGHTS = {
  listening: 0.25,
  reading: 0.25,
  writing: 0.25,
  speaking: 0.25,
} as const;

/** Làm tròn band theo chuẩn IELTS: về bội số của 0.5 (5.0, 5.5, 6.0...). */
export const roundIeltsBand = (band: number): number =>
  Math.round(band * 2) / 2;

export interface BandBreakdown {
  /** Band tổng hợp theo chuẩn IELTS (đã làm tròn về bội số 0.5). */
  overall: number | null;
  /** Band trung bình có trọng số trước khi làm tròn. */
  weighted: number | null;
  /** Số kỹ năng có dữ liệu band. */
  counted: number;
  /** Danh sách kỹ năng được tính vào band tổng hợp. */
  usedSkills: string[];
}

/**
 * Tính Overall Band theo chuẩn IELTS từ 4 kỹ năng.
 *
 * Quy tắc chuẩn:
 *  - Chỉ tính những kỹ năng có band > 0.
 *  - Overall = tổng(band_i * weight_i) / tổng(trọng số của các kỹ năng được tính),
 *    sau đó làm tròn về bội số 0.5.
 *  - Nếu không có kỹ năng nào có band → trả về null.
 */
export const computeIeltsOverall = (skills: {
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
}): BandBreakdown => {
  const entries = Object.entries(IELTS_SKILL_WEIGHTS) as [
    keyof typeof IELTS_SKILL_WEIGHTS,
    number
  ][];

  let weightedSum = 0;
  let weightTotal = 0;
  const usedSkills: string[] = [];

  for (const [skill, weight] of entries) {
    const value = skills[skill];
    if (value === undefined || value === null || Number.isNaN(value) || value <= 0) {
      continue;
    }
    weightedSum += value * weight;
    weightTotal += weight;
    usedSkills.push(skill);
  }

  if (weightTotal === 0) {
    return { overall: null, weighted: null, counted: 0, usedSkills };
  }

  const weighted = weightedSum / weightTotal;
  return {
    overall: roundIeltsBand(weighted),
    weighted: Math.round(weighted * 100) / 100,
    counted: usedSkills.length,
    usedSkills,
  };
};

/**
 * Tính band tổng hợp của một danh sách kết quả đánh giá.
 *
 * Quy tắc:
 *  - Ưu tiên `overallBand` do giảng viên chấm sẵn — đây là band chính thức
 *    của kỳ thi nên được tôn trọng.
 *  - Chỉ khi bản ghi KHÔNG có `overallBand` mới suy ra từ 4 kỹ năng
 *    (dùng `computeIeltsOverall`).
 *
 * Trước đây hàm này chỉ xét `overallBand` nên khi giảng viên nhập band theo
 * từng kỹ năng mà bỏ trống `overallBand`, học viên thấy "—" dù có đủ dữ liệu.
 *
 * @returns band trung bình (đã làm tròn 0.5) hoặc null nếu không có data.
 */
export const computeAggregateBand = (
  grades: {
    overallBand?: number | null;
    listening?: number | null;
    reading?: number | null;
    writing?: number | null;
    speaking?: number | null;
  }[]
): number | null => {
  if (!grades.length) return null;

  // 1. Band chính thức do giảng viên chấm.
  const official = grades
    .filter(
      (g) =>
        g.overallBand !== undefined &&
        g.overallBand !== null &&
        !Number.isNaN(g.overallBand)
    )
    .map((g) => g.overallBand as number);

  // 2. Với bản ghi chỉ có band 4 kỹ năng, suy ra overall theo chuẩn IELTS.
  const derived = grades
    .filter(
      (g) =>
        (g.overallBand === undefined || g.overallBand === null) &&
        (g.listening != null || g.reading != null || g.writing != null || g.speaking != null)
    )
    .map((g) => computeIeltsOverall(g).overall)
    .filter((b): b is number => b !== null);

  const all = [...official, ...derived];
  if (all.length === 0) return null;

  const sum = all.reduce((s, b) => s + b, 0);
  return roundIeltsBand(sum / all.length);
};

/**
 * Tính band trung bình theo 4 kỹ năng cho một danh sách kết quả đánh giá.
 *
 * Khác với `computeAggregateBand` (dùng band chính thức của giảng viên),
 * hàm này luôn suy ra từ 4 kỹ năng — dùng để hiển thị "band ước tính theo
 * kỹ năng" khi so sánh xu hướng học tập.
 */
export const computeSkillAggregateBand = (
  grades: {
    listening?: number | null;
    reading?: number | null;
    writing?: number | null;
    speaking?: number | null;
  }[]
): number | null => {
  if (!grades.length) return null;

  // Trung bình từng kỹ năng trước, rồi mới áp trọng số — tránh việc một
  // bài thi chỉ có band Writing kéo lệch toàn bộ.
  const avgOf = (pick: (g: any) => number | null | undefined): number | null => {
    const vals = grades
      .map(pick)
      .filter((v): v is number => v != null && !Number.isNaN(v) && v > 0);
    if (!vals.length) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  return computeIeltsOverall({
    listening: avgOf((g) => g.listening),
    reading: avgOf((g) => g.reading),
    writing: avgOf((g) => g.writing),
    speaking: avgOf((g) => g.speaking),
  }).overall;
};
