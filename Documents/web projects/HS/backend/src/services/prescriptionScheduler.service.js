import { prescriptionReminderService } from './prescriptionReminder.service.js';

class PrescriptionSchedulerService {
  constructor() {
    this.schedulerRunning = false;
    this.lastRunTime = null;
  }

  /**
   * Start prescription reminder scheduler
   * Runs every hour to check prescriptions and send reminders/missed alerts
   */
  start() {
    if (this.schedulerRunning) {
      console.log('Prescription scheduler is already running');
      return;
    }

    this.schedulerRunning = true;
    console.log('✅ Prescription reminder scheduler started');

    // Run immediately on startup
    this.runCheck();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Run a reminder check
   */
  async runCheck() {
    try {
      this.lastRunTime = new Date();
      console.log(`[${this.lastRunTime.toISOString()}] Running prescription reminder check...`);

      const result = await prescriptionReminderService.processPrescriptionReminders();

      if (result.success) {
        console.log(`✅ Prescription reminders processed at ${this.lastRunTime.toISOString()}`);
      } else {
        console.error(`❌ Error processing reminders: ${result.error}`);
      }
    } catch (error) {
      console.error('Fatal error in prescription scheduler:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.schedulerRunning = false;
      console.log('✅ Prescription reminder scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.schedulerRunning,
      lastRun: this.lastRunTime,
      nextRun: this.schedulerRunning ? new Date(Date.now() + 60 * 60 * 1000) : null,
    };
  }

  /**
   * Manual trigger for testing
   */
  async manualTrigger() {
    console.log('🔄 Manual prescription reminder trigger...');
    await this.runCheck();
  }
}

export const prescriptionSchedulerService = new PrescriptionSchedulerService();
