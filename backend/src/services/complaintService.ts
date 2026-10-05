import crypto from 'node:crypto';
import { getDatabase } from '../database/connection.ts';
import { config } from '../config/index.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { AuthenticatedUser } from '../middleware/auth.ts';
import { JiraService } from './jiraService.ts';
import { 
  isValidCategory, 
  isValidPriority, 
  isValidComplaintStatus 
} from '../utils/validation.ts';

export class ComplaintService {
  /**
   * Generates a unique, non-hardcoded complaint ID with format CMP-XXXXXXXX
   */
  public static generateComplaintId(): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CMP-${code}`;
  }

  /**
   * Student creates a new complaint
   */
  public static async createComplaint(
    user: AuthenticatedUser,
    data: {
      category: string;
      title: string;
      description: string;
      block: string;
      room: string;
      priority: string;
      attachment?: {
        name: string;
        type: string;
        size: number;
        dataUrl?: string;
      };
    }
  ) {
    if (user.role !== 'STUDENT') {
      throw new AppError('Only students are authorized to register complaints.', 403, 'FORBIDDEN');
    }

    if (!isValidCategory(data.category)) {
      throw new AppError(`Invalid complaint category: ${data.category}`, 400, 'INVALID_CATEGORY');
    }

    if (!data.title || data.title.trim().length < 5 || data.title.trim().length > 100) {
      throw new AppError('Title must be between 5 and 100 characters long.', 400, 'INVALID_TITLE');
    }

    if (!data.description || data.description.trim().length < 15) {
      throw new AppError('Description must be at least 15 characters long.', 400, 'INVALID_DESCRIPTION');
    }

    if (!data.block || !data.block.trim()) {
      throw new AppError('Block or building is required.', 400, 'INVALID_BLOCK');
    }

    if (!data.room || !data.room.trim()) {
      throw new AppError('Room number or area is required.', 400, 'INVALID_ROOM');
    }

    const normalizedPriority = data.priority?.toUpperCase();
    if (!isValidPriority(normalizedPriority)) {
      throw new AppError('Priority must be LOW, MEDIUM, HIGH, or URGENT.', 400, 'INVALID_PRIORITY');
    }

    const complaintId = this.generateComplaintId();
    const id = `cmp_${crypto.randomUUID()}`;
    const department = config.categoryDepartmentMap[data.category] || 'General Administration';
    const slaTargetHours = config.categorySlaHours[data.category] || 24;
    const now = new Date().toISOString();

    const db = getDatabase();

    // Insert complaint record
    const insertComplaintStmt = db.prepare(`
      INSERT INTO complaints (
        id, complaint_id, student_id, category, title, description,
        block, room, priority, status, department,
        sla_target_hours, sla_status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 'SUBMITTED', ?,
        ?, 'Within SLA', ?, ?
      )
    `);

    insertComplaintStmt.run(
      id,
      complaintId,
      user.id,
      data.category,
      data.title.trim(),
      data.description.trim(),
      data.block.trim(),
      data.room.trim(),
      normalizedPriority,
      department,
      slaTargetHours,
      now,
      now
    );

    // Save attachment record if provided
    if (data.attachment && data.attachment.name) {
      const attachId = `att_${crypto.randomUUID()}`;
      const insertAttachStmt = db.prepare(`
        INSERT INTO complaint_attachments (
          id, complaint_id, file_name, mime_type, file_size, storage_path, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?
        )
      `);

      // Storage abstraction: path or data reference
      const storagePath = `uploads/${complaintId}_${data.attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      insertAttachStmt.run(
        attachId,
        id,
        data.attachment.name,
        data.attachment.type || 'image/jpeg',
        data.attachment.size || 0,
        storagePath,
        now
      );
    }

    // Insert activity history
    const activityId = `act_${crypto.randomUUID()}`;
    const insertActivityStmt = db.prepare(`
      INSERT INTO complaint_activity (
        id, complaint_id, actor_user_id, event_type, message, created_at
      ) VALUES (
        ?, ?, ?, 'COMPLAINT_SUBMITTED', ?, ?
      )
    `);

    insertActivityStmt.run(
      activityId,
      id,
      user.id,
      `Complaint registered by student ${user.name} under category ${data.category}.`,
      now
    );

    // Optional automated Jira synchronization upon creation (never blocks or fails submission)
    if (JiraService.isConfigured()) {
      try {
        const jiraResult = await JiraService.createIssue({
          id,
          complaintId,
          title: data.title.trim(),
          description: data.description.trim(),
          category: data.category,
          department,
          priority: normalizedPriority,
          block: data.block.trim(),
          room: data.room.trim(),
          location: `${data.block.trim()}, ${data.room.trim()}`,
          slaTargetHours,
        });

        db.prepare(`
          UPDATE complaints 
          SET jira_issue_key = ?, jira_issue_id = ?, jira_sync_status = 'SYNCED', updated_at = ?
          WHERE id = ?
        `).run(jiraResult.issueKey, jiraResult.issueId, now, id);

        const jiraActId = `act_${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO complaint_activity (id, complaint_id, actor_user_id, event_type, message, created_at)
          VALUES (?, ?, ?, 'JIRA_ISSUE_CREATED', ?, ?)
        `).run(
          jiraActId,
          id,
          user.id,
          `Jira issue ${jiraResult.issueKey} created in project ${config.jira.projectKey}.`,
          now
        );
      } catch (jiraErr: any) {
        // Jira creation failure must NEVER block or fail complaint submission
        console.warn('Jira auto-sync deferred:', jiraErr?.message);
        db.prepare(`
          UPDATE complaints SET jira_sync_status = 'PENDING_RETRY' WHERE id = ?
        `).run(id);
      }
    }

    return this.getComplaintById(user, complaintId);
  }

  /**
   * Retrieves complaints matching role-based authorization
   */
  public static async getComplaints(
    user: AuthenticatedUser,
    filters?: {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
    }
  ) {
    const db = getDatabase();
    let sql = `
      SELECT 
        c.*,
        u.full_name AS student_name,
        u.email AS student_email,
        u.student_usn AS student_usn,
        s.full_name AS assigned_staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-Based Authorization Filter
    if (user.role === 'STUDENT') {
      // Student only sees their own complaints
      sql += ' AND c.student_id = ?';
      params.push(user.id);
    } else if (user.role === 'STAFF') {
      // Staff only sees complaints matching their department
      if (user.department && user.department !== 'General Administration') {
        sql += ' AND c.department = ?';
        params.push(user.department);
      }
    }
    // Admin has institutional oversight across all departments

    // Optional Status Filter
    if (filters?.status && filters.status !== 'ALL') {
      const normalizedStatus = filters.status.toUpperCase().replace(/\s+/g, '_');
      sql += ' AND c.status = ?';
      params.push(normalizedStatus);
    }

    // Optional Category Filter
    if (filters?.category && filters.category !== 'ALL') {
      sql += ' AND c.category = ?';
      params.push(filters.category);
    }

    // Optional Priority Filter
    if (filters?.priority && filters.priority !== 'ALL') {
      sql += ' AND c.priority = ?';
      params.push(filters.priority.toUpperCase());
    }

    // Optional Search Filter
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (
        c.complaint_id LIKE ? OR 
        c.title LIKE ? OR 
        c.location LIKE ? OR 
        c.block LIKE ? OR 
        c.room LIKE ? OR
        u.full_name LIKE ? OR
        u.student_usn LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q);
    }

    sql += ' ORDER BY c.created_at DESC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.formatComplaintRow(row));
  }

  /**
   * Retrieves single complaint by ID or complaint_id with RBAC enforcement
   */
  public static async getComplaintById(user: AuthenticatedUser, complaintId: string) {
    const db = getDatabase();
    const sql = `
      SELECT 
        c.*,
        u.full_name AS student_name,
        u.email AS student_email,
        u.student_usn AS student_usn,
        s.full_name AS assigned_staff_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      WHERE c.id = ? OR c.complaint_id = ?
    `;

    const row = db.prepare(sql).get(complaintId, complaintId) as any;

    if (!row) {
      throw new AppError('Complaint not found.', 404, 'COMPLAINT_NOT_FOUND');
    }

    // Enforce Student Access: Student may NEVER view another student's complaint
    if (user.role === 'STUDENT' && row.student_id !== user.id) {
      throw new AppError('Access forbidden: You do not have permission to view this complaint.', 403, 'FORBIDDEN');
    }

    // Enforce Staff Access: Staff may only view complaints within department scope
    if (user.role === 'STAFF') {
      if (user.department && user.department !== 'General Administration' && row.department !== user.department) {
        throw new AppError('Access forbidden: This complaint belongs to a different department queue.', 403, 'FORBIDDEN');
      }
    }

    // Retrieve activity history
    const activityRows = db.prepare(`
      SELECT 
        ca.*,
        u.full_name AS actor_name,
        u.role AS actor_role
      FROM complaint_activity ca
      JOIN users u ON ca.actor_user_id = u.id
      WHERE ca.complaint_id = ?
      ORDER BY ca.created_at DESC
    `).all(row.id) as any[];

    // Retrieve attachments
    const attachmentRows = db.prepare(`
      SELECT * FROM complaint_attachments WHERE complaint_id = ?
    `).all(row.id) as any[];

    const formatted = this.formatComplaintRow(row);
    formatted.activityHistory = activityRows.map((a) => ({
      id: a.id,
      eventType: a.event_type,
      message: a.message,
      actor: a.actor_name,
      actorRole: a.actor_role,
      createdAt: a.created_at,
    }));

    if (attachmentRows.length > 0) {
      formatted.attachment = {
        id: attachmentRows[0].id,
        name: attachmentRows[0].file_name,
        type: attachmentRows[0].mime_type,
        size: attachmentRows[0].file_size,
        storagePath: attachmentRows[0].storage_path,
      };
    }

    return formatted;
  }

  /**
   * Staff claims an unassigned complaint
   */
  public static async claimComplaint(user: AuthenticatedUser, complaintId: string) {
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      throw new AppError('Only staff or administrators can claim complaints.', 403, 'FORBIDDEN');
    }

    const db = getDatabase();
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? OR complaint_id = ?').get(complaintId, complaintId) as any;

    if (!complaint) {
      throw new AppError('Complaint not found.', 404, 'COMPLAINT_NOT_FOUND');
    }

    // Verify staff department eligibility
    if (user.role === 'STAFF' && user.department && user.department !== 'General Administration') {
      if (complaint.department !== user.department) {
        throw new AppError(`Cannot claim: This complaint belongs to ${complaint.department}, but you belong to ${user.department}.`, 403, 'DEPARTMENT_MISMATCH');
      }
    }

    // Verify complaint is not already assigned
    if (complaint.assigned_staff_id) {
      throw new AppError('This complaint is already assigned to a technician.', 409, 'ALREADY_ASSIGNED');
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE complaints 
      SET status = 'ASSIGNED', assigned_staff_id = ?, assigned_at = ?, updated_at = ?
      WHERE id = ?
    `).run(user.id, now, now, complaint.id);

    // Log Activity
    const actId = `act_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO complaint_activity (id, complaint_id, actor_user_id, event_type, message, created_at)
      VALUES (?, ?, ?, 'COMPLAINT_CLAIMED', ?, ?)
    `).run(
      actId,
      complaint.id,
      user.id,
      `Complaint claimed by technician ${user.name} and moved to ASSIGNED.`,
      now
    );

    return this.getComplaintById(user, complaint.id);
  }

  /**
   * Staff updates status (ASSIGNED, IN_PROGRESS, BLOCKED, RESOLVED)
   */
  public static async updateStatus(
    user: AuthenticatedUser,
    complaintId: string,
    newStatus: string,
    reasonOrSummary?: string
  ) {
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      throw new AppError('Only staff or administrators can update complaint status.', 403, 'FORBIDDEN');
    }

    const normalizedStatus = newStatus.toUpperCase().replace(/\s+/g, '_');
    if (!isValidComplaintStatus(normalizedStatus)) {
      throw new AppError(`Invalid status: ${newStatus}`, 400, 'INVALID_STATUS');
    }

    // Staff must NOT directly set CLOSED
    if (normalizedStatus === 'CLOSED' && user.role === 'STAFF') {
      throw new AppError('Technicians may not close complaints directly. Closure requires student verification.', 403, 'FORBIDDEN_STATUS_TRANSITION');
    }

    if (normalizedStatus === 'BLOCKED' && (!reasonOrSummary || !reasonOrSummary.trim())) {
      throw new AppError('Please provide a blocked reason explaining why work is paused.', 400, 'MISSING_BLOCKED_REASON');
    }

    if (normalizedStatus === 'RESOLVED' && (!reasonOrSummary || !reasonOrSummary.trim())) {
      throw new AppError('Please provide a resolution summary describing what was fixed.', 400, 'MISSING_RESOLUTION_SUMMARY');
    }

    const db = getDatabase();
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? OR complaint_id = ?').get(complaintId, complaintId) as any;

    if (!complaint) {
      throw new AppError('Complaint not found.', 404, 'COMPLAINT_NOT_FOUND');
    }

    // Department match check
    if (user.role === 'STAFF' && user.department && user.department !== 'General Administration') {
      if (complaint.department !== user.department) {
        throw new AppError('Permission denied: Complaint belongs to a different department.', 403, 'FORBIDDEN');
      }
    }

    const now = new Date().toISOString();
    let eventType = 'STATUS_CHANGED';
    let activityMessage = `Status transitioned to ${normalizedStatus} by ${user.name}.`;

    if (normalizedStatus === 'BLOCKED') {
      eventType = 'COMPLAINT_BLOCKED';
      activityMessage = `Complaint blocked: ${reasonOrSummary!.trim()}`;
      db.prepare(`
        UPDATE complaints 
        SET status = 'BLOCKED', blocked_reason = ?, updated_at = ?
        WHERE id = ?
      `).run(reasonOrSummary!.trim(), now, complaint.id);
    } else if (normalizedStatus === 'RESOLVED') {
      eventType = 'RESOLUTION_SUBMITTED';
      activityMessage = `Resolution submitted: ${reasonOrSummary!.trim()}`;
      db.prepare(`
        UPDATE complaints 
        SET status = 'RESOLVED', resolution_summary = ?, resolved_at = ?, updated_at = ?
        WHERE id = ?
      `).run(reasonOrSummary!.trim(), now, now, complaint.id);
    } else {
      db.prepare(`
        UPDATE complaints 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(normalizedStatus, now, complaint.id);
    }

    // Log Activity
    const actId = `act_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO complaint_activity (id, complaint_id, actor_user_id, event_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(actId, complaint.id, user.id, eventType, activityMessage, now);

    return this.getComplaintById(user, complaint.id);
  }

  /**
   * Synchronizes a complaint to Jira Cloud (Staff or Admin authorized)
   */
  public static async syncComplaintToJira(user: AuthenticatedUser, complaintId: string) {
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      throw new AppError('Only staff or administrators can synchronize complaints to Jira.', 403, 'FORBIDDEN');
    }

    const complaint = await this.getComplaintById(user, complaintId);

    // Duplicate creation protection
    if (complaint.jiraIssueKey) {
      throw new AppError(
        `Complaint is already synchronized to Jira issue ${complaint.jiraIssueKey}.`,
        409,
        'JIRA_ALREADY_EXISTS'
      );
    }

    if (!JiraService.isConfigured()) {
      throw new AppError(
        'Jira Cloud integration is not configured on the server. Please set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY in backend/.env',
        400,
        'JIRA_NOT_CONFIGURED'
      );
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      const jiraResult = await JiraService.createIssue({
        id: complaint.id,
        complaintId: complaint.complaintId || complaint.id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        department: complaint.department,
        priority: complaint.priority,
        block: complaint.block,
        room: complaint.room,
        location: complaint.location,
        slaTargetHours: complaint.slaTargetHours,
      });

      // Update SQLite complaint record with Jira references
      db.prepare(`
        UPDATE complaints 
        SET jira_issue_key = ?, jira_issue_id = ?, jira_sync_status = 'SYNCED', updated_at = ?
        WHERE id = ? OR complaint_id = ?
      `).run(jiraResult.issueKey, jiraResult.issueId, now, complaint.id, complaint.id);

      // Log activity event
      const actId = `act_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO complaint_activity (id, complaint_id, actor_user_id, event_type, message, created_at)
        VALUES (?, ?, ?, 'JIRA_ISSUE_CREATED', ?, ?)
      `).run(
        actId,
        complaint.id,
        user.id,
        `Synchronized to Jira Cloud issue ${jiraResult.issueKey} in project ${config.jira.projectKey}.`,
        now
      );

      const refreshed = await this.getComplaintById(user, complaint.id);
      return {
        success: true,
        complaint: refreshed,
        jira: jiraResult,
      };
    } catch (err: any) {
      // Record failed sync status without breaking the complaint
      db.prepare(`
        UPDATE complaints 
        SET jira_sync_status = 'SYNC_FAILED', updated_at = ?
        WHERE id = ? OR complaint_id = ?
      `).run(now, complaint.id, complaint.id);

      throw err;
    }
  }

  private static formatComplaintRow(row: any): Record<string, any> {
    return {
      id: row.id,
      complaintId: row.complaint_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      studentUsn: row.student_usn,
      category: row.category,
      title: row.title,
      description: row.description,
      block: row.block,
      room: row.room,
      location: `${row.block}, ${row.room}`,
      priority: row.priority,
      status: row.status,
      department: row.department,
      assignedStaffId: row.assigned_staff_id,
      assignedStaffName: row.assigned_staff_name,
      assignedAt: row.assigned_at,
      blockedReason: row.blocked_reason,
      resolutionSummary: row.resolution_summary,
      slaTargetHours: row.sla_target_hours,
      slaStatus: row.sla_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      jiraIssueKey: row.jira_issue_key || null,
      jiraIssueId: row.jira_issue_id || null,
      jiraIssueUrl: row.jira_issue_key && config.jira.baseUrl
        ? `${config.jira.baseUrl}/browse/${row.jira_issue_key}`
        : null,
      jiraSyncStatus: row.jira_sync_status || 'NOT_SYNCED',
    };
  }
}
