/**
 * Report auto-escalation rules.
 * Ported from Kin — evaluates whether a target user's reports should be
 * escalated based on frequency/severity thresholds.
 * Adapted for Supabase (Kin used Prisma).
 *
 * Rules (all within 7-day window):
 * 1. Target has >= 3 open reports from distinct reporters
 * 2. Target has >= 2 reports with high-risk reasons
 *
 * Does NOT auto-suspend — only marks reports as escalated for admin attention.
 */

import { createServerClient } from './supabase-server';

const ESCALATION_WINDOW_DAYS = 7;
const DISTINCT_REPORTER_THRESHOLD = 3;
const HIGH_RISK_THRESHOLD = 2;

const HIGH_RISK_REASONS = ['harassment', 'scam', 'fake_profile', 'threats'];

export async function evaluateEscalation(reportedUserId: string): Promise<boolean> {
  const adminClient = createServerClient();
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - ESCALATION_WINDOW_DAYS);

  const { data: recentReports } = await adminClient
    .from('reports')
    .select('id, reporter_id, reason, status')
    .eq('reported_user_id', reportedUserId)
    .eq('status', 'pending')
    .gte('created_at', windowStart.toISOString());

  if (!recentReports || recentReports.length === 0) return false;

  // Rule 1: distinct reporters >= threshold
  const distinctReporters = new Set(recentReports.map((r) => r.reporter_id));
  const rule1 = distinctReporters.size >= DISTINCT_REPORTER_THRESHOLD;

  // Rule 2: high-risk reason count >= threshold
  const highRiskCount = recentReports.filter((r) =>
    HIGH_RISK_REASONS.includes(r.reason?.toLowerCase() || '')
  ).length;
  const rule2 = highRiskCount >= HIGH_RISK_THRESHOLD;

  if (!rule1 && !rule2) return false;

  // Escalate: update status to 'escalated'
  const toEscalate = recentReports.filter((r) => r.status === 'pending').map((r) => r.id);
  if (toEscalate.length > 0) {
    await adminClient
      .from('reports')
      .update({ status: 'escalated' })
      .in('id', toEscalate);

    console.warn('[escalation] Reports escalated', {
      reportedUserId,
      escalatedCount: toEscalate.length,
      rule1Triggered: rule1,
      rule2Triggered: rule2,
    });
  }

  return true;
}
