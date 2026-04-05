import { emailService } from './email.service.js';
import { emailTemplates } from './emailTemplates.service.js';
import { PrescriptionModel } from '../modules/prescriptions/prescription.model.js';

class PrescriptionReminderService {
  toMinutes(timeString) {
    if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
      return null;
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  getTodayAndCurrentMinutes() {
    const now = new Date();
    return {
      now,
      today: now.toISOString().slice(0, 10),
      currentMinutes: (now.getHours() * 60) + now.getMinutes(),
    };
  }

  isMedicineActiveForDay({ prescriptionCreatedAt, durationDays, todayDate }) {
    const createdDate = new Date(prescriptionCreatedAt);
    const today = new Date(`${todayDate}T00:00:00.000Z`);
    const elapsedDays = Math.floor((today - new Date(createdDate.toISOString().slice(0, 10))) / (24 * 60 * 60 * 1000));
    return elapsedDays >= 0 && elapsedDays < Number(durationDays || 0);
  }

  /**
   * Check prescriptions daily and send reminders/missed alerts
   * This should be called from a scheduler (e.g., every hour or daily)
   */
  async processPrescriptionReminders() {
    try {
      const { today, currentMinutes } = this.getTodayAndCurrentMinutes();

      // Find all active prescriptions
      const prescriptions = await PrescriptionModel.find({
        createdAt: { $exists: true },
      })
        .populate('patientId', 'email name')
        .populate('doctorId', 'name')
        .lean();

      for (const prescription of prescriptions) {
        if (!prescription.patientId) continue;

        const patient = prescription.patientId;

        for (let medicineIdx = 0; medicineIdx < prescription.medicines.length; medicineIdx++) {
          const medicine = prescription.medicines[medicineIdx];
          const withinDuration = this.isMedicineActiveForDay({
            prescriptionCreatedAt: prescription.createdAt,
            durationDays: medicine.durationDays,
            todayDate: today,
          });

          if (!withinDuration) {
            continue;
          }

          const scheduledMinutes = this.toMinutes(medicine.time || '09:00');
          if (scheduledMinutes === null) {
            continue;
          }

          // Check if there's already an adherence record for today
          let todayAdherence = medicine.adherence?.find((a) => a.date === today);

          if (!todayAdherence) {
            // Initialize adherence record for today
            await PrescriptionModel.findByIdAndUpdate(
              prescription._id,
              {
                $push: {
                  [`medicines.${medicineIdx}.adherence`]: {
                    date: today,
                    taken: null,
                    missedAlert: false,
                    reminderSent: false,
                  },
                },
              },
              { new: true }
            );

            todayAdherence = {
              date: today,
              taken: null,
              missedAlert: false,
              reminderSent: false,
            };
          }

          const isReminderWindow = currentMinutes >= scheduledMinutes && currentMinutes < (scheduledMinutes + 60);
          const isMissedWindow = currentMinutes >= (scheduledMinutes + 120);

          if (isReminderWindow && !todayAdherence.reminderSent) {
            await this.sendPrescriptionReminder(patient, prescription, medicine, medicineIdx);
          } else if (isMissedWindow && todayAdherence.taken !== true && !todayAdherence.missedAlert) {
            // Send missed alert
            await this.sendMissedPrescriptionAlert(patient, prescription, medicine, todayAdherence);

            // Mark alert as sent
            await PrescriptionModel.findByIdAndUpdate(
              prescription._id,
              {
                $set: {
                  [`medicines.${medicineIdx}.adherence.$[elem].missedAlert`]: true,
                },
              },
              {
                arrayFilters: [{ 'elem.date': today }],
                new: true,
              }
            );
          }
        }
      }

      return { success: true, message: 'Prescription reminders processed' };
    } catch (error) {
      console.error('Error processing prescription reminders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminder email for upcoming medicine dose
   */
  async sendPrescriptionReminder(patient, prescription, medicine, medicineIdx) {
    try {
      const { today } = this.getTodayAndCurrentMinutes();
      const currentTime = medicine.time || new Date().toLocaleTimeString('en-US', { hour12: false });

      const template = emailTemplates.prescriptionReminder({
        patientName: patient.name,
        medicineName: medicine.medicine,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        durationDays: medicine.durationDays,
        currentTime,
        prescriptionId: prescription.prescriptionId,
      });

      emailService.queue({
        to: patient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Mark reminder as sent
      await PrescriptionModel.findByIdAndUpdate(
        prescription._id,
        {
          $set: {
            [`medicines.${medicineIdx}.adherence.$[elem].reminderSent`]: true,
          },
        },
        {
          arrayFilters: [{ 'elem.date': today }],
          new: true,
        }
      );

      console.log(`Reminder sent to ${patient.email} for ${medicine.medicine}`);
    } catch (error) {
      console.error('Error sending prescription reminder:', error);
    }
  }

  /**
   * Send alert for missed medicine dose
   */
  async sendMissedPrescriptionAlert(patient, prescription, medicine, adherence) {
    try {
      const template = emailTemplates.missedPrescriptionAlert({
        patientName: patient.name,
        medicineName: medicine.medicine,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        missedDate: adherence.date,
        prescriptionId: prescription.prescriptionId,
        doctorName: prescription.doctorId?.name || 'Your Doctor',
      });

      emailService.queue({
        to: patient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Missed alert sent to ${patient.email} for ${medicine.medicine}`);
    } catch (error) {
      console.error('Error sending missed prescription alert:', error);
    }
  }

  /**
   * Generate PDF prescription
   */
  async generatePrescriptionPDF(prescriptionId) {
    try {
      const prescription = await PrescriptionModel.findOne({ prescriptionId })
        .populate('patientId', 'name email')
        .populate('doctorId', 'name specialization qualification')
        .lean();

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Import PDFKit
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50 });

      // Add header
      doc.fontSize(20).font('Helvetica-Bold').text('MEDICAL PRESCRIPTION', { align: 'center' });
      doc.moveDown();

      // Add patient info
      doc.fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${prescription.patientId.name}`);
      doc.text(`Email: ${prescription.patientId.email}`);
      doc.moveDown();

      // Add doctor info
      doc.fontSize(12).font('Helvetica-Bold').text('DOCTOR INFORMATION', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${prescription.doctorId.name}`);
      doc.text(`Specialization: ${prescription.doctorId.specialization}`);
      doc.text(`Qualification: ${prescription.doctorId.qualification}`);
      doc.moveDown();

      // Add diagnosis
      doc.fontSize(12).font('Helvetica-Bold').text('DIAGNOSIS', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(prescription.diagnosis, { align: 'left' });
      doc.moveDown();

      // Add medicines
      doc.fontSize(12).font('Helvetica-Bold').text('MEDICINES', { underline: true });
      doc.fontSize(10).font('Helvetica');

      prescription.medicines.forEach((medicine, index) => {
        doc.text(`${index + 1}. ${medicine.medicine}`, { underline: true });
        doc.text(`   Dosage: ${medicine.dosage}`);
        doc.text(`   Frequency: ${medicine.frequency}`);
        doc.text(`   Duration: ${medicine.durationDays} days`);
        if (medicine.notes) {
          doc.text(`   Notes: ${medicine.notes}`);
        }
        doc.moveDown(0.5);
      });

      // Add advice
      if (prescription.advice) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('DOCTOR\'S ADVICE', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(prescription.advice);
      }

      // Add footer
      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica').text(
        `Generated on: ${new Date().toLocaleDateString()} | Prescription ID: ${prescriptionId}`,
        { align: 'center', color: '#999999' }
      );

      // Return as buffer
      return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      });
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      throw error;
    }
  }
}

export const prescriptionReminderService = new PrescriptionReminderService();
