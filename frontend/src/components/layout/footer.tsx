import { Check, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-[#0a2138] text-slate-300">
      <div className="mx-auto max-w-7xl px-5 pb-5 pt-10 sm:px-8">
        <div className="grid gap-9 pb-8 sm:grid-cols-2 lg:grid-cols-[1.8fr_0.8fr_1fr_1.2fr]">
          <div>
            <img
              src="/Grestate_Logo_Vector_Transparent.svg"
              alt="Grestate Logo"
              className="w-44 h-auto"
            />

            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Grestate là nền tảng bất động sản uy tín, giúp bạn dễ dàng tìm
              kiếm, đăng tin và kết nối với người có nhu cầu.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="size-4" />
              Kết nối tin cậy, an cư bền vững
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">
              Liên kết nhanh
            </h2>
            <ul className="space-y-2 text-sm">
              {[
                ["Trang chủ", "#"],
                ["Mua bán", "#search"],
                ["Cho thuê", "#search"],
                ["Dự án", "#projects"],
                ["Tin tức", "#news"],
                ["Liên hệ", "#contact"],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Hỗ trợ</h2>
            <ul className="space-y-2 text-sm">
              {[
                "Hướng dẫn sử dụng",
                "Câu hỏi thường gặp",
                "Quy định đăng tin",
                "Chính sách bảo mật",
                "Điều khoản sử dụng",
              ].map((label) => (
                <li key={label}>
                  <button type="button" className="text-left hover:text-white">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Liên hệ</h2>
            <address className="space-y-3 text-sm not-italic">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                123 Đường 2/9, Quận Hải Châu, Đà Nẵng
              </p>
              <a
                href="tel:0123456789"
                className="flex items-center gap-3 hover:text-white"
              >
                <Phone className="size-4 text-emerald-400" />
                0123 456 789
              </a>
              <a
                href="mailto:support@grestate.vn"
                className="flex items-center gap-3 hover:text-white"
              >
                <Mail className="size-4 text-emerald-400" />
                support@grestate.vn
              </a>
            </address>
            <p className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
              <Check className="size-3" />
              Thông tin liên hệ minh họa
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Grestate. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
