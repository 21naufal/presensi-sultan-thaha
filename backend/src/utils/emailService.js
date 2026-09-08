const nodemailer = require("nodemailer");

// Buat transporter (pengirim email)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Kode OTP Reset Password - Presensi Sultan Thaha",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background-color: #0984E3;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .otp-box {
            background-color: #f0f8ff;
            border: 2px dashed #0984E3;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #0984E3;
            letter-spacing: 8px;
            display: inline-block;
          }
          .info {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Password</h1>
            <p>Sistem Presensi Bandara Sultan Thaha</p>
          </div>
          
          <div class="content">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode OTP berikut untuk melanjutkan:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="info">
              <strong>⚠️ Penting:</strong><br>
              • Kode OTP berlaku selama <strong>5 menit</strong><br>
              • Jangan berikan kode ini kepada siapapun<br>
              • Jika Anda tidak meminta reset password, abaikan email ini
            </div>
            
            <p>Terima kasih,<br>Tim IT Presensi Sultan Thaha</p>
          </div>
          
          <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            <p>&copy; ${new Date().getFullYear()} Bandara Sultan Thaha Jambi</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email OTP berhasil dikirim ke ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error mengirim email:", error);
    return { success: false, error: error.message };
  }
};
