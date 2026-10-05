import path from 'path';
import fs from 'fs';

// Safely load environment file if present (Node.js 20.6.0+)
if (typeof (process as any).loadEnvFile === 'function') {
  const backendEnv = path.resolve(process.cwd(), 'backend/.env');
  const rootEnv = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(backendEnv)) {
    try { (process as any).loadEnvFile(backendEnv); } catch {}
  } else if (fs.existsSync(rootEnv)) {
    try { (process as any).loadEnvFile(rootEnv); } catch {}
  }
}

function getInitialDatabasePath(): string {
  if (process.env.DATABASE_PATH && !process.env.DATABASE_PATH.startsWith('./data')) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  const cwd = process.cwd();
  // When executed from within the backend folder:
  if (cwd.endsWith('/backend') || cwd.endsWith('\\backend')) {
    return path.resolve(cwd, 'data/college-cms.sqlite');
  }
  // Standard location for backend database:
  return path.resolve(cwd, 'backend/data/college-cms.sqlite');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: getInitialDatabasePath(),
  sessionSecret: process.env.SESSION_SECRET || 'college_cms_super_secure_jwt_session_secret_2026',
  corsOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  tokenExpiryHours: 24,

  // Jira Cloud Integration Configuration
  jira: {
    baseUrl: (process.env.JIRA_BASE_URL || '').trim().replace(/\/$/, ''),
    email: (process.env.JIRA_EMAIL || '').trim(),
    apiToken: (process.env.JIRA_API_TOKEN || '').trim(),
    projectKey: (process.env.JIRA_PROJECT_KEY || '').trim().toUpperCase(),
  },

  // Category -> SLA Hours
  categorySlaHours: {
    'Classrooms': 24,
    'Laboratories': 12,
    'Fees & Accounts': 48,
    'Library': 24,
    'Hostel & Residential': 8,
    'Transport': 24,
    'IT & Network Services': 6,
    'Facilities & Campus Life': 36,
  } as Record<string, number>,

  // Category -> Department Domain
  categoryDepartmentMap: {
    'Classrooms': 'Estate & Infrastructure Maintenance',
    'Facilities & Campus Life': 'Estate & Infrastructure Maintenance',
    'Laboratories': 'Laboratory & Technical Safety',
    'Fees & Accounts': 'Finance & Accounts',
    'Library': 'Library Operations',
    'Hostel & Residential': 'Hostel & Residential Services',
    'Transport': 'Transport & Fleet Operations',
    'IT & Network Services': 'IT & Network Services',
  } as Record<string, string>,

  // Department -> Category list
  departmentCategoriesMap: {
    'Estate & Infrastructure Maintenance': ['Classrooms', 'Facilities & Campus Life'],
    'Laboratory & Technical Safety': ['Laboratories'],
    'Finance & Accounts': ['Fees & Accounts'],
    'Library Operations': ['Library'],
    'Hostel & Residential Services': ['Hostel & Residential'],
    'Transport & Fleet Operations': ['Transport'],
    'IT & Network Services': ['IT & Network Services'],
    'General Administration': [
      'Classrooms',
      'Laboratories',
      'Fees & Accounts',
      'Library',
      'Hostel & Residential',
      'Transport',
      'IT & Network Services',
      'Facilities & Campus Life',
    ],
  } as Record<string, string[]>,
};
