import {
  latestVerification,
  isVerifiedPost,
  withVerification,
} from "../utils/post-verification.js";
import prisma from "../libs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadPostFromBuffer } from "../middlewares/uploadPost.middleware.js";

const visiblePosts = { deletedAt: null, trangThai: "DA_DUYET" };
const publicAuthor = {
  maNguoiDung: true,
  hoTen: true,
  soDienThoai: true,
  anhDaiDienUrl: true,
  duongDanZalo: true,
  createdAt: true,
};

const fetchPostList = async (
  res,
  where,
  includeVerification = false,
  author,
) => {
  try {
    const records = await prisma.tinDang.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { maTinDang: "desc" }],
      include: {
        yeuCauXacThucs: includeVerification
          ? {
              ...latestVerification,
              select: {
                ...latestVerification.select,
                maYeuCau: true,
                lyDoXuLy: true,
              },
            }
          : latestVerification,
        nguoiDang: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            soDienThoai: true,
            anhDaiDienUrl: true,
            duongDanZalo: true,
          },
        },
        loaiBatDongSan: {
          select: { maLoaiBatDongSan: true, tenLoai: true },
        },
        giayToPhapLy: {
          select: { maGiayTo: true, tenGiayTo: true },
        },
        phuongXa: {
          select: {
            maPhuongXa: true,
            tenPhuongXa: true,
            maTinhThanh: true,
            tinhThanh: {
              select: { maTinhThanh: true, tenTinhThanh: true },
            },
          },
        },
        hinhAnhTinDangs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
          select: {
            maHinhAnh: true,
            hinhAnhUrl: true,
            thuTuHienThi: true,
            laAnhDaiDien: true,
          },
        },
      },
    });

    const posts = records.map(({ yeuCauXacThucs, ...post }) => ({
      daXacThuc: isVerifiedPost(post, yeuCauXacThucs[0]),
      ...(includeVerification && {
        xacThuc:
          yeuCauXacThucs[0]?.trangThai === "CHO_XU_LY" ||
          yeuCauXacThucs[0]?.phienBanTinLucGui === post.phienBanXacThuc
            ? yeuCauXacThucs[0]
            : null,
      }),
      ...post,
      giaNiemYet: Number(post.giaNiemYet),
      dienTich: Number(post.dienTich),
      matTien: post.matTien === null ? null : Number(post.matTien),
      matDuong: post.matDuong === null ? null : Number(post.matDuong),
      viDo: post.viDo === null ? null : Number(post.viDo),
      kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
      anhDaiDienUrl:
        post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)?.hinhAnhUrl ??
        post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
        null,
    }));

    return res.status(200).json({ posts, total: posts.length, author });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy danh sách tin đăng thất bại" });
  }
};

export const fetchPost = (req, res) =>
  fetchPostList(res, { deletedAt: null, trangThai: "DA_DUYET" });

export const fetchPostsByUser = (req, res) =>
  fetchPostList(
    res,
    {
      maNguoiDung: req.user.maNguoiDung,
      deletedAt: null,
    },
    true,
  );

async function withProfilePath(author) {
  const first = await prisma.nguoiDung.findFirst({
    where: { hoTen: author.hoTen, deletedAt: null },
    orderBy: { maNguoiDung: "asc" },
    select: { maNguoiDung: true },
  });
  let path = author.hoTen.replace(
    /[^\p{L}\p{M}\p{N} ._-]/gu,
    (char) => `~${char.codePointAt(0).toString(16)}~`,
  );
  if (!path || /^\d+$|^\.{1,2}$/.test(path)) path = `~n${path}`;
  if (first?.maNguoiDung !== author.maNguoiDung)
    path += `~u${author.maNguoiDung}`;
  return { ...author, profilePath: path };
}

export const fetchPostsByUserPublic = async (req, res) => {
  const path = req.params.profilePath;
  const id = /^\d+$/.test(path) ? path : path.match(/~u(\d+)$/)?.[1];
  if (id && (!Number.isSafeInteger(Number(id)) || Number(id) <= 0)) {
    return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
  }
  try {
    const name = path
      .replace(/^~n/, "")
      .replace(/~([0-9a-f]{1,6})~/g, (match, hex) =>
        parseInt(hex, 16) <= 0x10ffff
          ? String.fromCodePoint(parseInt(hex, 16))
          : match,
      );
    const author = await prisma.nguoiDung.findFirst({
      where: {
        ...(id ? { maNguoiDung: Number(id) } : { hoTen: name }),
        deletedAt: null,
      },
      orderBy: { maNguoiDung: "asc" },
      select: publicAuthor,
    });
    if (!author)
      return res.status(404).json({ message: "Không tìm thấy người đăng" });
    return fetchPostList(
      res,
      { ...visiblePosts, maNguoiDung: author.maNguoiDung },
      false,
      await withProfilePath(author),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể tải trang cá nhân" });
  }
};
export const fetchDetailPost = async (req, res) => {
  const id = Number(req.params.maTinDang);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
  }

  try {
    const record = await prisma.tinDang.findFirst({
      where: { maTinDang: id, deletedAt: null, trangThai: "DA_DUYET" },
      include: {
        yeuCauXacThucs: latestVerification,
        nguoiDang: {
          select: {
            ...publicAuthor,
            _count: { select: { tinDangs: { where: visiblePosts } } },
          },
        },
        loaiBatDongSan: {
          select: { maLoaiBatDongSan: true, tenLoai: true },
        },
        giayToPhapLy: {
          select: { maGiayTo: true, tenGiayTo: true },
        },
        phuongXa: {
          select: {
            maPhuongXa: true,
            tenPhuongXa: true,
            maTinhThanh: true,
            tinhThanh: {
              select: { maTinhThanh: true, tenTinhThanh: true },
            },
          },
        },
        hinhAnhTinDangs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
          select: {
            maHinhAnh: true,
            hinhAnhUrl: true,
            thuTuHienThi: true,
            laAnhDaiDien: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    }

    const post = withVerification(record);

    return res.status(200).json({
      post: {
        ...post,
        nguoiDang: await withProfilePath(post.nguoiDang),
        giaNiemYet: Number(post.giaNiemYet),
        dienTich: Number(post.dienTich),
        matTien: post.matTien === null ? null : Number(post.matTien),
        matDuong: post.matDuong === null ? null : Number(post.matDuong),
        viDo: post.viDo === null ? null : Number(post.viDo),
        kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
        anhDaiDienUrl:
          post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)
            ?.hinhAnhUrl ??
          post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
          null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy tin đăng thất bại" });
  }
};

export const createPost = async (req, res) => {
  const uploadedImages = [];
  let uploadedVideo;
  let post;
  try {
    for (const file of req.files) {
      const result = await uploadPostFromBuffer(file.buffer);
      if (result?.public_id) uploadedImages.push(result);
      if (!result?.public_id || !result?.secure_url)
        throw new Error("Cloudinary trả về thông tin hình ảnh không hợp lệ");
    }
    if (req.postVideo) {
      uploadedVideo = await uploadPostFromBuffer(req.postVideo.buffer, {
        resource_type: "video",
        allowed_formats: ["mp4", "webm"],
      });
      if (!uploadedVideo?.public_id || !uploadedVideo.secure_url) {
        throw new Error("Cloudinary trả về thông tin video không hợp lệ");
      }
    }
    post = await prisma.tinDang.create({
      data: {
        ...req.postData,
        videoUrl: uploadedVideo?.secure_url ?? null,
        videoId: uploadedVideo?.public_id ?? null,
        maNguoiDung: req.user.maNguoiDung,
        trangThai: "CHO_KIEM_DUYET",
        hinhAnhTinDangs: {
          create: uploadedImages.map((image, index) => ({
            hinhAnhUrl: image.secure_url,
            hinhAnhId: image.public_id,
            thuTuHienThi: index,
            laAnhDaiDien: index === 0,
          })),
        },
      },
      include: { hinhAnhTinDangs: { orderBy: { thuTuHienThi: "asc" } } },
    });
  } catch (error) {
    console.error(error);
    const assets = uploadedImages.map(image => ({ id: image.public_id, type: "image" }));
    if (uploadedVideo?.public_id) assets.push({ id: uploadedVideo.public_id, type: "video" });
    const cleanup = await Promise.allSettled(assets.map(asset =>
      cloudinary.uploader.destroy(asset.id, { resource_type: asset.type })
    ));
    cleanup.forEach((result, index) => {
      if (result.status === "rejected" || !["ok", "not found"].includes(result.value?.result)) {
        console.error("Không thể xóa tệp của tin đăng", assets[index].id, result);
      }
    });
    return res
      .status(500)
      .json({ message: "Không thể tạo tin đăng. Vui lòng thử lại." });
  }
  return res.status(201).json({
    message: "Tin đăng được tạo thành công và đang chờ kiểm duyệt",
    post: {
      ...post,
      giaNiemYet: Number(post.giaNiemYet),
      dienTich: Number(post.dienTich),
      matTien: post.matTien === null ? null : Number(post.matTien),
      matDuong: post.matDuong === null ? null : Number(post.matDuong),
      viDo: post.viDo === null ? null : Number(post.viDo),
      kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
    },
  });
};

export const updatePost = async (req, res) => {
  const uploadedImages = [];
  let post;
  try {
    for (const file of req.files) {
      const result = await uploadPostFromBuffer(file.buffer);
      if (result?.public_id) uploadedImages.push(result);
      if (!result?.public_id || !result?.secure_url) {
        throw new Error("Cloudinary trả về thông tin hình ảnh không hợp lệ");
      }
    }
    post = await prisma.tinDang.update({
      where: {
        maTinDang: req.existingPost.maTinDang,
        maNguoiDung: req.user.maNguoiDung,
        deletedAt: null,
      },
      data: {
        ...req.postData,
        phienBanXacThuc: { increment: 1 },
        trangThai: "CHO_KIEM_DUYET",
        ngayDang: null,
        ...(uploadedImages.length > 0 && {
          hinhAnhTinDangs: {
            deleteMany: {},
            create: uploadedImages.map((image, index) => ({
              hinhAnhUrl: image.secure_url,
              hinhAnhId: image.public_id,
              thuTuHienThi: index,
              laAnhDaiDien: index === 0,
            })),
          },
        }),
      },
      include: {
        hinhAnhTinDangs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
        },
      },
    });
  } catch (error) {
    console.error(error);
    await cleanupPostImages(uploadedImages.map((image) => image.public_id));
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Tin đăng không còn tồn tại hoặc đã bị xóa" });
    }
    return res.status(500).json({ message: "Cập nhật tin đăng thất bại" });
  }

  if (uploadedImages.length > 0) {
    await cleanupPostImages(
      req.existingPost.hinhAnhTinDangs.map((image) => image.hinhAnhId),
    );
  }
  return res.status(200).json({
    message: "Cập nhật tin đăng thành công và đang chờ kiểm duyệt",
    post: {
      ...post,
      giaNiemYet: Number(post.giaNiemYet),
      dienTich: Number(post.dienTich),
      matTien: post.matTien === null ? null : Number(post.matTien),
      matDuong: post.matDuong === null ? null : Number(post.matDuong),
      viDo: post.viDo === null ? null : Number(post.viDo),
      kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
      anhDaiDienUrl:
        post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)?.hinhAnhUrl ??
        post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
        null,
    },
  });
};

export const deletePost = async (req, res) => {
  try {
    const result = await prisma.tinDang.updateMany({
      where: {
        maTinDang: req.existingPost.maTinDang,
        maNguoiDung: req.user.maNguoiDung,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return res
        .status(404)
        .json({ message: "Tin đăng không còn tồn tại hoặc đã bị xóa" });
    }
    return res.status(200).json({ message: "Xóa tin đăng thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Xóa tin đăng thất bại" });
  }
};

async function cleanupPostImages(ids) {
  const imageIds = ids.filter(Boolean);
  const results = await Promise.allSettled(
    imageIds.map(async (id) =>
      cloudinary.uploader.destroy(id, { resource_type: "image" }),
    ),
  );
  results.forEach((result, index) => {
    if (
      result.status === "rejected" ||
      !["ok", "not found"].includes(result.value?.result)
    ) {
      console.error(
        "Không thể xóa hình ảnh của tin đăng",
        imageIds[index],
        result,
      );
    }
  });
}
