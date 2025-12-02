const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  }
});

const sendInvoiceEmail = async (to, transaction) => {
  const { invoice_number, unique_code, total_transfer, payment_deadline, items } = transaction;

  const itemsList = items.map(item =>
    `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x${item.quantity} - <strong>Rp ${item.price.toLocaleString('id-ID')}</strong></li>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🐟 Fishit Marketplace</h1>
                <p style="color: #e0f2fe; margin: 10px 0 0 0;">Invoice Pembayaran</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <h2 style="color: #0891b2; margin: 0 0 20px 0;">Invoice #${invoice_number}</h2>
                <p style="color: #64748b; margin: 0 0 20px 0;">Terima kasih atas pesanan Anda! Silakan selesaikan pembayaran sesuai detail di bawah ini.</p>
                
                <!-- Payment Info Box -->
                <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 25px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #e0f2fe; margin: 0 0 10px 0; font-size: 14px;">Total Transfer (Jumlah Pasti)</p>
                    <p style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Rp ${total_transfer.toLocaleString('id-ID')}</p>
                    <p style="color: #e0f2fe; margin: 15px 0 5px 0; font-size: 13px;">Kode Unik: <strong style="color: #ffffff;">${unique_code}</strong></p>
                </div>

                <!-- Deadline Warning -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>⏰ Batas Waktu Pembayaran:</strong><br>
                        <span style="font-size: 16px; font-weight: bold;">${new Date(payment_deadline).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</span>
                    </p>
                </div>

                <!-- Order Details -->
                <h3 style="color: #0f172a; margin: 30px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #0891b2;">📦 Detail Pesanan</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${itemsList}
                </ul>

                <!-- Important Notice -->
                <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>⚠️ PENTING:</strong> Transfer dengan jumlah <strong>PERSIS</strong> sesuai total di atas (termasuk kode unik) agar sistem kami dapat memverifikasi pembayaran Anda secara otomatis.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    Email ini dikirim otomatis dari <strong>Fishit Marketplace</strong><br>
                    Jika ada pertanyaan, silakan hubungi customer service kami.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

  try {
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
      return false;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER;

    const mailOptions = {
      from: {
        name: 'Fishit Marketplace',
        address: senderEmail
      },
      to: to,
      replyTo: senderEmail,
      subject: `Invoice ${invoice_number} - Fishit Marketplace`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};

module.exports = { sendInvoiceEmail };
