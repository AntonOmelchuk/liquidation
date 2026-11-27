export const BACKUP_ROUTES = {
  download: "/api/backup",
  preview: "/api/backup/preview",
  restore: "/api/backup/restore",
  cancel: "/api/backup/cancel",
  safety: "/api/backup/safety/",
} as const;

export const BACKUP_FORMAT = "liquidation-journal";
export const BACKUP_VERSION = 1;
export const BACKUP_MEDIA_TYPE = "application/zip";
export const MAX_BACKUP_BYTES = 8 * 1024 ** 3;

export function isBackupRoute(path: string | undefined) {
  return (
    path === BACKUP_ROUTES.download ||
    path === BACKUP_ROUTES.preview ||
    path === BACKUP_ROUTES.restore ||
    path === BACKUP_ROUTES.cancel ||
    Boolean(path?.startsWith(BACKUP_ROUTES.safety))
  );
}
