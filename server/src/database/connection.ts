import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.resolve(config.databasePath);
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(dbPath);
    // Enable WAL mode and foreign keys
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export function initDatabase(): void {
  const db = getDatabase();

  // Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'STAFF', 'ADMIN')),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      student_usn TEXT,
      branch TEXT,
      semester TEXT,
      employee_id TEXT,
      admin_id TEXT,
      department TEXT,
      administration_unit TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create Complaints Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complaint_id TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      block TEXT NOT NULL,
      room TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      status TEXT NOT NULL CHECK(status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED')),
      department TEXT NOT NULL,
      assigned_staff_id TEXT,
      assigned_at TEXT,
      blocked_reason TEXT,
      resolution_summary TEXT,
      sla_target_hours INTEGER NOT NULL,
      sla_status TEXT NOT NULL DEFAULT 'Within SLA',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create Complaint Activity Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_activity (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Create Attachments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_attachments (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Create Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_complaints_complaint_id ON complaints(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaint_activity_complaint_id ON complaint_activity(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_complaint_attachments_complaint_id ON complaint_attachments(complaint_id);
  `);
}
