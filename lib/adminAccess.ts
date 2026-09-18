// 利用状況ページはadmin@riprice.co.jpでログインした場合のみ表示・閲覧できる(2026-09-18決定)。
export const USAGE_ADMIN_EMAIL = 'admin@riprice.co.jp';

export function isUsageAdmin(email: string | null | undefined): boolean {
  return email?.toLowerCase() === USAGE_ADMIN_EMAIL;
}
