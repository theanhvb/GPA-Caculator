import { useState, useRef } from 'react';
import {
  Settings, Download, Upload, RotateCcw, AlertTriangle, Check,
  Info, Sliders, GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CONVERSION_TABLE, DEFAULT_THRESHOLDS } from '../utils/gpaCalculations';

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa',
        }}>
          <Icon size={16} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { state, updateSettings, exportData, importData, resetAll } = useApp();
  const { settings } = state;
  const fileRef = useRef(null);

  const [totalCredits, setTotalCredits] = useState(settings.totalCredits);
  const [conversionTable, setConversionTable] = useState(settings.conversionTable);
  const [thresholds, setThresholds] = useState(settings.thresholds);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importError, setImportError] = useState('');

  function handleSave() {
    updateSettings({ totalCredits: parseInt(totalCredits, 10), conversionTable, thresholds });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleResetSettings() {
    setConversionTable(DEFAULT_CONVERSION_TABLE);
    setThresholds(DEFAULT_THRESHOLDS);
    setTotalCredits(120);
    updateSettings({
      totalCredits: 120,
      conversionTable: DEFAULT_CONVERSION_TABLE,
      thresholds: DEFAULT_THRESHOLDS,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.subjects) throw new Error('File không hợp lệ: thiếu trường subjects');
        importData(parsed);
        setImportError('');
        // Update local state
        if (parsed.settings) {
          setTotalCredits(parsed.settings.totalCredits || 120);
          setConversionTable(parsed.settings.conversionTable || DEFAULT_CONVERSION_TABLE);
          setThresholds(parsed.settings.thresholds || DEFAULT_THRESHOLDS);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateConversionRow(idx, field, value) {
    setConversionTable(prev => prev.map((row, i) =>
      i === idx ? { ...row, [field]: field.includes('scale') || field.includes('min') || field.includes('max') ? parseFloat(value) : value } : row
    ));
  }

  function updateThresholdRow(idx, field, value) {
    setThresholds(prev => prev.map((row, i) =>
      i === idx ? { ...row, [field]: field === 'label' || field === 'color' ? value : parseFloat(value) } : row
    ));
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          <span className="gradient-text">Cài đặt</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Tuỳ chỉnh bảng quy đổi, ngưỡng xếp loại và thông tin khóa học
        </p>
      </div>

      {/* Credits */}
      <SectionCard title="Thông tin khóa học" icon={GraduationCap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Tổng số tín chỉ toàn khóa</label>
            <input
              className="input-field"
              type="number"
              min="1"
              value={totalCredits}
              onChange={e => setTotalCredits(e.target.value)}
              placeholder="120"
              style={{ maxWidth: 200 }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Dùng để tính điểm cần đạt cho các kỳ còn lại.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Conversion table */}
      <SectionCard title="Bảng quy đổi thang điểm" icon={Sliders}>
        <div className="alert-info" style={{ marginBottom: 16, fontSize: 12 }}>
          <Info size={14} />
          Mỗi trường có bảng quy đổi khác nhau. Chỉnh sửa để phù hợp với trường của bạn.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Điểm min (≥)</th>
                <th>Điểm max (≤)</th>
                <th>Thang 4</th>
                <th>Xếp loại chữ</th>
              </tr>
            </thead>
            <tbody>
              {conversionTable.map((row, idx) => (
                <tr key={idx}>
                  <td className="editable-cell">
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={row.min}
                      onChange={e => updateConversionRow(idx, 'min', e.target.value)}
                    />
                  </td>
                  <td className="editable-cell">
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={row.max}
                      onChange={e => updateConversionRow(idx, 'max', e.target.value)}
                    />
                  </td>
                  <td className="editable-cell">
                    <input
                      type="number" step="0.5" min="0" max="4"
                      value={row.scale4}
                      onChange={e => updateConversionRow(idx, 'scale4', e.target.value)}
                    />
                  </td>
                  <td className="editable-cell">
                    <input
                      type="text"
                      value={row.letter}
                      onChange={e => updateConversionRow(idx, 'letter', e.target.value)}
                      style={{ width: 60 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Thresholds */}
      <SectionCard title="Ngưỡng xếp loại bằng (Thang 4)" icon={Settings}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Xếp loại</th>
                <th>GPA tối thiểu (≥)</th>
                <th>GPA tối đa (≤)</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</td>
                  <td className="editable-cell">
                    <input
                      type="number" step="0.01" min="0" max="4"
                      value={row.min}
                      onChange={e => updateThresholdRow(idx, 'min', e.target.value)}
                    />
                  </td>
                  <td className="editable-cell">
                    <input
                      type="number" step="0.01" min="0" max="4"
                      value={row.max}
                      onChange={e => updateThresholdRow(idx, 'max', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Save + Reset settings */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
          {saved ? <><Check size={14} /> Đã lưu!</> : 'Lưu cài đặt'}
        </button>
        <button className="btn-ghost" onClick={handleResetSettings}>
          <RotateCcw size={14} /> Đặt lại mặc định
        </button>
      </div>

      {/* Export / Import */}
      <SectionCard title="Xuất / Nhập dữ liệu" icon={Download}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={exportData} style={{ flex: 1, minWidth: 160 }}>
            <Download size={14} /> Xuất JSON
          </button>
          <button
            className="btn-ghost"
            onClick={() => fileRef.current?.click()}
            style={{ flex: 1, minWidth: 160 }}
          >
            <Upload size={14} /> Nhập JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
        {importError && (
          <div className="alert-error" style={{ marginTop: 12 }}>
            <AlertTriangle size={14} />{importError}
          </div>
        )}
        {saved && (
          <div className="alert-success" style={{ marginTop: 12 }}>
            <Check size={14} />Nhập dữ liệu thành công!
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Xuất file JSON để sao lưu hoặc chuyển sang thiết bị khác. Nhập file để khôi phục.
        </p>
      </SectionCard>

      {/* Danger zone */}
      <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={16} color="var(--accent-red)" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-red)' }}>Vùng nguy hiểm</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Xóa toàn bộ dữ liệu môn học và đặt lại cài đặt về mặc định. Hành động này không thể hoàn tác.
        </p>
        {resetConfirm ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-danger"
              onClick={() => { resetAll(); setResetConfirm(false); }}
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              <AlertTriangle size={14} /> Xác nhận xóa tất cả
            </button>
            <button className="btn-ghost" onClick={() => setResetConfirm(false)}>Huỷ</button>
          </div>
        ) : (
          <button
            className="btn-ghost"
            onClick={() => setResetConfirm(true)}
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-red)' }}
          >
            <RotateCcw size={14} /> Xóa tất cả dữ liệu
          </button>
        )}
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
      `}</style>
    </div>
  );
}
