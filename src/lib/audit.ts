import { db } from './db';

export async function logAudit(adminId: string, action: string, resource: string, resourceId?: string, details?: unknown) {
  try {
    await db.auditLog.create({
      data: {
        adminId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
