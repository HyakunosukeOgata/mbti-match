/**
 * Audit logging system.
 * Ported from Kin — tracks all significant user and admin actions.
 * Adapted for Supabase (Kin used Prisma).
 *
 * Failures are logged to console but never thrown — audit logging
 * must not break the primary operation.
 */

import { createServerClient } from './supabase-server';

// ─── Action constants ───────────────────────────────────

export const AuditAction = {
  // Admin actions
  ADMIN_SUSPEND_USER: "admin.suspend_user",
  ADMIN_UNSUSPEND_USER: "admin.unsuspend_user",
  ADMIN_HIDE_PROFILE: "admin.hide_profile",
  ADMIN_SHOW_PROFILE: "admin.show_profile",
  ADMIN_REVIEW_REPORT: "admin.review_report",
  ADMIN_RESOLVE_REPORT: "admin.resolve_report",
  ADMIN_DISMISS_REPORT: "admin.dismiss_report",

  // User actions
  USER_REGISTER: "user.register",
  USER_LOGIN: "user.login",
  USER_COMPLETE_ONBOARDING: "user.complete_onboarding",
  USER_UPDATE_PROFILE: "user.update_profile",
  USER_UPLOAD_PHOTO: "user.upload_photo",
  USER_DELETE_PHOTO: "user.delete_photo",
  USER_LIKE: "user.like",
  USER_SKIP: "user.skip",
  USER_SEND_MESSAGE: "user.send_message",
  USER_SEND_IMAGE: "user.send_image",
  USER_BLOCK_USER: "user.block_user",
  USER_REPORT_USER: "user.report_user",
  USER_LEAVE_MATCH: "user.leave_match",
  USER_DELETE_ACCOUNT: "user.delete_account",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditTargetType = {
  USER: "user",
  PHOTO: "photo",
  REPORT: "report",
  MATCH: "match",
  MESSAGE: "message",
  DAILY_CARD: "daily_card",
} as const;

export type AuditTargetTypeValue = (typeof AuditTargetType)[keyof typeof AuditTargetType];

// ─── Input type ─────────────────────────────────────────

export interface AuditLogInput {
  actorUserId: string;
  action: AuditActionType;
  targetType: AuditTargetTypeValue;
  targetId: string;
  metadata?: Record<string, unknown>;
}

// ─── Write audit log ────────────────────────────────────

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    const adminClient = createServerClient();
    await adminClient.from('audit_logs').insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error('[audit] Failed to write audit log', {
      action: input.action,
      error: err instanceof Error ? err.message : 'Unknown',
    });
  }
}
