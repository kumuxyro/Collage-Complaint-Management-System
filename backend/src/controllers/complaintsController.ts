import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService.ts';

export class ComplaintsController {
  public static async createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const complaint = await ComplaintService.createComplaint(user, req.body);
      res.status(201).json({
        success: true,
        data: complaint,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { status, category, priority, search } = req.query;
      const complaints = await ComplaintService.getComplaints(user, {
        status: status as string | undefined,
        category: category as string | undefined,
        priority: priority as string | undefined,
        search: search as string | undefined,
      });
      res.status(200).json({
        success: true,
        data: complaints,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getComplaintById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { complaintId } = req.params;
      const complaint = await ComplaintService.getComplaintById(user, complaintId);
      res.status(200).json({
        success: true,
        data: complaint,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async claimComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { complaintId } = req.params;
      const updated = await ComplaintService.claimComplaint(user, complaintId);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { complaintId } = req.params;
      const { status, reason, resolutionSummary } = req.body;
      const reasonOrSummary = reason || resolutionSummary;
      const updated = await ComplaintService.updateStatus(user, complaintId, status, reasonOrSummary);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async syncToJira(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { complaintId } = req.params;
      const result = await ComplaintService.syncComplaintToJira(user, complaintId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
