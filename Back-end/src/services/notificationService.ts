// ─────────────────────────────────────────────────────────────────────────────
// Notification Service
// Replace the console.log stubs with your real provider of choice:
//   WhatsApp / SMS → Termii (termii.com) or Africa's Talking
//   Email          → Nodemailer + Gmail SMTP, or Resend (resend.com)
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationParams {
  email: string;
  subject?: string;
  message: string;
}

export async function notifyCustomer(params: NotificationParams): Promise<void> {
  console.log(
    `[notify] To: ${params.email} | Subject: ${params.subject || "Payment Update"} | Message: ${params.message}`
  );

  // --- TERMII SMS EXAMPLE (uncomment and install termii SDK when ready) ---
  // await termii.sendSms({ to: params.phone, sms: params.message, type: "plain", channel: "generic" });

  // --- TWILIO WHATSAPP EXAMPLE ---
  // await twilioClient.messages.create({
  //   from: "whatsapp:+14155238886",
  //   to: `whatsapp:${params.phone}`,
  //   body: params.message,
  // });

  // --- RESEND EMAIL EXAMPLE ---
  // await resend.emails.send({
  //   from: "RecoverPay <noreply@recoverpay.com>",
  //   to: params.email,
  //   subject: params.subject || "Payment Update",
  //   text: params.message,
  // });
}
