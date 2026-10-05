import { config } from '../config/index.ts';
import { AppError } from '../middleware/errorHandler.ts';

export interface JiraConnectionResult {
  connected: boolean;
  project: string;
  projectName?: string;
  baseUrl: string;
}

export interface JiraIssueResult {
  issueKey: string;
  issueId: string;
  issueUrl: string;
}

export interface ComplaintJiraPayload {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  department: string;
  priority: string;
  block: string;
  room: string;
  location?: string;
  slaTargetHours?: number;
}

export type JiraHttpTransport = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Enterprise Service for Jira Cloud REST API Foundation
 */
export class JiraService {
  private static transport: JiraHttpTransport = (url, init) => fetch(url, init);

  /**
   * Allows unit tests to mock HTTP transport without external network calls
   */
  public static setTransport(customTransport?: JiraHttpTransport): void {
    this.transport = customTransport || ((url, init) => fetch(url, init));
  }

  /**
   * Validates whether all mandatory Jira Cloud environment variables are defined
   */
  public static isConfigured(): boolean {
    const { baseUrl, email, apiToken, projectKey } = config.jira;
    return Boolean(baseUrl && email && apiToken && projectKey);
  }

  /**
   * Returns safe non-sensitive configuration status (never leaks secrets)
   */
  public static getConfigurationStatus() {
    return {
      configured: this.isConfigured(),
      baseUrl: config.jira.baseUrl || null,
      projectKey: config.jira.projectKey || null,
      emailConfigured: Boolean(config.jira.email),
      apiTokenConfigured: Boolean(config.jira.apiToken),
    };
  }

  /**
   * Generates Basic Auth header: Basic base64(email:apiToken)
   */
  private static getAuthHeader(): string {
    const { email, apiToken } = config.jira;
    if (!email || !apiToken) {
      throw new AppError(
        'Jira Cloud credentials are not configured.',
        400,
        'JIRA_NOT_CONFIGURED'
      );
    }
    const tokenBuffer = Buffer.from(`${email}:${apiToken}`, 'utf-8');
    return `Basic ${tokenBuffer.toString('base64')}`;
  }

  /**
   * Verifies connectivity, authentication, and project access against Jira Cloud
   */
  public static async testConnection(): Promise<JiraConnectionResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Jira Cloud credentials are not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY in backend/.env',
        400,
        'JIRA_NOT_CONFIGURED'
      );
    }

    const { baseUrl, projectKey } = config.jira;
    const url = `${baseUrl}/rest/api/2/project/${encodeURIComponent(projectKey)}`;

    let response: Response;
    try {
      response = await this.transport(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new AppError('Jira API request timed out after 10 seconds.', 504, 'JIRA_TIMEOUT');
      }
      throw new AppError(
        `Unable to reach Jira Cloud server at ${baseUrl}. Please check network and URL.`,
        502,
        'JIRA_CONNECTION_FAILED'
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new AppError(
          'Jira Cloud authentication failed. Please verify JIRA_EMAIL and JIRA_API_TOKEN.',
          401,
          'JIRA_AUTH_FAILED'
        );
      }
      if (response.status === 403) {
        throw new AppError(
          'Jira Cloud access forbidden. The API token lacks required project permissions.',
          403,
          'JIRA_FORBIDDEN'
        );
      }
      if (response.status === 404) {
        throw new AppError(
          `Jira project '${projectKey}' not found or not visible to the configured user.`,
          404,
          'JIRA_PROJECT_NOT_FOUND'
        );
      }
      throw new AppError(
        `Jira returned HTTP ${response.status} during connectivity check.`,
        response.status,
        'JIRA_ERROR'
      );
    }

    const data = await response.json().catch(() => ({}));
    return {
      connected: true,
      project: projectKey,
      projectName: data.name || projectKey,
      baseUrl,
    };
  }

  /**
   * Creates a Jira issue from CMS complaint data
   */
  public static async createIssue(complaint: ComplaintJiraPayload): Promise<JiraIssueResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Jira Cloud integration is not configured on the server.',
        400,
        'JIRA_NOT_CONFIGURED'
      );
    }

    const { baseUrl, projectKey } = config.jira;
    const url = `${baseUrl}/rest/api/2/issue`;

    const description = this.formatJiraDescription(complaint);
    const jiraPriority = this.mapPriorityToJira(complaint.priority);

    // Format clean Jira task payload
    const bodyPayload = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: `[${complaint.complaintId}] ${complaint.title.slice(0, 200)}`,
        description,
        issuetype: {
          name: 'Task',
        },
        priority: {
          name: jiraPriority,
        },
        labels: [
          'CollegeCMS',
          complaint.category.replace(/[^a-zA-Z0-9_-]/g, '_'),
        ],
      },
    };

    let response: Response;
    try {
      response = await this.transport(url, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(12000),
      });
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new AppError('Jira issue creation timed out after 12 seconds.', 504, 'JIRA_TIMEOUT');
      }
      throw new AppError(
        `Failed to reach Jira Cloud server. (${err.message})`,
        502,
        'JIRA_CONNECTION_FAILED'
      );
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const detail = errorJson?.errorMessages?.join(', ') || 
                     JSON.stringify(errorJson?.errors || {}) || 
                     `HTTP ${response.status}`;

      if (response.status === 401) {
        throw new AppError('Jira authentication failed. Please check credentials.', 401, 'JIRA_AUTH_FAILED');
      }
      if (response.status === 403) {
        throw new AppError('Permission denied to create issues in Jira project.', 403, 'JIRA_FORBIDDEN');
      }
      if (response.status === 404) {
        throw new AppError(`Jira project '${projectKey}' was not found.`, 404, 'JIRA_PROJECT_NOT_FOUND');
      }
      throw new AppError(`Jira issue creation failed: ${detail}`, response.status, 'JIRA_CREATE_FAILED');
    }

    const data = await response.json();
    const issueKey = data.key;
    const issueId = String(data.id);
    const issueUrl = `${baseUrl}/browse/${issueKey}`;

    return {
      issueKey,
      issueId,
      issueUrl,
    };
  }

  /**
   * Maps internal CMS priority to standard Jira Cloud priority
   */
  private static mapPriorityToJira(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'Highest';
      case 'HIGH':
        return 'High';
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
      default:
        return 'Medium';
    }
  }

  /**
   * Formats sanitized complaint details for Jira (strictly operational data, no sensitive student credentials)
   */
  private static formatJiraDescription(complaint: ComplaintJiraPayload): string {
    const loc = complaint.location || `${complaint.block}, ${complaint.room}`;
    const lines = [
      `*Complaint Reference:* ${complaint.complaintId}`,
      `*Category:* ${complaint.category}`,
      `*Department Assigned:* ${complaint.department}`,
      `*Severity Priority:* ${complaint.priority}`,
      `*Campus Location:* ${loc}`,
      complaint.slaTargetHours ? `*Resolution SLA:* ${complaint.slaTargetHours} Hours` : '',
      '',
      '*Complaint Details:*',
      complaint.description,
      '',
      '----',
      '_Automated grievance synchronization generated by College Complaint Management System_'
    ];

    return lines.filter(Boolean).join('\n');
  }
}
