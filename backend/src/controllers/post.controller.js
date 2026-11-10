import prisma from "../libs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadPostFromBuffer } from "../middlewares/uploadPost.middleware.js";

const fetchPostList = async (res, where) => {
  try {
    const records = await prisma.tinDang.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { maTinDang: "desc" }],
      include: {
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

    const posts = records.map((post) => ({
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

    return res.status(200).json({ posts, total: posts.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy danh sách tin đăng thất bại" });
  }
};

export const fetchPost = (req, res) => fetchPostList(res, { deletedAt: null });

export const fetchPostsByUser = (req, res) =>
  fetchPostList(res, {
    maNguoiDung: req.user.maNguoiDung,
    deletedAt: null,
  });

export const fetchDetailPost = async (req, res) => {
  const id = Number(req.params.maTinDang);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
  }

  try {
    const record = await prisma.tinDang.findFirst({
      where: { maTinDang: id, deletedAt: null },
      include: {
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

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    }

    const post = record;

    return res.status(200).json({
      post: {
        ...post,
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
  let post;
  try {
    for (const file of req.files) {
      const result = await uploadPostFromBuffer(file.buffer);
      if (result?.public_id) uploadedImages.push(result);
      if (!result?.public_id || !result?.secure_url)
        throw new Error("Cloudinary trả về thông tin hình ảnh không hợp lệ");
    }
    post = await prisma.tinDang.create({
      data: {
        ...req.postData,
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
    const cleanup = await Promise.allSettled(
      uploadedImages.map((image) =>
        cloudinary.uploader.destroy(image.public_id, {
          resource_type: "image",
        }),
      ),
    );
    cleanup.forEach((result, index) => {
      if (
        result.status === "rejected" ||
        !["ok", "not found"].includes(result.value?.result)
      ) {
        console.error(
          "Không thể xóa hình ảnh của tin đăng",
          uploadedImages[index].public_id,
          result,
        );
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
      console.error("Không thể xóa hình ảnh của tin đăng", imageIds[index], result);
    }
  });
}
