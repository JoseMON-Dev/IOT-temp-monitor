import { injectable, inject } from 'inversify';
import twilio from 'twilio';
import { ConfigService } from './config.service';
import { TYPES } from '../ioc/container';

@injectable()
export class NotificationService{
  private twilioClient: twilio.Twilio | null = null;

  constructor(
    @inject(TYPES.ConfigService) private configService: ConfigService
  ) {
    this.initTwilioClient();
  }

  /**
   * Initialize the Twilio client for SMS
   */
  private initTwilioClient(): void {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get('TWILIO_FROM_NUMBER');
      
      if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio configuration incomplete, SMS notifications will be disabled');
        return;
      }

      this.twilioClient = twilio(accountSid, authToken);
      console.log('SMS service ready');
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }

  /**
   * Send an SMS notification
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.warn('SMS service not configured');
      return false;
    }

    try {
      const fromNumber = this.configService.get('TWILIO_FROM_NUMBER');
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber
      });

      console.log('SMS sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}
