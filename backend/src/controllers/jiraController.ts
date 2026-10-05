import { Request, Response, NextFunction } from 'express';
import { JiraService } from '../services/jiraService.ts';

export class JiraController {
  /**
   * Health and configuration inspection endpoint (safe, non-sensitive)
   */
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    const status = JiraService.getConfigurationStatus();
    res.status(200).json({
      status: 'ok',
      configured: status.configured,
      baseUrl: status.baseUrl,
      projectKey: status.projectKey,
    });
  }

  /**
   * Tests connection, credentials, and project visibility with Jira Cloud
   */
  public static async testConnection(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await JiraService.testConnection();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
