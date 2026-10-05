import { createApp } from '../app.ts';
import { initDatabase, getDatabase } from '../database/connection.ts';
import { config } from '../config/index.ts';
import { JiraService } from '../services/jiraService.ts';
import http from 'node:http';

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');
  initDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;

  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /api/health returns { status: "ok" }');

    // 2. Student Registration
    const studentReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        role: 'STUDENT',
        name: 'Test Student A',
        email: `student_test_${Date.now()}@college.edu`,
        password: 'securePassword123',
        usn: '1RV21CS001',
        branch: 'Computer Science',
        semester: '6th Semester',
      }),
    });
    assert(studentReg.status === 201 && studentReg.body.success === true && Boolean(studentReg.body.data.token), 'Student registration creates account and token');
    const studentToken = studentReg.body.data.token;
    const studentId = studentReg.body.data.user.id;

    // 3. Password Security: Database contains only password hashes, not plaintext
    const db = getDatabase();
    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(studentId) as any;
    assert(userRow && userRow.password_hash !== 'securePassword123' && userRow.password_hash.startsWith('$2'), 'Password stored as bcrypt hash, never plaintext');

    // 4. Student Login
    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: studentReg.body.data.user.email,
        password: 'securePassword123',
      }),
    });
    assert(studentLogin.status === 200 && studentLogin.body.success === true && studentLogin.body.data.user.role === 'STUDENT', 'Student login verifies credentials and enforces role');

    // 5. Unauthorized Request (Missing Token)
    const unauthorized = await request('/api/complaints');
    assert(unauthorized.status === 401 && unauthorized.body.success === false, 'Accessing protected route without token returns 401');

    // 6. Role Authorization: Student cannot perform staff claim
    const forbidden = await request('/api/complaints/test-id/claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(forbidden.status === 403 && forbidden.body.error.code === 'FORBIDDEN', 'Student attempting staff action returns 403 Forbidden');

    // 7. Student Creates Complaint
    const newComplaint = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        category: 'IT & Network Services',
        title: 'Corridor WiFi AP down during lab',
        description: 'The wireless access point outside Lab 3 is completely dark and students cannot connect.',
        block: 'Computer Science Wing',
        room: 'Lab 3 Corridor',
        priority: 'HIGH',
      }),
    });
    assert(
      newComplaint.status === 201 && 
      newComplaint.body.data.status === 'SUBMITTED' && 
      newComplaint.body.data.department === 'IT & Network Services' &&
      newComplaint.body.data.slaTargetHours === 6,
      'Complaint created with dynamic ID, correct department mapping, and 6h SLA target'
    );
    const complaintId = newComplaint.body.data.complaintId;

    // 8. Student Data Isolation: Student B cannot access Student A's complaint
    const studentBReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        role: 'STUDENT',
        name: 'Test Student B',
        email: `student_b_${Date.now()}@college.edu`,
        password: 'securePassword123',
        usn: '1RV21CS099',
      }),
    });
    const studentBToken = studentBReg.body.data.token;
    const studentBAccess = await request(`/api/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(studentBAccess.status === 403, 'Student B is forbidden from reading Student A complaint');

    // 9. Staff Registration & Work Queue Access
    const staffReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        role: 'STAFF',
        name: 'Network Tech John',
        email: `staff_it_${Date.now()}@college.edu`,
        password: 'staffPassword123',
        employeeId: 'EMP-IT-44',
        department: 'IT & Network Services',
      }),
    });
    const staffToken = staffReg.body.data.token;

    // Staff claims complaint
    const claimRes = await request(`/api/complaints/${complaintId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(claimRes.status === 200 && claimRes.body.data.status === 'ASSIGNED', 'Staff claims complaint and status transitions to ASSIGNED');

    // 10. Staff Updates Status to BLOCKED with Reason
    const blockRes = await request(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'BLOCKED',
        reason: 'Waiting for replacement PoE injector module.',
      }),
    });
    assert(blockRes.status === 200 && blockRes.body.data.status === 'BLOCKED' && blockRes.body.data.blockedReason.includes('PoE injector'), 'Staff transitions to BLOCKED with mandatory reason');

    // 11. Staff Cannot Directly Close Complaint
    const closeRes = await request(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'CLOSED',
      }),
    });
    assert(closeRes.status === 403, 'Staff is forbidden from directly closing complaints');

    // 12. Staff Updates Status to RESOLVED with Summary
    const resolveRes = await request(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionSummary: 'Replaced failed PoE adapter and restored 300Mbps throughput.',
      }),
    });
    assert(resolveRes.status === 200 && resolveRes.body.data.status === 'RESOLVED' && Boolean(resolveRes.body.data.resolvedAt), 'Staff resolves complaint with resolution summary and timestamp');

    // 13. Admin Oversight Access
    const adminReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        role: 'ADMIN',
        name: 'Dean Oversight',
        email: `dean_${Date.now()}@college.edu`,
        password: 'adminPassword123',
        adminId: 'ADM-ROOT-1',
        adminUnit: 'Institutional Operations',
      }),
    });
    const adminToken = adminReg.body.data.token;
    const adminComplaints = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminComplaints.status === 200 && adminComplaints.body.data.length >= 1, 'Admin can view institutional complaints across all departments');

    // -------------------------------------------------------------
    // JIRA CLOUD INTEGRATION FOUNDATION TESTS
    // -------------------------------------------------------------

    // 14. Jira Health Endpoint (Safe inspection, never leaks secrets)
    const jiraHealth = await request('/api/jira/health');
    assert(
      jiraHealth.status === 200 &&
      jiraHealth.body.status === 'ok' &&
      jiraHealth.body.apiToken === undefined,
      'GET /api/jira/health returns status ok without leaking API token'
    );

    // 15. Missing Credentials Handling
    const originalJiraConfig = { ...config.jira };
    config.jira.baseUrl = '';
    config.jira.email = '';
    config.jira.apiToken = '';
    config.jira.projectKey = '';

    const unconfiguredTest = await request('/api/jira/test-connection', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      unconfiguredTest.status === 400 &&
      unconfiguredTest.body.error?.code === 'JIRA_NOT_CONFIGURED',
      'Unconfigured Jira credentials return 400 JIRA_NOT_CONFIGURED without crashing'
    );

    // Set mock Jira configuration for controlled testing
    config.jira.baseUrl = 'https://mock-college.atlassian.net';
    config.jira.email = 'integrations@college.edu';
    config.jira.apiToken = 'test_token_super_secret_xyz';
    config.jira.projectKey = 'CMS';

    // 16. Jira Request Construction & Basic Auth Encoding
    let capturedUrl = '';
    let capturedAuth = '';
    JiraService.setTransport(async (url, init) => {
      capturedUrl = url;
      capturedAuth = (init.headers as any)?.Authorization || '';
      return new Response(JSON.stringify({ id: '10001', key: 'CMS', name: 'Campus Grievance System' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const connTest = await request('/api/jira/test-connection', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const expectedAuth = 'Basic ' + Buffer.from('integrations@college.edu:test_token_super_secret_xyz').toString('base64');
    assert(
      connTest.status === 200 &&
      capturedUrl === 'https://mock-college.atlassian.net/rest/api/2/project/CMS' &&
      capturedAuth === expectedAuth,
      'Jira request construction targets correct REST API endpoint and encodes Basic Auth'
    );

    // 17. Jira Connection Test Success
    assert(
      connTest.body.success === true &&
      connTest.body.data.connected === true &&
      connTest.body.data.project === 'CMS',
      'Jira connection test returns safe connected status and project key'
    );

    // 18. Jira Authentication Failure (401 from Jira)
    JiraService.setTransport(async () => {
      return new Response(JSON.stringify({ errorMessages: ['Invalid credentials'] }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const authFailTest = await request('/api/jira/test-connection', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      authFailTest.status === 401 &&
      authFailTest.body.error?.code === 'JIRA_AUTH_FAILED',
      'Jira 401 response is handled gracefully as JIRA_AUTH_FAILED'
    );

    // 19. Jira Unavailable / Network Failure (502 / Connection error)
    JiraService.setTransport(async () => {
      throw new Error('getaddrinfo ENOTFOUND mock-college.atlassian.net');
    });
    const networkFailTest = await request('/api/jira/test-connection', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      networkFailTest.status === 502 &&
      networkFailTest.body.error?.code === 'JIRA_CONNECTION_FAILED',
      'Jira server unavailability produces controlled 502 JIRA_CONNECTION_FAILED'
    );

    // 20. Successful Jira Issue Creation on Existing Complaint
    let createdIssueBody: any = null;
    JiraService.setTransport(async (url, init) => {
      if (url.endsWith('/issue')) {
        createdIssueBody = JSON.parse(init.body as string);
        return new Response(
          JSON.stringify({
            id: '50100',
            key: 'CMS-101',
            self: 'https://mock-college.atlassian.net/rest/api/2/issue/50100',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const syncRes = await request(`/api/complaints/${complaintId}/jira`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
    });

    const dbRow = getDatabase().prepare('SELECT jira_issue_key, jira_sync_status FROM complaints WHERE id = ? OR complaint_id = ?').get(complaintId, complaintId) as any;
    assert(
      syncRes.status === 200 &&
      syncRes.body.data.jira.issueKey === 'CMS-101' &&
      dbRow?.jira_issue_key === 'CMS-101' &&
      dbRow?.jira_sync_status === 'SYNCED' &&
      createdIssueBody?.fields?.project?.key === 'CMS',
      'Staff syncs complaint to Jira: issue created, SQLite record updated, and Jira key linked'
    );

    // 21. Duplicate Creation Protection (409 Conflict)
    const duplicateRes = await request(`/api/complaints/${complaintId}/jira`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      duplicateRes.status === 409 &&
      duplicateRes.body.error?.code === 'JIRA_ALREADY_EXISTS',
      'Attempting duplicate Jira sync on an already-synced complaint returns 409 Conflict'
    );

    // 22. Complaint Remains Stored When Jira Fails During Creation
    JiraService.setTransport(async () => {
      throw new Error('Jira Cloud service 503 unavailable');
    });

    const studentNewComplaint = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        category: 'Classrooms',
        title: 'Broken desk bench in Room 204',
        description: 'Wooden bench joint has split and requires maintenance.',
        block: 'Main Academic Wing',
        room: '204',
        priority: 'MEDIUM',
      }),
    });

    const newId = studentNewComplaint.body?.data?.id;
    const newDbRow = getDatabase().prepare('SELECT id, status, jira_sync_status FROM complaints WHERE id = ? OR complaint_id = ?').get(newId, newId) as any;
    assert(
      studentNewComplaint.status === 201 &&
      Boolean(newDbRow) &&
      newDbRow.status === 'SUBMITTED' &&
      newDbRow.jira_sync_status === 'PENDING_RETRY',
      'When Jira fails, complaint submission remains successful and persisted in SQLite'
    );

    // 23. Student Forbidden Protection (Students cannot manually trigger Jira creation)
    const studentJiraAttempt = await request(`/api/complaints/${newId}/jira`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentJiraAttempt.status === 403 &&
      studentJiraAttempt.body.error?.code === 'FORBIDDEN',
      'Student attempting to trigger Jira sync returns 403 Forbidden'
    );

    // 24. Automatic Complaint Creation -> Jira Sync Workflow (Prompt 13)
    JiraService.setTransport(async (url) => {
      if (url.endsWith('/issue')) {
        return new Response(
          JSON.stringify({
            id: '50202',
            key: 'CMS-202',
            self: 'https://mock-college.atlassian.net/rest/api/2/issue/50202',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const autoSyncComplaint = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        category: 'IT & Network Services',
        title: 'Computer Lab 3 Router Failure',
        description: 'Core gateway router dropping packets, students unable to reach lab intranet.',
        block: 'Science Block',
        room: 'Lab 3',
        priority: 'HIGH',
      }),
    });

    const autoComplaintId = autoSyncComplaint.body?.data?.id;
    const autoDbRow = getDatabase().prepare('SELECT jira_issue_key, jira_sync_status FROM complaints WHERE id = ? OR complaint_id = ?').get(autoComplaintId, autoComplaintId) as any;
    assert(
      autoSyncComplaint.status === 201 &&
      autoSyncComplaint.body?.data?.jiraIssueKey === 'CMS-202' &&
      autoSyncComplaint.body?.data?.jiraIssueUrl === 'https://mock-college.atlassian.net/browse/CMS-202' &&
      autoSyncComplaint.body?.data?.jiraSyncStatus === 'SYNCED' &&
      autoDbRow?.jira_issue_key === 'CMS-202' &&
      autoDbRow?.jira_sync_status === 'SYNCED',
      'Automatic Complaint Creation: creates complaint, creates Jira issue, and persists Jira reference and URL in SQLite'
    );

    // Restore original config and transport
    config.jira = originalJiraConfig;
    JiraService.setTransport();

    console.log(`\n--- Verification Summary: ${passed} passed, ${failed} failed ---`);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
