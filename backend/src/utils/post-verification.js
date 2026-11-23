export const latestVerification = {
  orderBy: { maYeuCau: "desc" },
  take: 1,
  select: { trangThai: true, phienBanTinLucGui: true },
};

export const isVerifiedPost = (post, latest) =>
  post.trangThai === "DA_DUYET" &&
  latest?.trangThai === "DA_XAC_THUC" &&
  latest.phienBanTinLucGui === post.phienBanXacThuc;

export const verificationFields = {
  trangThai: true,
  phienBanXacThuc: true,
  yeuCauXacThucs: latestVerification,
};

export const withVerification = ({ yeuCauXacThucs, ...post }) => ({
  ...post,
  daXacThuc: isVerifiedPost(post, yeuCauXacThucs[0]),
});
