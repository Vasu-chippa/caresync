export const emailTemplates = {
  otp({ title, otp, expiresInMinutes }) {
    return {
      subject: `${title} - One-Time Password`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
          <h2 style="margin-bottom: 8px;">${title}</h2>
          <p>Your one-time password is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</p>
          <p>This code expires in ${expiresInMinutes} minutes and can be used only once.</p>
          <p>If you did not request this, please ignore this message.</p>
        </div>
      `,
      text: `${title}\nYour OTP is ${otp}. It expires in ${expiresInMinutes} minutes and can be used only once.`,
    };
  },

  prescriptionReminder({ patientName, medicineName, dosage, frequency, durationDays, currentTime, prescriptionId }) {
    return {
      subject: `💊 Medication Reminder: Time to take ${medicineName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
          <h2 style="color: #0891b2; margin-bottom: 8px;">💊 Medication Reminder</h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>It's time to take your prescribed medication:</p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #0891b2; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px;"><strong>${medicineName}</strong></p>
            <p style="margin: 8px 0; color: #0854a3;">Dosage: ${dosage}</p>
            <p style="margin: 8px 0; color: #0854a3;">Frequency: ${frequency}</p>
            <p style="margin: 8px 0; color: #0854a3;">Duration: ${durationDays} day(s)</p>
          </div>
          <p>Please ensure you take this medication as prescribed to maintain your health.</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
            Prescription ID: ${prescriptionId}<br/>
            Reminder sent at: ${currentTime}
          </p>
        </div>
      `,
      text: `Medication Reminder\n\nHi ${patientName},\n\nIt's time to take: ${medicineName}\nDosage: ${dosage}\nFrequency: ${frequency}\nDuration: ${durationDays} day(s)\n\nPlease take your medication as prescribed.`,
    };
  },

  missedPrescriptionAlert({ patientName, medicineName, dosage, frequency, missedDate, prescriptionId, doctorName }) {
    return {
      subject: `⚠️ Alert: You missed your medication - ${medicineName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
          <h2 style="color: #ea580c; margin-bottom: 8px;">⚠️ Missed Medication Alert</h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>We noticed you haven't taken your prescribed medication:</p>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px;"><strong>${medicineName}</strong></p>
            <p style="margin: 8px 0; color: #9a3412;">Dosage: ${dosage}</p>
            <p style="margin: 8px 0; color: #9a3412;">Frequency: ${frequency}</p>
            <p style="margin: 8px 0; color: #9a3412;">Missed on: ${missedDate}</p>
          </div>
          <p>It's important to follow your medication schedule as prescribed by <strong>${doctorName}</strong> for your health and recovery.</p>
          <p><strong>Please take this medication as soon as possible</strong> if you haven't already taken it today.</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
            Prescription ID: ${prescriptionId}<br/>
            Alert time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `Missed Medication Alert\n\nHi ${patientName},\n\nYou missed taking: ${medicineName}\nDosage: ${dosage}\nFrequency: ${frequency}\nMissed on: ${missedDate}\n\nPlease take your medication as soon as possible.`,
    };
  },

  appointmentBookedForDoctor({ doctorName, patientName, date, timeSlot, appointmentId, priority }) {
    const priorityText = priority === 'emergency' ? 'Emergency' : 'Normal';

    return {
      subject: `New Appointment Booked (${date} ${timeSlot})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px;">
          <h2 style="color: #0e7490; margin-bottom: 8px;">New Appointment Booking</h2>
          <p>Hi Dr. <strong>${doctorName}</strong>,</p>
          <p>A patient has booked an appointment in your schedule.</p>
          <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 14px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0 0 6px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 0 0 6px 0;"><strong>Patient:</strong> ${patientName}</p>
            <p style="margin: 0 0 6px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0 0 6px 0;"><strong>Time:</strong> ${timeSlot}</p>
            <p style="margin: 0;"><strong>Priority:</strong> ${priorityText}</p>
          </div>
          <p>Please review this appointment from your doctor portal.</p>
        </div>
      `,
      text: `New Appointment Booking\n\nDr. ${doctorName}, a patient booked an appointment.\nAppointment ID: ${appointmentId}\nPatient: ${patientName}\nDate: ${date}\nTime: ${timeSlot}\nPriority: ${priorityText}`,
    };
  },

  appointmentDecisionForPatient({ patientName, doctorName, appointmentId, date, timeSlot, action, appointmentFee = 0, currency = 'INR' }) {
    const accepted = action === 'accept';
    const completed = action === 'complete';

    return {
      subject: accepted
        ? `Appointment Accepted (${date} ${timeSlot})`
        : completed
          ? `Appointment Completed (${date} ${timeSlot})`
          : `Appointment Rejected (${date} ${timeSlot})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px;">
          <h2 style="color: ${accepted || completed ? '#0f766e' : '#b91c1c'}; margin-bottom: 8px;">
            Appointment ${accepted ? 'Accepted' : completed ? 'Completed' : 'Rejected'}
          </h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment has been <strong>${accepted ? 'accepted' : completed ? 'completed' : 'rejected'}</strong> by Dr. ${doctorName}.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid ${accepted || completed ? '#0f766e' : '#b91c1c'}; padding: 14px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0 0 6px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 0 0 6px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0 0 6px 0;"><strong>Time:</strong> ${timeSlot}</p>
            ${accepted ? `<p style="margin: 0;"><strong>Payment:</strong> Please complete payment of ${appointmentFee} ${currency} from your billing section.</p>` : ''}
          </div>
          <p>${accepted ? 'Please complete payment to confirm your consultation with the platform.' : completed ? 'Thank you for attending. You can now submit your rating for this doctor from your appointments page.' : 'Please book another available slot from your patient portal.'}</p>
        </div>
      `,
      text: `Appointment ${accepted ? 'Accepted' : completed ? 'Completed' : 'Rejected'}\n\nHi ${patientName}, your appointment ${appointmentId} (${date} ${timeSlot}) has been ${accepted ? 'accepted' : completed ? 'completed' : 'rejected'} by Dr. ${doctorName}.${accepted ? ` Payment due: ${appointmentFee} ${currency}.` : ''}`,
    };
  },

  appointmentDecisionForDoctor({ doctorName, patientName, appointmentId, date, timeSlot, action }) {
    const accepted = action === 'accept';
    const completed = action === 'complete';

    return {
      subject: accepted
        ? `Appointment Accepted Confirmation (${date} ${timeSlot})`
        : completed
          ? `Appointment Completed Confirmation (${date} ${timeSlot})`
          : `Appointment Rejected Confirmation (${date} ${timeSlot})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px;">
          <h2 style="color: ${accepted || completed ? '#0f766e' : '#b91c1c'}; margin-bottom: 8px;">
            Appointment ${accepted ? 'Accepted' : completed ? 'Completed' : 'Rejected'}
          </h2>
          <p>Hi Dr. <strong>${doctorName}</strong>,</p>
          <p>You have <strong>${accepted ? 'accepted' : completed ? 'completed' : 'rejected'}</strong> the following appointment.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid ${accepted || completed ? '#0f766e' : '#b91c1c'}; padding: 14px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0 0 6px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 0 0 6px 0;"><strong>Patient:</strong> ${patientName}</p>
            <p style="margin: 0 0 6px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0;"><strong>Time:</strong> ${timeSlot}</p>
          </div>
          <p>This is an automated record for your appointment workflow.</p>
        </div>
      `,
      text: `Appointment ${accepted ? 'Accepted' : completed ? 'Completed' : 'Rejected'}\n\nDr. ${doctorName}, appointment ${appointmentId} for patient ${patientName} on ${date} ${timeSlot} has been marked as ${accepted ? 'accepted' : completed ? 'completed' : 'rejected'}.`,
    };
  },
};
