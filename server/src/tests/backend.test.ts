import { createApp } from '../app.ts';
import { initDatabase, getDatabase } from '../database/connection.ts';
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

    console.log(`\n--- Verification Summary: ${passed} passed, ${failed} failed ---`);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
