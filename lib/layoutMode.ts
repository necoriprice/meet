export type LayoutMode = 'grid' | 'right' | 'left' | 'top';

export const LAYOUT_MODE_LABELS: Record<LayoutMode, string> = {
  grid: '全画面',
  right: '右',
  left: '左',
  top: '上',
};

const STORAGE_KEY = 'riprice-meet-layout-mode';

export function loadLayoutMode(): LayoutMode {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'grid' || value === 'right' || value === 'left' || value === 'top') {
      return value;
    }
  } catch {
    // localStorageが使えない環境では既定値にフォールバックする
  }
  return 'grid';
}

export function saveLayoutMode(mode: LayoutMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 保存できなくても致命的ではないため無視する
  }
}
