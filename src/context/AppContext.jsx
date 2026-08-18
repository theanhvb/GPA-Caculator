import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  DEFAULT_CONVERSION_TABLE,
  DEFAULT_THRESHOLDS,
} from '../utils/gpaCalculations';

// ─── Initial State ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gpa_calculator_v1';

const defaultState = {
  subjects: [],
  settings: {
    totalCredits: 120,
    conversionTable: DEFAULT_CONVERSION_TABLE,
    thresholds: DEFAULT_THRESHOLDS,
  },
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      subjects: parsed.subjects || [],
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {}),
        // Ensure arrays are not empty
        conversionTable: parsed.settings?.conversionTable?.length
          ? parsed.settings.conversionTable
          : DEFAULT_CONVERSION_TABLE,
        thresholds: parsed.settings?.thresholds?.length
          ? parsed.settings.thresholds
          : DEFAULT_THRESHOLDS,
      },
    };
  } catch {
    return defaultState;
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function generateId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_SUBJECT': {
      const newSubject = { id: generateId(), createdAt: Date.now(), ...action.payload };
      return { ...state, subjects: [...state.subjects, newSubject] };
    }
    case 'UPDATE_SUBJECT': {
      return {
        ...state,
        subjects: state.subjects.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        ),
      };
    }
    case 'DELETE_SUBJECT': {
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.payload.id),
      };
    }
    case 'DUPLICATE_SUBJECT': {
      const original = state.subjects.find(s => s.id === action.payload.id);
      if (!original) return state;
      const duplicate = {
        ...original,
        id: generateId(),
        createdAt: Date.now(),
        name: `${original.name} (học lại)`,
        retakeOf: original.id,
        retakePolicy: action.payload.retakePolicy || 'highest',
        score: '',
        status: 'done',
      };
      return { ...state, subjects: [...state.subjects, duplicate] };
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }
    case 'IMPORT_DATA': {
      return { ...action.payload };
    }
    case 'RESET_ALL': {
      return defaultState;
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadFromStorage);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist to localStorage:', e);
    }
  }, [state]);

  // Action helpers
  const addSubject = useCallback((data) => dispatch({ type: 'ADD_SUBJECT', payload: data }), []);
  const updateSubject = useCallback((id, data) => dispatch({ type: 'UPDATE_SUBJECT', payload: { id, data } }), []);
  const deleteSubject = useCallback((id) => dispatch({ type: 'DELETE_SUBJECT', payload: { id } }), []);
  const duplicateSubject = useCallback((id, retakePolicy) =>
    dispatch({ type: 'DUPLICATE_SUBJECT', payload: { id, retakePolicy } }), []);
  const updateSettings = useCallback((data) => dispatch({ type: 'UPDATE_SETTINGS', payload: data }), []);
  const importData = useCallback((data) => dispatch({ type: 'IMPORT_DATA', payload: data }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);

  const exportData = useCallback(async () => {
    const json = JSON.stringify(state, null, 2);
    const fileName = `gpa_data_${new Date().toISOString().slice(0, 10)}.json`;

    // Dùng File System Access API để hiện hộp thoại "Lưu file" thực sự
    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'GPA Data (JSON)',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      } catch (err) {
        // Người dùng bấm Cancel → không làm gì
        if (err.name === 'AbortError') return;
        // Lỗi khác → fallback xuống dưới
      }
    }

    // Fallback cho Firefox / Safari hoặc trình duyệt không hỗ trợ API trên
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  return (
    <AppContext.Provider value={{
      state,
      addSubject,
      updateSubject,
      deleteSubject,
      duplicateSubject,
      updateSettings,
      exportData,
      importData,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
