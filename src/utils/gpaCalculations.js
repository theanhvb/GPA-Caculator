/**
 * GPA Calculations Utility
 * All core formulas for GPA calculation, grade conversion, and recommendations.
 */

/** Default conversion table: scale 10 → scale 4 + letter grade */
export const DEFAULT_CONVERSION_TABLE = [
  { min: 8.5, max: 10.0, scale4: 4.0, letter: 'A' },
  { min: 8.0, max: 8.49, scale4: 3.5, letter: 'B+' },
  { min: 7.0, max: 7.99, scale4: 3.0, letter: 'B' },
  { min: 6.5, max: 6.99, scale4: 2.5, letter: 'C+' },
  { min: 5.5, max: 6.49, scale4: 2.0, letter: 'C' },
  { min: 5.0, max: 5.49, scale4: 1.5, letter: 'D+' },
  { min: 4.0, max: 4.99, scale4: 1.0, letter: 'D' },
  { min: 0.0, max: 3.99, scale4: 0.0, letter: 'F' },
];

/** Default classification thresholds (on scale 4) */
export const DEFAULT_THRESHOLDS = [
  { label: 'Xuất sắc', min: 3.6, max: 4.0, color: 'excellent' },
  { label: 'Giỏi', min: 3.2, max: 3.59, color: 'good' },
  { label: 'Khá', min: 2.5, max: 3.19, color: 'average' },
  { label: 'Trung bình', min: 2.0, max: 2.49, color: 'medium' },
  { label: 'Yếu / Không đạt', min: 0.0, max: 1.99, color: 'fail' },
];

/**
 * Convert a score on scale 10 to scale 4 using the conversion table.
 */
export function convertToScale4(score10, conversionTable = DEFAULT_CONVERSION_TABLE) {
  if (score10 === null || score10 === undefined || score10 === '') return null;
  const s = parseFloat(score10);
  if (isNaN(s)) return null;
  const row = conversionTable.find(r => s >= r.min && s <= r.max);
  return row ? row.scale4 : 0.0;
}

/**
 * Get letter grade from scale 10 score.
 */
export function getLetterGrade(score10, conversionTable = DEFAULT_CONVERSION_TABLE) {
  if (score10 === null || score10 === undefined || score10 === '') return '-';
  const s = parseFloat(score10);
  if (isNaN(s)) return '-';
  const row = conversionTable.find(r => s >= r.min && s <= r.max);
  return row ? row.letter : 'F';
}

/**
 * Get classification label + color from a GPA (scale 4).
 */
export function getClassification(gpa4, thresholds = DEFAULT_THRESHOLDS) {
  if (gpa4 === null || gpa4 === undefined || isNaN(gpa4)) {
    return { label: '-', color: 'fail' };
  }
  const t = thresholds.find(t => gpa4 >= t.min && gpa4 <= t.max);
  return t || { label: 'Không xác định', color: 'fail' };
}

/**
 * Calculate weighted GPA on scale 10.
 * Only counts subjects with status === 'done'.
 */
export function calculateGPA10(subjects, conversionTable) {
  const done = getCompletedSubjects(subjects);
  if (done.length === 0) return { gpa: null, totalCredits: 0 };

  let weightedSum = 0;
  let totalCredits = 0;

  for (const s of done) {
    const score = getEffectiveScore(s);
    const credits = parseInt(s.credits, 10);
    if (score === null || isNaN(credits) || credits <= 0) continue;
    weightedSum += score * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return { gpa: null, totalCredits: 0 };
  return { gpa: parseFloat((weightedSum / totalCredits).toFixed(2)), totalCredits };
}

/**
 * Calculate weighted GPA on scale 4.
 * Converts each subject first, then computes weighted average.
 */
export function calculateGPA4(subjects, conversionTable = DEFAULT_CONVERSION_TABLE) {
  const done = getCompletedSubjects(subjects);
  if (done.length === 0) return { gpa: null, totalCredits: 0 };

  let weightedSum = 0;
  let totalCredits = 0;

  for (const s of done) {
    const score = getEffectiveScore(s);
    const credits = parseInt(s.credits, 10);
    if (score === null || isNaN(credits) || credits <= 0) continue;
    const s4 = convertToScale4(score, conversionTable);
    if (s4 === null) continue;
    weightedSum += s4 * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return { gpa: null, totalCredits: 0 };
  return { gpa: parseFloat((weightedSum / totalCredits).toFixed(3)), totalCredits };
}

/**
 * Get GPA data grouped by semester (for chart).
 */
export function getGPABySemester(subjects, conversionTable = DEFAULT_CONVERSION_TABLE) {
  // Group by semester, sorted
  const grouped = {};
  for (const s of subjects) {
    if (s.status !== 'done') continue;
    const sem = s.semester || 'Không rõ';
    if (!grouped[sem]) grouped[sem] = [];
    grouped[sem].push(s);
  }

  const semesters = Object.keys(grouped).sort();
  const result = [];
  let cumulativeWeightedSum10 = 0;
  let cumulativeWeightedSum4 = 0;
  let cumulativeTotalCredits = 0;

  for (const sem of semesters) {
    const subs = grouped[sem];
    let semSum10 = 0;
    let semSum4 = 0;
    let semCredits = 0;

    for (const s of subs) {
      const score = getEffectiveScore(s);
      const credits = parseInt(s.credits, 10);
      if (score === null || isNaN(credits) || credits <= 0) continue;
      const s4 = convertToScale4(score, conversionTable);
      semSum10 += score * credits;
      semSum4 += (s4 ?? 0) * credits;
      semCredits += credits;
    }

    const semGPA10 = semCredits > 0 ? parseFloat((semSum10 / semCredits).toFixed(2)) : null;
    const semGPA4 = semCredits > 0 ? parseFloat((semSum4 / semCredits).toFixed(3)) : null;

    cumulativeWeightedSum10 += semSum10;
    cumulativeWeightedSum4 += semSum4;
    cumulativeTotalCredits += semCredits;

    const cumGPA10 = cumulativeTotalCredits > 0
      ? parseFloat((cumulativeWeightedSum10 / cumulativeTotalCredits).toFixed(2))
      : null;
    const cumGPA4 = cumulativeTotalCredits > 0
      ? parseFloat((cumulativeWeightedSum4 / cumulativeTotalCredits).toFixed(3))
      : null;

    result.push({
      semester: sem,
      semesterGPA10: semGPA10,
      semesterGPA4: semGPA4,
      cumulativeGPA10: cumGPA10,
      cumulativeGPA4: cumGPA4,
      credits: semCredits,
    });
  }

  return result;
}

/**
 * Calculate the required average GPA for remaining credits.
 * Returns { requiredGPA10, requiredGPA4, status, message }
 *
 * reqGPA4  = điểm GPA thang 4 TB cần đạt cho tín chỉ còn lại
 * reqGPA10 = điểm TB thang 10 cần đạt cho tín chỉ còn lại
 *            Dùng weighted formula với targetGPA10 là điểm min của band scale4 tương ứng
 *            VD: Giỏi (≥3.2 scale4) → band B+ (3.5, min=8.0)
 *                reqGPA10 = (8.0×120 − 7.64×75) / 45 = 8.60 ← điểm TB cần đạt
 */
export function calculateRequiredGPA(
  currentGPA10, currentGPA4, creditsDone, totalCredits,
  targetLabel, thresholds = DEFAULT_THRESHOLDS, conversionTable = DEFAULT_CONVERSION_TABLE
) {
  const creditsRemaining = totalCredits - creditsDone;

  if (creditsRemaining <= 0) {
    return {
      status: 'completed',
      message: 'Bạn đã hoàn thành toàn bộ tín chỉ. GPA không thể thay đổi nữa.',
      requiredGPA10: null,
      requiredGPA4: null,
    };
  }

  const threshold = thresholds.find(t => t.label === targetLabel);
  if (!threshold) return { status: 'error', message: 'Mục tiêu không hợp lệ.' };

  const targetGPA4 = threshold.min;

  // Tìm điểm thang 10 tối thiểu tương ứng với band scale4 của mục tiêu
  // VD: Giỏi (min=3.2) → band đủ điều kiện thấp nhất là B+ (scale4=3.5, min score10=8.0)
  // Đây là "target" để tính weighted average → reqGPA10 là điểm TB thực sự cần đạt
  const targetGPA10 = reqGPA4ToMinScore10(targetGPA4, conversionTable) ?? 10.0;

  // Điểm TB cần đạt cho tín chỉ còn lại (weighted average formula)
  const reqGPA4 = ((targetGPA4 * totalCredits) - (currentGPA4 * creditsDone)) / creditsRemaining;
  const reqGPA10 = ((targetGPA10 * totalCredits) - (currentGPA10 * creditsDone)) / creditsRemaining;

  // Check if already achieved
  if (currentGPA4 >= targetGPA4) {
    return {
      status: 'achieved',
      message: `Bạn đã đạt mục tiêu "${targetLabel}" (GPA 4: ${currentGPA4.toFixed(2)} ≥ ${targetGPA4}). Hãy duy trì!`,
      requiredGPA10: null,
      requiredGPA4: null,
    };
  }

  // Không khả thi
  if (reqGPA4 > 4.0 || reqGPA10 > 10.0) {
    return {
      status: 'impossible',
      message: `Mục tiêu "${targetLabel}" không khả thi với ${creditsRemaining} tín chỉ còn lại. Cần GPA ${reqGPA4.toFixed(2)}/4.0 — vượt giới hạn tối đa.`,
      requiredGPA10: Number.isFinite(reqGPA10) ? parseFloat(reqGPA10.toFixed(2)) : null,
      requiredGPA4: parseFloat(reqGPA4.toFixed(2)),
      suggestTarget: findLowerTarget(currentGPA4, creditsDone, totalCredits, creditsRemaining, thresholds),
    };
  }

  return {
    status: 'feasible',
    message: '',
    requiredGPA10: parseFloat(reqGPA10.toFixed(2)),
    requiredGPA4: parseFloat(reqGPA4.toFixed(2)),
    creditsRemaining,
  };
}

/**
 * Get improvement suggestions (subjects to retake for max GPA boost).
 */
export function getImprovementSuggestions(subjects, conversionTable = DEFAULT_CONVERSION_TABLE) {
  const done = getCompletedSubjects(subjects);
  const candidates = done.filter(s => {
    const score = getEffectiveScore(s);
    return score !== null && score < 8;
  });

  // Compute impact score and GPA delta
  const result = candidates.map(s => {
    const score = getEffectiveScore(s);
    const credits = parseInt(s.credits, 10);
    const difficulty = parseInt(s.difficulty, 10) || 3;
    const impactScore = parseFloat(((8 - score) * credits / difficulty).toFixed(3));

    // Simulate GPA if this subject is improved to 8.0
    const simulatedSubjects = done.map(sub =>
      sub.id === s.id ? { ...sub, score: 8, retakeScore: undefined } : sub
    );
    const simGPA10 = calculateGPA10(simulatedSubjects, conversionTable).gpa;
    const simGPA4 = calculateGPA4(simulatedSubjects, conversionTable).gpa;

    const currentGPA10 = calculateGPA10(done, conversionTable).gpa;
    const currentGPA4 = calculateGPA4(done, conversionTable).gpa;

    return {
      ...s,
      currentScore: score,
      impactScore,
      simulatedGPA10: simGPA10,
      simulatedGPA4: simGPA4,
      deltaGPA10: simGPA10 !== null && currentGPA10 !== null
        ? parseFloat((simGPA10 - currentGPA10).toFixed(2))
        : null,
      deltaGPA4: simGPA4 !== null && currentGPA4 !== null
        ? parseFloat((simGPA4 - currentGPA4).toFixed(3))
        : null,
    };
  });

  return result.sort((a, b) => b.impactScore - a.impactScore);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get all subjects with status = 'done', handling retake logic */
export function getCompletedSubjects(subjects) {
  const done = subjects.filter(s => s.status === 'done');

  // Group by subject code to handle retakes
  const byCode = {};
  for (const s of done) {
    const code = s.code?.trim().toLowerCase() || s.id;
    if (!byCode[code]) byCode[code] = [];
    byCode[code].push(s);
  }

  // For each group, pick the right score based on retake preference
  const result = [];
  for (const code of Object.keys(byCode)) {
    const group = byCode[code];
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Multiple entries with same code = retakes
      // The one that has retakeOf set is a retake; use retakePolicy
      // Pick the one with retakePolicy === 'highest' → max score
      // or retakePolicy === 'latest' → last entry
      const policy = group.find(s => s.retakePolicy)?.retakePolicy || 'highest';
      let chosen;
      if (policy === 'latest') {
        // Latest = last in array (by creation order)
        chosen = group[group.length - 1];
      } else {
        // Highest score
        chosen = group.reduce((best, s) => {
          const score = getEffectiveScore(s);
          const bestScore = getEffectiveScore(best);
          return (score ?? -1) > (bestScore ?? -1) ? s : best;
        }, group[0]);
      }
      result.push(chosen);
    }
  }

  return result;
}

/** Get the effective score for a subject (retakeScore if set, else score) */
export function getEffectiveScore(subject) {
  const raw = subject.retakeScore !== undefined && subject.retakeScore !== ''
    ? subject.retakeScore
    : subject.score;
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

/**
 * Reverse-lookup: tìm điểm thang 10 TỐI THIỂU cần đạt mỗi môn
 * để đảm bảo scale4 tương ứng đủ đáp ứng reqGPA4 trung bình.
 *
 * Vì conversion là step function (bậc thang), nếu reqGPA4 nằm giữa
 * hai bậc (VD: 3.35 nằm giữa B=3.0 và B+=3.5), thì cần đạt bậc
 * cao hơn (B+, tức ≥8.0) để đảm bảo an toàn.
 *
 * Ví dụ: reqGPA4=3.35 → bậc đủ điều kiện thấp nhất là 3.5 (B+) → min=8.0
 */
function reqGPA4ToMinScore10(reqGPA4, conversionTable) {
  // Lọc các band có scale4 >= reqGPA4 (đủ điều kiện)
  const eligible = conversionTable.filter(r => r.scale4 >= reqGPA4 - 0.0001);
  if (eligible.length === 0) return null; // không khả thi
  // Lấy band có scale4 thấp nhất trong nhóm đủ điều kiện
  const lowestQualifying = eligible.reduce((min, r) => r.scale4 < min.scale4 ? r : min);
  return lowestQualifying.min;
}

/** Find the highest still-feasible target */
function findLowerTarget(currentGPA4, creditsDone, totalCredits, creditsRemaining, thresholds) {
  const feasible = thresholds.filter(t => {
    if (currentGPA4 >= t.min) return false;
    const reqGPA4 = ((t.min * totalCredits) - (currentGPA4 * creditsDone)) / creditsRemaining;
    return reqGPA4 <= 4.0;
  });
  return feasible.length > 0 ? feasible[0].label : null;
}
