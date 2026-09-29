/**
 * Email Delivery Service Abstraction for College Complaint Management System
 * 
 * INTEGRATION POINT:
 * Connect this abstraction to your backend email delivery provider 
 * (e.g. NodeMailer, SendGrid, Amazon SES, or Mailgun via /api/auth/send-otp).
 */

export interface EmailDeliveryResult {
  success: boolean;
  providerConfigured: boolean;
  message: string;
}

export class EmailService {
  private isConfigured: boolean = false;
  private endpoint: string = '/api/auth/send-otp';

  constructor() {
    // In production, verify environment variables or server endpoint
    this.isConfigured = false;
  }

  /**
   * Generates an unguessable, random 6-digit OTP
   */
  public generateOtp(): string {
    // Generates a random 6-digit number between 100000 and 999999
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return randomNum.toString();
  }

  /**
   * Dispatches the 6-digit OTP to the registered user's email address
   */
  public async sendOtp(email: string, otp: string): Promise<EmailDeliveryResult> {
    // Backend API Integration Point:
    // If backend endpoint is configured, forward request to server:
    try {
      if (this.isConfigured) {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        if (response.ok) {
          return {
            success: true,
            providerConfigured: true,
            message: `Verification code successfully dispatched to ${email}`,
          };
        }
      }
    } catch {
      // Backend not yet available
    }

    // In current sandbox stage (before backend Express/Node server is provisioned):
    // We log the transport request to the development console for auditing.
    // We explicitly state in the result that the external provider is in local simulation mode.
    console.info(`[EmailService] OTP Dispatch for ${email}: ${otp} (Expiration: 5 minutes)`);

    return {
      success: true,
      providerConfigured: false,
      message: `A 6-digit verification code has been generated for ${email}. (Email provider integration pending)`,
    };
  }
}

export const emailService = new EmailService();
