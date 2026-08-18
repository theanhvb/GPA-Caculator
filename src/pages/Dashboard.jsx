import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Award, Target, Lightbulb, AlertTriangle,
  CheckCircle2, Info, ChevronDown, Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateGPA10, calculateGPA4, getClassification, getGPABySemester,
  calculateRequiredGPA, getImprovementSuggestions, getLetterGrade,
} from '../utils/gpaCalculations';

// ─── Sub-components ───────────────────────────────────────────────────────────

function GPACard({ title, value, subtitle, color, icon: Icon }) {
  return (
    <div className="glass-card" style={{ padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 120, height: 120,
        background: `radial-gradient(circle at 100% 0%, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${color}20`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="gpa-number" style={{ color }}>
        {value !== null ? value : '—'}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{subtitle}</div>
      )}
    </div>
  );
}

function ClassificationBadge({ classification }) {
  const colorMap = {
    excellent: '#a78bfa',
    good: '#34d399',
    average: '#60a5fa',
    medium: '#fbbf24',
    fail: '#f87171',
  };
  return (
    <span className={`badge badge-${classification.color}`} style={{ fontSize: 13, padding: '6px 16px' }}>
      {classification.label}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1a2e', border: '1px solid var(--border-color-hover)',
      borderRadius: 10, padding: '12px 16px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{p.value?.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Target Block ─────────────────────────────────────────────────────────────

function TargetBlock({ currentGPA10, currentGPA4, creditsDone, settings }) {
  const [targetLabel, setTargetLabel] = useState('Giỏi');

  const result = useMemo(() => {
    if (currentGPA4 === null || currentGPA10 === null) return null;
    return calculateRequiredGPA(
      currentGPA10, currentGPA4, creditsDone,
      settings.totalCredits, targetLabel, settings.thresholds, settings.conversionTable
    );
  }, [currentGPA10, currentGPA4, creditsDone, settings, targetLabel]);

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Target size={18} color="var(--accent-purple)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mục tiêu xếp loại</h3>
        </div>
        <div style={{ position: 'relative' }}>
          <select
            className="input-field"
            value={targetLabel}
            onChange={e => setTargetLabel(e.target.value)}
            style={{ paddingRight: 32, minWidth: 140, fontSize: 13, fontWeight: 600 }}
          >
            {settings.thresholds
              .filter(t => t.label !== 'Yếu / Không đạt')
              .map(t => (
                <option key={t.label} value={t.label}>{t.label} (≥{t.min})</option>
              ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      {currentGPA4 === null ? (
        <div className="alert-info"><Info size={16} />Nhập môn học để xem mục tiêu.</div>
      ) : !result ? null : result.status === 'achieved' ? (
        <div className="alert-success"><CheckCircle2 size={16} />{result.message}</div>
      ) : result.status === 'completed' ? (
        <div className="alert-info"><Info size={16} />{result.message}</div>
      ) : result.status === 'impossible' ? (
        <>
          <div className="alert-warning"><AlertTriangle size={16} />{result.message}</div>
          {result.suggestTarget && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              💡 Mục tiêu khả thi gần nhất: <strong style={{ color: '#a78bfa' }}>{result.suggestTarget}</strong>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              background: 'rgba(139,92,246,0.08)', borderRadius: 12,
              padding: '16px', border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Điểm TB cần đạt (Thang 10)
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>
                {result.requiredGPA10 !== null ? result.requiredGPA10?.toFixed(2) : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                /10.0 cho {result.creditsRemaining} tín chỉ còn lại
              </div>
            </div>
            <div style={{
              background: 'rgba(99,102,241,0.08)', borderRadius: 12,
              padding: '16px', border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                GPA thang 4 TB cần đạt/tín chỉ
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>
                {result.requiredGPA4?.toFixed(2)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                /4.0 cho {result.creditsRemaining} tín chỉ còn lại
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Tổng tín chỉ toàn khóa: <strong style={{ color: 'var(--text-secondary)' }}>{settings.totalCredits}</strong>
          {' · '}Đã tích lũy: <strong style={{ color: 'var(--accent-green)' }}>{creditsDone}</strong>
          {' · '}Còn lại: <strong style={{ color: 'var(--accent-amber)' }}>{Math.max(0, settings.totalCredits - creditsDone)}</strong>
        </div>
      </div>
    </div>
  );
}

// ─── Improvement Suggestions ──────────────────────────────────────────────────

function ImprovementBlock({ subjects, settings }) {
  const suggestions = useMemo(
    () => getImprovementSuggestions(subjects, settings.conversionTable).slice(0, 5),
    [subjects, settings.conversionTable]
  );

  if (suggestions.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Lightbulb size={18} color="var(--accent-amber)" />
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Gợi ý môn nên cải thiện (học lại)</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {suggestions.map((s, i) => (
          <div key={s.id} style={{
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10, flexShrink: 0,
              background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: i === 0 ? 'white' : 'var(--text-muted)',
            }}>
              {i === 0 ? <Zap size={14} /> : i + 1}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, truncate: true }}>
                {s.name || s.code}
                {s.code && s.name && <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{s.code}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Điểm hiện tại: <strong style={{ color: '#f87171' }}>{s.currentScore}</strong>
                {' · '}Tín chỉ: {s.credits}
                {' · '}Độ khó: {'⭐'.repeat(parseInt(s.difficulty))}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                Impact score
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>
                {s.impactScore.toFixed(2)}
              </div>
            </div>

            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: 90,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                Nếu đạt 8.0
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                +{s.deltaGPA10?.toFixed(2)} / +{s.deltaGPA4?.toFixed(3)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>(10) / (4)</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        * Impact score = (8 − điểm) × tín chỉ / độ khó. Càng cao càng nên ưu tiên.
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useApp();
  const { subjects, settings } = state;

  const { gpa: gpa10, totalCredits: creditsDone } = useMemo(
    () => calculateGPA10(subjects, settings.conversionTable),
    [subjects, settings.conversionTable]
  );
  const { gpa: gpa4 } = useMemo(
    () => calculateGPA4(subjects, settings.conversionTable),
    [subjects, settings.conversionTable]
  );
  const classification = useMemo(
    () => getClassification(gpa4, settings.thresholds),
    [gpa4, settings.thresholds]
  );
  const chartData = useMemo(
    () => getGPABySemester(subjects, settings.conversionTable),
    [subjects, settings.conversionTable]
  );

  const letterGrade = gpa10 !== null ? getLetterGrade(gpa10, settings.conversionTable) : null;

  const hasData = subjects.filter(s => s.status === 'done').length > 0;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          Tổng quan <span className="gradient-text">GPA</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {hasData
            ? `${subjects.filter(s => s.status === 'done').length} môn đã học · ${creditsDone} tín chỉ tích lũy`
            : 'Chưa có dữ liệu — hãy thêm môn học để bắt đầu'}
        </p>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <Award size={64} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Chưa có dữ liệu môn học
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
            Vào trang <strong style={{ color: 'var(--accent-purple)' }}>Môn học</strong> để thêm môn học và bắt đầu theo dõi GPA của bạn.
          </p>
        </div>
      ) : (
        <>
          {/* GPA Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <GPACard
              title="GPA Thang 10"
              value={gpa10}
              subtitle={`Xếp loại chữ: ${letterGrade || '—'}`}
              color="var(--accent-purple)"
              icon={TrendingUp}
            />
            <GPACard
              title="GPA Thang 4"
              value={gpa4?.toFixed(2)}
              subtitle={`Tín chỉ tích lũy: ${creditsDone}`}
              color="var(--accent-indigo)"
              icon={Award}
            />
            <div className="glass-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Xếp loại bằng
              </div>
              <div>
                <ClassificationBadge classification={classification} />
                <div style={{ marginTop: 10 }}>
                  {settings.thresholds.map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: classification.label === t.label ? 'var(--accent-purple)' : 'var(--border-color)',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 11, color: classification.label === t.label ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {t.label}: ≥{t.min}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GPA Chart */}
          {chartData.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <TrendingUp size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Biểu đồ GPA theo học kỳ</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="semester"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 10]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 4]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cumulativeGPA10"
                    name="GPA tích lũy (10)"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="semesterGPA10"
                    name="GPA kỳ (10)"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={{ fill: '#6366f1', r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativeGPA4"
                    name="GPA tích lũy (4)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Target + Suggestions */}
          <TargetBlock
            currentGPA10={gpa10}
            currentGPA4={gpa4}
            creditsDone={creditsDone}
            settings={settings}
          />

          <div style={{ marginTop: 20 }}>
            <ImprovementBlock subjects={subjects} settings={settings} />
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .gpa-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
