import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DIFFICULTY_LABELS = {
  1: 'Rất dễ',
  2: 'Dễ',
  3: 'Trung bình',
  4: 'Khó',
  5: 'Rất khó',
};

const defaultForm = {
  code: '',
  name: '',
  semester: '',
  score: '',
  credits: '',
  difficulty: '3',
  status: 'done',
  retakeOf: '',
  retakePolicy: 'highest',
};

function validateForm(form) {
  const errors = {};
  if (!form.code.trim() && !form.name.trim()) {
    errors.code = 'Cần nhập mã môn hoặc tên môn';
  }
  if (!form.semester.trim()) errors.semester = 'Chọn học kỳ';
  if (form.status === 'done') {
    if (form.score === '' || form.score === null) {
      errors.score = 'Nhập điểm cho môn đã học';
    } else {
      const s = parseFloat(form.score);
      if (isNaN(s) || s < 0 || s > 10) errors.score = 'Điểm phải từ 0 đến 10';
    }
  }
  if (!form.credits || parseInt(form.credits) <= 0) {
    errors.credits = 'Số tín chỉ phải > 0';
  }
  return errors;
}

export default function AddSubjectModal({ isOpen, onClose, editingSubject }) {
  const { addSubject, updateSubject, state } = useApp();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  // Extract unique semesters for suggestions
  const semesters = [...new Set(state.subjects.map(s => s.semester).filter(Boolean))].sort();

  useEffect(() => {
    if (editingSubject) {
      setForm({
        code: editingSubject.code || '',
        name: editingSubject.name || '',
        semester: editingSubject.semester || '',
        score: editingSubject.score ?? '',
        credits: editingSubject.credits || '',
        difficulty: editingSubject.difficulty || '3',
        status: editingSubject.status || 'done',
        retakeOf: editingSubject.retakeOf || '',
        retakePolicy: editingSubject.retakePolicy || 'highest',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      ...form,
      score: form.score !== '' ? parseFloat(form.score) : '',
      credits: parseInt(form.credits, 10),
      difficulty: parseInt(form.difficulty, 10),
    };

    if (editingSubject) {
      updateSubject(editingSubject.id, data);
    } else {
      addSubject(data);
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
          </h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Code + Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
            <div>
              <label className="form-label">Mã môn</label>
              <input
                className={`input-field ${errors.code ? 'error' : ''}`}
                value={form.code}
                onChange={e => handleChange('code', e.target.value)}
                placeholder="VD: CS101"
              />
              {errors.code && <span className="form-error"><AlertCircle size={12} />{errors.code}</span>}
            </div>
            <div>
              <label className="form-label">Tên môn học *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="VD: Giải tích 1"
              />
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="form-label">Học kỳ *</label>
            <input
              className={`input-field ${errors.semester ? 'error' : ''}`}
              value={form.semester}
              onChange={e => handleChange('semester', e.target.value)}
              placeholder="VD: HK1 2024-2025"
              list="semester-list"
            />
            <datalist id="semester-list">
              {semesters.map(s => <option key={s} value={s} />)}
            </datalist>
            {errors.semester && <span className="form-error"><AlertCircle size={12} />{errors.semester}</span>}
          </div>

          {/* Status */}
          <div>
            <label className="form-label">Trạng thái *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'done', label: '✅ Đã học' },
                { value: 'planned', label: '📋 Dự kiến' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('status', opt.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: `1px solid ${form.status === opt.value ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                    background: form.status === opt.value ? 'rgba(139,92,246,0.15)' : 'transparent',
                    color: form.status === opt.value ? '#a78bfa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score + Credits + Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
            <div>
              <label className="form-label">
                Điểm (0–10) {form.status === 'done' && '*'}
              </label>
              <input
                className={`input-field ${errors.score ? 'error' : ''}`}
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.score}
                onChange={e => handleChange('score', e.target.value)}
                placeholder={form.status === 'planned' ? 'Để trống' : '0.0'}
                disabled={form.status === 'planned'}
              />
              {errors.score && <span className="form-error"><AlertCircle size={12} />{errors.score}</span>}
            </div>
            <div>
              <label className="form-label">Số tín chỉ *</label>
              <input
                className={`input-field ${errors.credits ? 'error' : ''}`}
                type="number"
                min="1"
                max="10"
                step="1"
                value={form.credits}
                onChange={e => handleChange('credits', e.target.value)}
                placeholder="3"
              />
              {errors.credits && <span className="form-error"><AlertCircle size={12} />{errors.credits}</span>}
            </div>
            <div>
              <label className="form-label">Độ khó</label>
              <select
                className="input-field"
                value={form.difficulty}
                onChange={e => handleChange('difficulty', e.target.value)}
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>{d} – {DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Retake info */}
          {editingSubject?.retakeOf && (
            <div className="alert-info" style={{ fontSize: 12 }}>
              <AlertCircle size={14} />
              Môn học lại. Chính sách điểm:{' '}
              <select
                value={form.retakePolicy}
                onChange={e => handleChange('retakePolicy', e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="highest">Điểm cao nhất</option>
                <option value="latest">Điểm mới nhất</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost">Huỷ</button>
            <button type="submit" className="btn-primary">
              {editingSubject ? 'Lưu thay đổi' : '+ Thêm môn'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .form-error {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--accent-red);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
