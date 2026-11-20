import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const verifyEmailOTP = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Grestate <onboarding@resend.dev>",
      to: email,
      subject: "Mã OTP xác thực tài khoản",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Yêu cầu xác thực tài khoản</h2>

          <p>Chúng tôi đã nhận được yêu cầu xác thực cho tài khoản của bạn.</p>

          <p><strong>Mã OTP của bạn là:</strong></p>

          <h1 style="letter-spacing:5px;color:#6b21a8;">
            ${otp}
          </h1>

          <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>

          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>

          <hr />

          <p style="font-size:12px;color:gray;">
            Đây là email tự động, vui lòng không trả lời.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Send OTP email error:", error);
    throw error;
  }
};
