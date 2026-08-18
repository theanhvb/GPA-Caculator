import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, RefreshCw, BookOpen, ChevronDown, ChevronUp,
  AlertTriangle, Check, FileSpreadsheet, X, Info, FolderPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AddSubjectModal from '../components/AddSubjectModal';
import { getEffectiveScore, getLetterGrade, convertToScale4, calculateGPA4, calculateGPA10 } from '../utils/gpaCalculations';

const STATUS_LABELS = { done: 'Đã học', planned: 'Dự kiến' };
const DIFFICULTY_STARS = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' };

// ─── FPT Curriculum Data ──────────────────────────────────────────────────────

const FPT_CURRICULUM = [
  { code: "VOV114", name: "Võ 1", semester: "HK0", credits: 2 },
  { code: "VOV124", name: "Võ 2", semester: "HK0", credits: 2 },
  { code: "VOV134", name: "Võ 3", semester: "HK0", credits: 2 },
  { code: "DSA103", name: "Sáo", semester: "HK0", credits: 3 },
  { code: "CSI106", name: "Introduction to Computer Science", semester: "HK1", credits: 3 },
  { code: "SSL101c", name: "Academic Skills for University Success", semester: "HK1", credits: 3 },
  { code: "PRF192", name: "Programming Fundamentals", semester: "HK1", credits: 3 },
  { code: "MAE101", name: "Mathematics for Engineering", semester: "HK1", credits: 3 },
  { code: "CEA201", name: "Computer Organization and Architecture", semester: "HK1", credits: 3 },
  { code: "PRO192", name: "Object-Oriented Programming", semester: "HK2", credits: 3 },
  { code: "MAD101", name: "Discrete mathematics", semester: "HK2", credits: 3 },
  { code: "OSG202", name: "Operating Systems", semester: "HK2", credits: 3 },
  { code: "NWC204", name: "Computer Networking", semester: "HK2", credits: 3 },
  { code: "SSG104", name: "Communication and In-Group Working Skills", semester: "HK2", credits: 3 },
  { code: "CSD201", name: "Data Structures and Algorithms", semester: "HK3", credits: 3 },
  { code: "DBI202", name: "Database Systems", semester: "HK3", credits: 3 },
  { code: "JPD113", name: "Nhật 1", semester: "HK3", credits: 3 },
  { code: "WED201c", name: "Web Design", semester: "HK3", credits: 3 },
  { code: "SWE201c", name: "Introduction to Software Engineering", semester: "HK4", credits: 3 },
  { code: "JPD123", name: "Nhật 2", semester: "HK4", credits: 3 },
  { code: "IOT102", name: "Internet of Things", semester: "HK4", credits: 3 },
  { code: "PRJ301", name: "Java Web application development", semester: "HK4", credits: 3 },
  { code: "MAS291", name: "Statistics & Probability", semester: "HK4", credits: 3 },
  { code: "SWR302", name: "Software Requirements", semester: "HK5", credits: 3 },
  { code: "SWT301", name: "Software Testing", semester: "HK5", credits: 3 },
  { code: "WDU203c", name: "The UI/UX Design", semester: "HK5", credits: 3 },
  { code: "FGU301", name: "Fundamental Game Development with Unity", semester: "HK5", credits: 3 },
  { code: "SWP391", name: "Software development project", semester: "HK5", credits: 3 },
  { code: "EXE101", name: "Experiential Entrepreneurship 1", semester: "HK7", credits: 3 },
  { code: "PMG201c", name: "Project Management", semester: "HK7", credits: 3 },
  { code: "AGU301", name: "Advanced Game Development", semester: "HK7", credits: 3 },
  { code: "GDC301", name: "Game Design Fundamentals", semester: "HK7", credits: 3 },
  { code: "SWD392", name: "Software Architecture and Design", semester: "HK7", credits: 3 },
  { code: "GNS301", name: "Game Networking and Server Development", semester: "HK8", credits: 3 },
  { code: "PRM393", name: "Mobile Programming", semester: "HK8", credits: 3 },
  { code: "EXE201", name: "Experiential Entrepreneurship 2", semester: "HK8", credits: 3 },
  { code: "ITE302c", name: "Ethics in IT", semester: "HK8", credits: 3 },
  { code: "MLN122", name: "Political economics of Marxism - Leninism", semester: "HK8", credits: 3 },
  { code: "MLN111", name: "Philosophy of Marxism - Leninism", semester: "HK8", credits: 3 },
  { code: "MLN131", name: "Scientific socialism", semester: "HK9", credits: 3 },
  { code: "VNR202", name: "History of Vietnam Communist Party", semester: "HK9", credits: 3 },
  { code: "HCM202", name: "Ho Chi Minh Ideology", semester: "HK9", credits: 3 },
  { code: "SEP490", name: "SE Capstone Project", semester: "HK9", credits: 10 }
];

const NORMAL_CURRICULUM = [
  // HK1 (15TC)
  { code: "MATH101", name: "Giải tích 1", semester: "HK1", credits: 3 },
  { code: "PHYS101", name: "Vật lý đại cương 1", semester: "HK1", credits: 3 },
  { code: "IT101", name: "Tin học đại cương", semester: "HK1", credits: 3 },
  { code: "PHIL101", name: "Triết học Mác - Lênin", semester: "HK1", credits: 3 },
  { code: "ENG101", name: "Tiếng Anh 1", semester: "HK1", credits: 3 },
  // HK2 (17TC)
  { code: "MATH102", name: "Giải tích 2", semester: "HK2", credits: 3 },
  { code: "PHYS102", name: "Vật lý đại cương 2", semester: "HK2", credits: 3 },
  { code: "MATH103", name: "Đại số tuyến tính", semester: "HK2", credits: 3 },
  { code: "IT102", name: "Nhập môn lập trình", semester: "HK2", credits: 3 },
  { code: "ENG102", name: "Tiếng Anh 2", semester: "HK2", credits: 3 },
  { code: "POL102", name: "Kinh tế chính trị Mác - Lênin", semester: "HK2", credits: 2 },
  // HK3 (17TC)
  { code: "MATH201", name: "Toán rời rạc", semester: "HK3", credits: 3 },
  { code: "MATH202", name: "Xác suất thống kê", semester: "HK3", credits: 3 },
  { code: "IT201", name: "Kỹ thuật lập trình", semester: "HK3", credits: 3 },
  { code: "IT202", name: "Kiến trúc máy tính", semester: "HK3", credits: 3 },
  { code: "ENG103", name: "Tiếng Anh 3", semester: "HK3", credits: 3 },
  { code: "POL103", name: "Chủ nghĩa xã hội khoa học", semester: "HK3", credits: 2 },
  // HK4 (17TC)
  { code: "IT203", name: "Cấu trúc dữ liệu và giải thuật", semester: "HK4", credits: 3 },
  { code: "IT204", name: "Lập trình hướng đối tượng", semester: "HK4", credits: 3 },
  { code: "IT205", name: "Cơ sở dữ liệu", semester: "HK4", credits: 3 },
  { code: "IT206", name: "Hệ điều hành", semester: "HK4", credits: 3 },
  { code: "ENG104", name: "Tiếng Anh chuyên ngành", semester: "HK4", credits: 3 },
  { code: "POL104", name: "Lịch sử Đảng Cộng sản Việt Nam", semester: "HK4", credits: 2 },
  // HK5 (17TC)
  { code: "IT301", name: "Mạng máy tính", semester: "HK5", credits: 3 },
  { code: "IT302", name: "Công nghệ phần mềm", semester: "HK5", credits: 3 },
  { code: "IT303", name: "Phân tích thiết kế hệ thống", semester: "HK5", credits: 3 },
  { code: "IT304", name: "Lập trình Web", semester: "HK5", credits: 3 },
  { code: "IT305", name: "Trí tuệ nhân tạo", semester: "HK5", credits: 3 },
  { code: "POL105", name: "Tư tưởng Hồ Chí Minh", semester: "HK5", credits: 2 },
  // HK6 (15TC)
  { code: "IT401", name: "An toàn thông tin", semester: "HK6", credits: 3 },
  { code: "IT402", name: "Quản lý dự án CNTT", semester: "HK6", credits: 3 },
  { code: "IT403", name: "Chuyên đề tự chọn 1", semester: "HK6", credits: 3 },
  { code: "IT404", name: "Chuyên đề tự chọn 2", semester: "HK6", credits: 3 },
  { code: "IT405", name: "Thực tập cơ sở", semester: "HK6", credits: 3 },
  // HK7 (12TC)
  { code: "IT501", name: "Kiểm thử phần mềm", semester: "HK7", credits: 3 },
  { code: "IT502", name: "Chuyên đề tự chọn 3", semester: "HK7", credits: 3 },
  { code: "IT503", name: "Chuyên đề tự chọn 4", semester: "HK7", credits: 3 },
  { code: "IT504", name: "Thực tập chuyên ngành", semester: "HK7", credits: 3 },
  // HK8 (10TC)
  { code: "IT601", name: "Thực tập tốt nghiệp", semester: "HK8", credits: 3 },
  { code: "IT602", name: "Đồ án tốt nghiệp / Khóa luận", semester: "HK8", credits: 7 },
];

// ─── Add Semester Modal ───────────────────────────────────────────────────────

function AddSemesterModal({ existingSemesters, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // Generate smart suggestion
  const suggestion = useMemo(() => {
    if (existingSemesters.length === 0) return 'HK1 2024-2025';
    const last = existingSemesters[existingSemesters.length - 1];
    // Try to increment HKx YYYY-YYYY pattern
    const match = last.match(/HK(\d+)\s+(\d{4})-(\d{4})/i);
    if (match) {
      const hk = parseInt(match[1]);
      const y1 = parseInt(match[2]);
      const y2 = parseInt(match[3]);
      if (hk === 1) return `HK2 ${y1}-${y2}`;
      if (hk === 2) return `HK1 ${y1 + 1}-${y2 + 1}`;
      if (hk === 3) return `HK1 ${y1 + 1}-${y2 + 1}`;
    }
    return '';
  }, [existingSemesters]);

  function handleSubmit(e) {
    e.preventDefault();
    const val = name.trim() || suggestion;
    if (!val) return;
    onConfirm(val);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <FolderPlus size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Thêm học kỳ mới</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
            Tên học kỳ
          </label>
          <input
            ref={inputRef}
            autoFocus
            className="input-field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={suggestion || 'VD: HK1 2024-2025'}
            list="sem-suggestions"
          />
          <datalist id="sem-suggestions">
            {suggestion && <option value={suggestion} />}
            {existingSemesters.map(s => <option key={s} value={s} />)}
          </datalist>
          {suggestion && !name && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              💡 Gợi ý: <button
                type="button"
                onClick={() => setName(suggestion)}
                style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter, sans-serif', padding: 0 }}
              >
                {suggestion}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-primary">
              <Plus size={14} /> Tạo học kỳ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Retake Modal ─────────────────────────────────────────────────────────────

function RetakeModal({ subject, onClose, onConfirm }) {
  const [policy, setPolicy] = useState('highest');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Thêm môn học lại</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Môn <strong>{subject?.name || subject?.code}</strong> sẽ được thêm lần nữa.
          Chọn cách tính điểm vào GPA:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[
            { value: 'highest', label: '🏆 Điểm cao nhất', desc: 'GPA dùng điểm cao hơn giữa hai lần' },
            { value: 'latest', label: '🆕 Điểm mới nhất', desc: 'GPA dùng điểm lần học lại gần nhất' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPolicy(opt.value)}
              style={{
                padding: '12px 16px', borderRadius: 10,
                border: `1px solid ${policy === opt.value ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                background: policy === opt.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={() => onConfirm(policy)}>
            <Check size={14} /> Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Subject Row ────────────────────────────────────────────────────────────

const QUICK_DEFAULTS = { code: '', name: '', score: '', credits: '3', difficulty: '3', status: 'done' };

function InlineSubjectRow({ semester, initialData, onSave, onCancel, onAlert }) {
  const [form, setForm] = useState(initialData || { ...QUICK_DEFAULTS });
  const nameRef = useRef(null);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); trySubmit(); }
    if (e.key === 'Escape') onCancel();
  }

  function trySubmit() {
    if (!form.name.trim() && !form.code.trim()) {
      if (onAlert) onAlert('Vui lòng nhập Mã môn hoặc Tên môn học!');
      nameRef.current?.focus();
      return;
    }
    const score = form.score !== '' ? parseFloat(form.score) : '';
    if (form.score !== '' && (isNaN(score) || score < 0 || score > 10)) {
      if (onAlert) onAlert('Điểm số không hợp lệ! Vui lòng nhập điểm từ 0 đến 10.');
      return;
    }
    const credits = parseInt(form.credits, 10);
    if (isNaN(credits) || credits <= 0) {
      if (onAlert) onAlert('Số tín chỉ không hợp lệ! Phải lớn hơn 0.');
      return;
    }
    onSave({
      ...initialData,
      code: form.code.trim(),
      name: form.name.trim(),
      semester,
      score: score,
      credits: parseInt(form.credits, 10) || 3,
      difficulty: parseInt(form.difficulty, 10) || 3,
      status: form.status,
    });
    if (!initialData) {
      setForm({ ...QUICK_DEFAULTS });
      setTimeout(() => nameRef.current?.focus(), 30);
    }
  }

  const iStyle = {
    background: 'transparent', border: 'none',
    borderBottom: `1px solid ${initialData ? 'rgba(59,130,246,0.35)' : 'rgba(139,92,246,0.35)'}`,
    color: 'var(--text-primary)', fontSize: 13,
    fontFamily: 'Inter, sans-serif', padding: '3px 4px',
    outline: 'none', width: '100%', borderRadius: 0,
  };

  return (
    <tr style={{ background: initialData ? 'rgba(59,130,246,0.07)' : 'rgba(139,92,246,0.07)' }}>
      <td>
        <input style={{ ...iStyle, width: 70, fontFamily: 'monospace', fontSize: 12 }}
          value={form.code} onChange={e => set('code', e.target.value)}
          onKeyDown={handleKeyDown} placeholder="CS101" autoFocus={!!initialData} />
      </td>
      <td>
        <input ref={nameRef} style={{ ...iStyle, minWidth: 150 }}
          value={form.name} onChange={e => set('name', e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Tên môn học *" autoFocus={!initialData} />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input style={{ ...iStyle, width: 56, textAlign: 'center' }}
          type="number" min="0" max="10" step="0.1"
          value={form.score} 
          onChange={e => set('score', e.target.value)}
          onKeyDown={handleKeyDown} placeholder="8.5" />
      </td>
      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</td>
      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</td>
      <td style={{ textAlign: 'center' }}>
        <input style={{ ...iStyle, width: 38, textAlign: 'center' }}
          type="number" min="1" max="10" step="1"
          value={form.credits} onChange={e => set('credits', e.target.value)}
          onKeyDown={handleKeyDown} />
      </td>
      <td style={{ textAlign: 'center' }}>
        <select style={{ ...iStyle, width: 36, cursor: 'pointer' }}
          value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
          onKeyDown={handleKeyDown}>
          {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <select style={{ ...iStyle, fontSize: 11, cursor: 'pointer' }}
          value={form.status} onChange={e => set('status', e.target.value)}
          onKeyDown={handleKeyDown}>
          <option value="done">Đã học</option>
          <option value="planned">Dự kiến</option>
        </select>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button className={initialData ? "btn-ghost" : "btn-primary"} style={{ padding: '4px 10px', color: initialData ? '#34d399' : 'white' }} onClick={trySubmit} title="Lưu (Enter)">
            <Check size={12} />
          </button>
          <button className="btn-ghost" style={{ padding: '4px 8px', color: initialData ? '#ef4444' : 'var(--text-secondary)' }} onClick={onCancel} title="Huỷ (Esc)">
            <X size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

function parseCSVLine(line, delimiter) {
  const result = [];
  let field = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (!inQuote && ch === delimiter) { result.push(field.trim()); field = ''; continue; }
    field += ch;
  }
  result.push(field.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { subjects: [], errors: [] };
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  const firstFields = parseCSVLine(lines[0], delimiter);
  const isHeader = isNaN(parseFloat(firstFields[3])) || firstFields[3] === '';
  const dataLines = isHeader ? lines.slice(1) : lines;
  const subjects = [], errors = [];

  dataLines.forEach((line, idx) => {
    if (!line.trim()) return;
    const fields = parseCSVLine(line, delimiter);
    const [code='', name='', semester='', scoreRaw='', creditsRaw='', diffRaw='', statusRaw=''] = fields;
    const rowNum = isHeader ? idx + 2 : idx + 1;
    if (!name.trim() && !code.trim()) { errors.push(`Dòng ${rowNum}: thiếu Mã môn hoặc Tên môn`); return; }
    if (!semester.trim()) { errors.push(`Dòng ${rowNum}: thiếu Học kỳ`); return; }
    const score = scoreRaw.trim() !== '' ? parseFloat(scoreRaw.replace(',', '.')) : '';
    const credits = parseInt(creditsRaw) || 3;
    const difficulty = parseInt(diffRaw) || 3;
    const status = statusRaw.trim().toLowerCase().includes('dự') ? 'planned' : 'done';
    if (typeof score === 'number' && (isNaN(score) || score < 0 || score > 10)) {
      errors.push(`Dòng ${rowNum}: điểm "${scoreRaw}" không hợp lệ`); return;
    }
    subjects.push({ code: code.trim(), name: name.trim(), semester: semester.trim(), score, credits, difficulty, status });
  });
  return { subjects, errors };
}

function parseFAP(text) {
  const lines = text.trim().split(/\r?\n/);
  const subjects = [];
  const errors = [];
  
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    
    const parts = line.split('\t').map(p => p.trim());
    
    // Bóc tách chính xác dựa trên cấu trúc cột của FAP Transcript
    const codeIdx = parts.findIndex(p => /^[A-Z]{2,4}\d{3}[a-zA-Z]?$/.test(p));
    if (codeIdx === -1) return; 
    
    const code = parts[codeIdx];
    let semester = "Chưa phân bổ";
    if (codeIdx >= 1 && parts[codeIdx - 1]) {
      semester = parts[codeIdx - 1];
    } else {
      const semMatch = line.match(/\b(?:Fall|Spring|Summer)\s*\d{2,4}\b/i) || line.match(/\bHK\d\b/i);
      if (semMatch) semester = semMatch[0];
    }
    
    let name = `Môn ${code}`;
    let credits = 3;
    let score = '';
    let status = 'planned';
    
    // Tìm cột Status (chắc chắn luôn nằm ở cuối cùng hoặc sát cuối)
    let statusIdx = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
      const low = parts[i].toLowerCase();
      if (low === 'passed' || low === 'not passed' || low === 'studying' || low === 'not started' || low === 'exempted') {
        statusIdx = i;
        break;
      }
    }
    
    if (statusIdx !== -1 && statusIdx >= 3) {
      const statusStr = parts[statusIdx].toLowerCase();
      if (statusStr === 'passed' || statusStr === 'exempted' || statusStr === 'not passed') status = 'done';
      else status = 'planned';
      
      // Name luôn nằm trước Status 3 cột
      if (statusIdx - 3 >= 0 && parts[statusIdx - 3]) {
        name = parts[statusIdx - 3];
      }
      
      // Credit luôn nằm trước Status 2 cột
      if (statusIdx - 2 >= 0 && parts[statusIdx - 2]) {
        const parsedCredits = parseInt(parts[statusIdx - 2], 10);
        if (!isNaN(parsedCredits)) credits = parsedCredits;
      }
      
      // Grade luôn nằm trước Status 1 cột
      if (statusIdx - 1 >= 0 && parts[statusIdx - 1]) {
        const gradeStr = parts[statusIdx - 1].replace(',', '.');
        const val = parseFloat(gradeStr);
        if (!isNaN(val)) score = val;
      }
    } else {
      // Fallback
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('passed') || lowerLine.includes('exempted')) status = 'done';
      else if (lowerLine.includes('studying') || lowerLine.includes('not started')) status = 'planned';
      else if (lowerLine.includes('not passed')) status = 'done';
      
      const numMatches = line.match(/\b\d+([.,]\d+)?\b/g);
      if (numMatches) {
        const nums = numMatches.map(n => parseFloat(n.replace(',', '.'))).filter(n => n >= 0 && n <= 10);
        if (nums.length > 0) score = nums[nums.length - 1]; 
      }
      if (status === 'done' && score === '') score = 0;
      if (status !== 'done') score = '';
    }
    
    // Bộ lọc theo yêu cầu: Bỏ qua môn có tín chỉ <= 0 hoặc (đã học nhưng điểm <= 0)
    if (credits <= 0) return;
    if (status === 'done' && (score === '' || score <= 0)) return;
    
    subjects.push({ code, name, semester, score, credits, difficulty: 3, status });
  });
  
  if (subjects.length === 0 && lines.length > 0) {
    errors.push("Không tìm thấy môn học nào hợp lệ. Đảm bảo bạn đã copy đầy đủ bảng điểm FAP.");
  }
  
  return { subjects, errors };
}

function parseIUH(text) {
  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const subjects = [];
  const errors = [];
  
  let currentSemester = "Chưa phân bổ";
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line is a semester header like "HK1 (2023 - 2024)"
    const semMatch = line.match(/^HK\d+\s*\(\d{4}\s*-\s*\d{4}\)/i) || line.match(/^Học kỳ/i);
    if (semMatch) {
      currentSemester = line;
      continue;
    }
    
    // Case 1: Tab-separated on a single line
    let parts = line.split('\t').map(p => p.trim());
    if (parts.length > 5 && /^\d+$/.test(parts[0]) && parts[2] && parts[3]) {
      const code = parts[1];
      const name = parts[2];
      const credits = parseInt(parts[3], 10);
      
      let score = '';
      let status = 'planned';
      
      const letterGradeIdx = parts.findLastIndex(p => /^[A-F][+-]?$/.test(p));
      if (letterGradeIdx !== -1) {
        status = 'done';
        if (letterGradeIdx - 2 > 3) {
          const val = parseFloat(parts[letterGradeIdx - 2].replace(',', '.'));
          if (!isNaN(val)) score = val;
        }
      }
      
      if (!isNaN(credits) && credits > 0) {
        subjects.push({ code, name, semester: currentSemester, score, credits, difficulty: 3, status });
      }
      continue;
    }
    
    // Case 2: Multi-line record (IUH copy style)
    if (/^\d+$/.test(line) && i + 3 < lines.length) {
      const code = lines[i+1];
      const name = lines[i+2];
      const gradesLine = lines[i+3];
      
      if (gradesLine.includes('\t') || /^\d+\s+/.test(gradesLine)) {
        parts = gradesLine.split('\t').map(p => p.trim());
        const credits = parseInt(parts[0], 10);
        
        let score = '';
        let status = 'planned';
        
        const letterGradeIdx = parts.findLastIndex(p => /^[A-F][+-]?$/.test(p));
        if (letterGradeIdx !== -1) {
          status = 'done';
          if (letterGradeIdx - 2 >= 0) {
             const val = parseFloat(parts[letterGradeIdx - 2].replace(',', '.'));
             if (!isNaN(val)) score = val;
          }
        }
        
        if (!isNaN(credits) && credits > 0) {
           subjects.push({ code, name, semester: currentSemester, score, credits, difficulty: 3, status });
        }
        i += 3;
      }
    }
  }
  
  if (subjects.length === 0 && lines.length > 0) {
    errors.push("Không tìm thấy môn học nào hợp lệ. Đảm bảo bạn đã copy đầy đủ bảng điểm IUH.");
  }
  
  return { subjects, errors };
}

function ImportCSVModal({ onClose, onImport }) {
  const [mode, setMode] = useState('fap'); // 'fap', 'iuh', or 'csv'
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileRef = useRef(null);

  const CSV_TEMPLATE = `Mã môn;Tên môn;Học kỳ;Điểm;Tín chỉ;Độ khó;Trạng thái
CS101;Giải tích 1;HK1 2024-2025;8.5;4;3;Đã học
CS102;Đại số tuyến tính;HK1 2024-2025;7.0;3;4;Đã học
CS201;Lập trình Python;HK2 2024-2025;;3;2;Dự kiến`;

  function handleParse(raw, currentMode = mode) {
    if (currentMode === 'csv') {
      const { subjects, errors } = parseCSV(raw);
      setPreview(subjects); setErrors(errors);
    } else if (currentMode === 'iuh') {
      const { subjects, errors } = parseIUH(raw);
      setPreview(subjects); setErrors(errors);
    } else {
      const { subjects, errors } = parseFAP(raw);
      setPreview(subjects); setErrors(errors);
    }
  }

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (text) handleParse(text, newMode);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={18} color="var(--accent-green)" />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Import từ CSV / Excel</h2>
          </div>
          <button className="btn-ghost" style={{ padding: '6px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className={mode === 'fap' ? "btn-primary" : "btn-ghost"} onClick={() => handleModeChange('fap')} style={{ flex: 1, padding: '8px' }}>
            <span>🧡 Điểm FPT/FAP</span>
          </button>
          <button className={mode === 'iuh' ? "btn-primary" : "btn-ghost"} onClick={() => handleModeChange('iuh')} style={{ flex: 1, padding: '8px' }}>
            <span>❤️ Điểm IUH</span>
          </button>
          <button className={mode === 'csv' ? "btn-primary" : "btn-ghost"} onClick={() => handleModeChange('csv')} style={{ flex: 1, padding: '8px' }}>
            <span>📊 Form Excel</span>
          </button>
        </div>

        {mode === 'csv' ? (
          <div className="alert-info" style={{ marginBottom: 16, fontSize: 12 }}>
            <Info size={14} />
            <div>
              <strong>Format cột:</strong> Mã môn · Tên môn · Học kỳ · Điểm (0–10) · Tín chỉ · Độ khó (1–5) · Trạng thái<br/>
              Phân cách bằng <code>;</code> hoặc <code>,</code> hoặc <code>Tab</code> (tự nhận dạng).
            </div>
          </div>
        ) : mode === 'fap' ? (
          <div className="alert-info" style={{ marginBottom: 16, fontSize: 12, background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <Info size={14} />
            <div>
              <strong>Sinh viên FPT:</strong> Đăng nhập FAP 👉 Vào bảng điểm (Transcript) 👉 Nhấn Ctrl+A để bôi đen toàn trang 👉 Ctrl+C 👉 Dán (Ctrl+V) thẳng vào ô bên dưới.
            </div>
          </div>
        ) : (
          <div className="alert-info" style={{ marginBottom: 16, fontSize: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Info size={14} />
            <div>
              <strong>Sinh viên IUH:</strong> Đăng nhập cổng sinh viên 👉 Xem điểm 👉 Copy toàn bộ bảng điểm 👉 Dán (Ctrl+V) vào ô bên dưới.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {mode === 'csv' && (
            <>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => fileRef.current?.click()}>
                📁 Upload file .csv
              </button>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setText(CSV_TEMPLATE); handleParse(CSV_TEMPLATE); }}>
                📋 Template mẫu
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={e => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { const raw = ev.target.result; setText(raw); handleParse(raw); };
            reader.readAsText(file, 'utf-8'); e.target.value = '';
          }} style={{ display: 'none' }} />
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); handleParse(e.target.value); }}
          placeholder={
            mode === 'csv' ? `Dán dữ liệu từ Excel vào đây...\nCS101;Giải tích 1;HK1 2024-2025;8.5;4;3;Đã học` 
            : mode === 'fap' ? `Ctrl+V để dán dữ liệu copy từ trang web FAP vào đây...` 
            : `Ctrl+V để dán dữ liệu copy từ trang web IUH vào đây...`
          }
          style={{
            width: '100%', minHeight: 130, background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px',
            color: 'var(--text-primary)', fontSize: 12, fontFamily: 'monospace',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }}
        />

        {errors.length > 0 && (
          <div className="alert-warning" style={{ marginTop: 10, flexDirection: 'column', gap: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠️ {errors.length} lỗi:</div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 12 }}>{e}</div>)}
          </div>
        )}

        {preview && preview.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 8 }}>
              ✅ Nhận dạng được {preview.length} môn học:
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 180, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead><tr><th>Mã</th><th>Tên môn</th><th>Học kỳ</th><th>Điểm</th><th>TC</th><th>Khó</th><th>TT</th></tr></thead>
                <tbody>
                  {preview.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace' }}>{s.code || '—'}</td>
                      <td>{s.name}</td><td>{s.semester}</td>
                      <td style={{ textAlign: 'center' }}>{s.score !== '' ? s.score : '—'}</td>
                      <td style={{ textAlign: 'center' }}>{s.credits}</td>
                      <td style={{ textAlign: 'center' }}>{s.difficulty}</td>
                      <td><span style={{ fontSize: 10, fontWeight: 600, color: s.status === 'done' ? '#34d399' : '#60a5fa' }}>{s.status === 'done' ? 'Đã học' : 'Dự kiến'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={() => { if (preview?.length) { onImport(preview); onClose(); } }}
            disabled={!preview?.length} style={{ opacity: preview?.length ? 1 : 0.5 }}>
            <Plus size={14} /> Thêm {preview?.length || 0} môn
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Subjects() {
  const { state, deleteSubject, duplicateSubject, addSubject, updateSubject, updateSettings, clearSubjects } = useApp();
  const { subjects, settings } = state;

  const [editingSubject, setEditingSubject] = useState(null);   // chỉ dùng cho sửa (fallback)
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [retakeTarget, setRetakeTarget] = useState(null);
  const [collapsedSemesters, setCollapsedSemesters] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [quickAddSem, setQuickAddSem] = useState(null);
  const [addSemModalOpen, setAddSemModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [pendingSem, setPendingSem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      const key = s.semester || 'Chưa phân bổ';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    
    function parseSemesterSortKey(sem) {
      if (!sem) return 999999;
      // FPT: Spring (1), Summer (2), Fall (3)
      const yearMatch = sem.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
      
      const semLower = sem.toLowerCase();
      let season = 0;
      if (semLower.includes('spring')) season = 1;
      else if (semLower.includes('summer')) season = 2;
      else if (semLower.includes('fall')) season = 3;
      
      if (year > 0 && season > 0) {
        return year * 10 + season; // e.g. Fall2023 -> 20233
      }
      
      // Generic HK
      const hkMatch = sem.match(/HK(\d+)/i);
      if (hkMatch) {
        // Just return a very small base + hk number so HKs always stay at the top or are sorted relative to each other
        return parseInt(hkMatch[1], 10);
      }
      
      return 999999;
    }

    return Object.entries(map).sort(([a], [b]) => {
      const keyA = parseSemesterSortKey(a);
      const keyB = parseSemesterSortKey(b);
      if (keyA !== keyB) return keyA - keyB;
      return a.localeCompare(b);
    });
  }, [subjects]);

  const existingSemesters = useMemo(() => grouped.map(([s]) => s), [grouped]);

  function toggleSemester(sem) {
    setCollapsedSemesters(prev => ({ ...prev, [sem]: !prev[sem] }));
  }

  function handleDelete(id) {
    if (deleteConfirmId === id) { deleteSubject(id); setDeleteConfirmId(null); }
    else setDeleteConfirmId(id);
  }

  function handleRetakeConfirm(policy) {
    duplicateSubject(retakeTarget.id, policy);
    setRetakeTarget(null);
  }

  function handleAddSemester(semName) {
    setAddSemModalOpen(false);
    // Nếu học kỳ chưa tồn tại, mở quick-add ngay
    setCollapsedSemesters(prev => ({ ...prev, [semName]: false }));
    setQuickAddSem(semName);
    // Nếu học kỳ chưa có môn nào → tạo một môn placeholder để group xuất hiện
    // Không cần — quick-add sẽ tạo môn đầu tiên, group tự xuất hiện sau đó
    // Ta cần một cách để group hiện ngay: dùng state riêng
    setPendingSem(semName);
  }

  // "Pending semester" — học kỳ mới chưa có môn nào, chỉ hiện quick-add

  const handleQuickSave = useCallback((semester, data) => {
    addSubject({ ...data, semester });
    // Nếu vừa tạo môn đầu tiên cho pending semester → clear pending
    if (semester === pendingSem) setPendingSem(null);
  }, [addSubject, pendingSem]);

  const handleCSVImport = useCallback((list) => {
    list.forEach(s => addSubject(s));
  }, [addSubject]);

  const loadFPTCurriculum = useCallback(() => {
    if (subjects.length > 0) {
      if (!window.confirm("Thao tác này sẽ thêm hơn 40 môn học vào danh sách hiện tại. Bạn có chắc chắn muốn tiếp tục?")) {
        return;
      }
    }
    updateSettings({ totalCredits: 133 });
    FPT_CURRICULUM.forEach(sub => {
      addSubject({
        code: sub.code,
        name: sub.name,
        semester: sub.semester,
        score: '',
        credits: sub.credits,
        difficulty: 3,
        status: 'planned',
      });
    });
  }, [addSubject, updateSettings, subjects.length]);

  function loadNormalCurriculum() {
    if (subjects.length > 0) {
      if (!window.confirm("Thao tác này sẽ thêm các môn học vào danh sách hiện tại. Bạn có chắc chắn muốn tiếp tục?")) {
        return;
      }
    }
    updateSettings({ totalCredits: 120 });
    NORMAL_CURRICULUM.forEach(sub => {
      addSubject({
        code: sub.code,
        name: sub.name,
        semester: sub.semester,
        score: '',
        credits: sub.credits,
        difficulty: 3,
        status: 'planned',
      });
    });
  }

  const codeGroups = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      const code = s.code?.trim().toLowerCase();
      if (code) { if (!map[code]) map[code] = []; map[code].push(s.id); }
    }
    return map;
  }, [subjects]);

  function isRetake(s) {
    const code = s.code?.trim().toLowerCase();
    return code && codeGroups[code]?.length > 1;
  }

  // Combine existing groups + pending semester (if any)
  const allGroups = useMemo(() => {
    if (!pendingSem || existingSemesters.includes(pendingSem)) return grouped;
    const newEntry = [pendingSem, []];
    return [...grouped, newEntry].sort(([a], [b]) => a.localeCompare(b));
  }, [grouped, pendingSem, existingSemesters]);

  const hasAnyContent = subjects.length > 0 || pendingSem;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            <span className="gradient-text">Môn học</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {subjects.length} môn · {subjects.filter(s => s.status === 'done').length} đã học · {subjects.filter(s => s.status === 'planned').length} dự kiến
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {subjects.length > 0 && (
            <button className="btn-ghost" onClick={() => {
              if(window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu môn học không? Thao tác này không thể hoàn tác.')) {
                clearSubjects();
              }
            }} style={{ color: 'var(--accent-red)' }} title="Xóa toàn bộ môn học">
              <Trash2 size={15} /> <span>Xóa tất cả</span>
            </button>
          )}
          <button className="btn-ghost" onClick={() => setCsvModalOpen(true)}>
            <FileSpreadsheet size={15} /> <span>Import CSV</span>
          </button>
          {subjects.length === 0 && (
            <>
              <button className="btn-ghost" onClick={() => setCsvModalOpen(true)} style={{ color: 'var(--accent-purple)' }}>
                <span>Bóc tách FPT/IUH</span>
              </button>
              <button className="btn-ghost" onClick={loadNormalCurriculum} style={{ color: 'var(--accent-green)' }}>
                <span>Khung 8 học kỳ</span>
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => setAddSemModalOpen(true)}>
            <FolderPlus size={16} /> <span>Thêm học kỳ</span>
          </button>
        </div>
      </div>

      {!hasAnyContent ? (
        <div className="empty-state glass-card" style={{ padding: 60 }}>
          <BookOpen size={56} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, marginTop: 16 }}>
            Chưa có dữ liệu nào
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Tạo học kỳ đầu tiên để bắt đầu nhập môn học, hoặc tải khung chương trình mẫu.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setCsvModalOpen(true)} style={{ background: 'var(--accent-purple)' }}>
              <span>Bóc tách tự động (FPT/IUH)</span>
            </button>
            <button className="btn-primary" onClick={loadNormalCurriculum} style={{ background: 'var(--accent-green)' }}>
              <span>Load khung 8 Học kỳ (120 TC)</span>
            </button>
            <button className="btn-primary" onClick={() => setAddSemModalOpen(true)}>
              <span>Tạo học kỳ đầu tiên</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allGroups.map(([semester, subs]) => {
            const collapsed = collapsedSemesters[semester];
            const semCredits = subs.filter(s => s.status === 'done').reduce((sum, s) => sum + (parseInt(s.credits) || 0), 0);
            const semGpa4 = calculateGPA4(subs, settings.conversionTable).gpa;
            const semGpa10 = calculateGPA10(subs, settings.conversionTable).gpa;
            const showingQuickAdd = quickAddSem === semester;
            const isEmpty = subs.length === 0;

            return (
              <div key={semester} className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Semester header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderBottom: (collapsed || (isEmpty && !showingQuickAdd)) ? 'none' : '1px solid var(--border-color)',
                }}>
                  <button
                    onClick={() => !isEmpty && toggleSemester(semester)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'transparent', border: 'none',
                      cursor: isEmpty ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <div className="semester-header">{semester}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {isEmpty ? 'Mới tạo — chưa có môn' : (
                        <>
                          <strong style={{ color: 'var(--accent-purple)' }}>
                            GPA: {semGpa4 !== null ? semGpa4.toFixed(2) : '—'}
                            <span style={{ fontWeight: 'normal', opacity: 0.7, fontSize: 11, marginLeft: 4 }}>(Hệ 10: {semGpa10 !== null ? semGpa10.toFixed(2) : '—'})</span>
                          </strong>
                          <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                          {subs.length} môn · {semCredits} tín chỉ đã học
                        </>
                      )}
                    </span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!showingQuickAdd && (
                      <button
                        onClick={() => { setQuickAddSem(semester); setCollapsedSemesters(prev => ({ ...prev, [semester]: false })); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
                      >
                        <Plus size={13} /> Thêm nhanh
                      </button>
                    )}
                    {!isEmpty && (
                      collapsed
                        ? <ChevronDown size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => toggleSemester(semester)} />
                        : <ChevronUp size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => toggleSemester(semester)} />
                    )}
                  </div>
                </div>

                {/* Table */}
                {!collapsed && (subs.length > 0 || showingQuickAdd) && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã môn</th>
                          <th>Tên môn học</th>
                          <th style={{ textAlign: 'center' }}>Điểm</th>
                          <th style={{ textAlign: 'center' }}>Thang 4</th>
                          <th style={{ textAlign: 'center' }}>Xếp loại</th>
                          <th style={{ textAlign: 'center' }}>Tín chỉ</th>
                          <th style={{ textAlign: 'center' }}>Độ khó</th>
                          <th style={{ textAlign: 'center' }}>Trạng thái</th>
                          <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.map(s => {
                          if (inlineEditingId === s.id) {
                            return (
                              <InlineSubjectRow
                                key={s.id}
                                semester={semester}
                                initialData={s}
                                onSave={(data) => {
                                  updateSubject(s.id, data);
                                  setInlineEditingId(null);
                                }}
                                onCancel={() => setInlineEditingId(null)}
                                onAlert={showToast}
                              />
                            );
                          }

                          const score = getEffectiveScore(s);
                          const scale4 = score !== null ? convertToScale4(score, settings.conversionTable) : null;
                          const letter = score !== null ? getLetterGrade(score, settings.conversionTable) : '-';
                          const isConfirmDelete = deleteConfirmId === s.id;

                          return (
                            <tr key={s.id} onDoubleClick={() => setInlineEditingId(s.id)}>
                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {s.code || '—'}
                                </span>
                                {isRetake(s) && (
                                  <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    HỌC LẠI
                                  </span>
                                )}
                              </td>
                              <td><span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{s.name || '—'}</span></td>
                              <td style={{ textAlign: 'center' }}>
                                {score !== null ? (
                                  <span style={{ fontSize: 14, fontWeight: 700, color: score >= 8 ? 'var(--accent-green)' : score >= 6.5 ? 'var(--accent-blue)' : score >= 5 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                                    {score}
                                  </span>
                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                                {scale4 !== null ? scale4.toFixed(1) : '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {letter !== '-' ? (
                                  <span className={`badge ${letter === 'A' ? 'badge-excellent' : letter.startsWith('B') ? 'badge-good' : letter.startsWith('C') ? 'badge-average' : letter.startsWith('D') ? 'badge-medium' : 'badge-fail'}`} style={{ fontSize: 11 }}>
                                    {letter}
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.credits}</td>
                              <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent-amber)' }}>{DIFFICULTY_STARS[s.difficulty] || '★★★'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: s.status === 'done' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: s.status === 'done' ? '#34d399' : '#60a5fa' }}>
                                  {STATUS_LABELS[s.status] || s.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                  <button className="btn-ghost" onClick={() => setInlineEditingId(s.id)} style={{ padding: '5px 8px' }} title="Sửa nhanh"><Pencil size={13} /></button>
                                  <button className="btn-ghost" onClick={() => setRetakeTarget(s)} style={{ padding: '5px 8px' }} title="Học lại"><RefreshCw size={13} /></button>
                                  {isConfirmDelete ? (
                                    <button className="btn-danger" onClick={() => handleDelete(s.id)} style={{ padding: '5px 10px', fontSize: 12 }}>
                                      <AlertTriangle size={12} /> Xác nhận
                                    </button>
                                  ) : (
                                    <button className="btn-danger" onClick={() => handleDelete(s.id)} style={{ padding: '5px 8px' }} title="Xóa"><Trash2 size={13} /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {showingQuickAdd && (
                          <InlineSubjectRow
                            semester={semester}
                            onSave={(data) => handleQuickSave(semester, data)}
                            onCancel={() => { setQuickAddSem(null); if (semester === pendingSem && subs.length === 0) setPendingSem(null); }}
                            onAlert={showToast}
                          />
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal (chỉ dùng khi sửa) */}
      {editingSubject && (
        <AddSubjectModal
          isOpen={true}
          onClose={() => setEditingSubject(null)}
          editingSubject={editingSubject}
        />
      )}

      {retakeTarget && (
        <RetakeModal subject={retakeTarget} onClose={() => setRetakeTarget(null)} onConfirm={handleRetakeConfirm} />
      )}

      {addSemModalOpen && (
        <AddSemesterModal
          existingSemesters={existingSemesters}
          onConfirm={handleAddSemester}
          onClose={() => setAddSemModalOpen(false)}
        />
      )}

      {csvModalOpen && (
        <ImportCSVModal onClose={() => setCsvModalOpen(false)} onImport={handleCSVImport} />
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 9999,
          background: 'var(--bg-card)', color: 'var(--accent-red)',
          padding: '14px 20px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 12,
          fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif',
          animation: 'slideUp 0.3s ease-out', border: '1px solid rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <AlertTriangle size={18} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
