export const signUpValidate = (req, res, next) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email không hợp lệ" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Độ dài mật khẩu tối thiểu 6 ký tự" });
  }
  next();
};
