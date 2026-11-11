const properties = {
  province: {
    type: "string",
    description:
      "Tên tỉnh/thành, ví dụ Đà Nẵng. Không kèm tiền tố Thành phố hoặc Tỉnh.",
  },
  ward: {
    type: "string",
    description: "Tên phường/xã nếu người dùng chỉ định.",
  },
  propertyGroup: { type: "string", enum: ["NHA", "DAT"] },
  category: {
    type: "string",
    description: "Tên loại cụ thể, ví dụ căn hộ, nhà phố.",
  },
  keyword: {
    type: "string",
    description:
      "Từ khóa trong tiêu đề, chỉ dùng khi cần; không chép cả câu hỏi.",
  },
  minPrice: {
    type: "integer",
    minimum: 0,
    maximum: 1e15,
    description: "Giá tối thiểu, VNĐ.",
  },
  maxPrice: {
    type: "integer",
    minimum: 0,
    maximum: 1e15,
    description: "Giá tối đa, VNĐ. 3 tỷ = 3000000000.",
  },
  minArea: {
    type: "number",
    minimum: 0,
    maximum: 1e9,
    description: "Diện tích tối thiểu, m².",
  },
  maxArea: {
    type: "number",
    minimum: 0,
    maximum: 1e9,
    description: "Diện tích tối đa, m².",
  },
  minBedrooms: { type: "integer", minimum: 0, maximum: 100 },
};

export const searchPropertiesTool = {
  type: "function",
  name: "searchProperties",
  description:
    "Tìm tin bất động sản công khai trong Grestate theo điều kiện người dùng. Có thể để trống điều kiện để lấy tin mới nhất. Không tự thêm hoặc nới điều kiện. Hệ thống chưa có bộ lọc mua/thuê.",
  parameters: { type: "object", properties, additionalProperties: false },
};

export function buildPropertyWhere(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters))
    throw new Error("Bộ lọc không hợp lệ.");
  for (const [key, value] of Object.entries(filters)) {
    const rule = properties[key];
    if (!rule) throw new Error("Điều kiện tìm kiếm không được hỗ trợ.");
    if (rule.type === "string") {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.length > 150 ||
        (rule.enum && !rule.enum.includes(value))
      )
        throw new Error("Điều kiện dạng chữ không hợp lệ.");
    } else if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < rule.minimum ||
      value > rule.maximum ||
      (rule.type === "integer" && !Number.isSafeInteger(value))
    ) {
      throw new Error("Điều kiện dạng số không hợp lệ.");
    }
  }
  for (const [min, max] of [
    ["minPrice", "maxPrice"],
    ["minArea", "maxArea"],
  ]) {
    if (
      filters[min] !== undefined &&
      filters[max] !== undefined &&
      filters[min] > filters[max]
    )
      throw new Error("Giá trị tối thiểu vượt giá trị tối đa.");
  }
  const where = { deletedAt: null, trangThai: "DA_DUYET" };
  const {
    province,
    ward,
    propertyGroup,
    category,
    keyword,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    minBedrooms,
  } = filters;
  if (province || ward)
    where.phuongXa = {
      ...(province && {
        tinhThanh: { tenTinhThanh: { contains: province.trim() } },
      }),
      ...(ward && { tenPhuongXa: { contains: ward.trim() } }),
    };
  if (propertyGroup || category)
    where.loaiBatDongSan = {
      ...(propertyGroup && { nhomBatDongSan: propertyGroup }),
      ...(category && { tenLoai: { contains: category.trim() } }),
    };
  if (keyword) where.tieuDe = { contains: keyword.trim() };
  if (minPrice !== undefined || maxPrice !== undefined)
    where.giaNiemYet = {
      gt: 0,
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  if (minArea !== undefined || maxArea !== undefined)
    where.dienTich = {
      ...(minArea !== undefined && { gte: minArea }),
      ...(maxArea !== undefined && { lte: maxArea }),
    };
  if (minBedrooms !== undefined) where.soPhongNgu = { gte: minBedrooms };
  return where;
}

export async function searchProperties(prisma, filters) {
  let where;
  try {
    where = buildPropertyWhere(filters);
  } catch (error) {
    return { error: error.message, posts: [], total: 0 };
  }
  const [total, records] = await prisma.$transaction([
    prisma.tinDang.count({ where }),
    prisma.tinDang.findMany({
      where,
      take: 5,
      orderBy: [{ ngayDang: "desc" }, { maTinDang: "desc" }],
      select: {
        maTinDang: true,
        tieuDe: true,
        giaNiemYet: true,
        dienTich: true,
        diaChiChiTiet: true,
        soPhongNgu: true,
        soPhongTam: true,
        loaiBatDongSan: { select: { tenLoai: true, nhomBatDongSan: true } },
        phuongXa: {
          select: {
            tenPhuongXa: true,
            tinhThanh: { select: { tenTinhThanh: true } },
          },
        },
        hinhAnhTinDangs: {
          take: 1,
          orderBy: [
            { laAnhDaiDien: "desc" },
            { thuTuHienThi: "asc" },
            { maHinhAnh: "asc" },
          ],
          select: { hinhAnhUrl: true },
        },
      },
    }),
  ]);
  const posts = records.map(({ hinhAnhTinDangs, ...post }) => ({
    ...post,
    giaNiemYet: post.giaNiemYet.toString(),
    dienTich: post.dienTich.toString(),
    anhDaiDienUrl: hinhAnhTinDangs[0]?.hinhAnhUrl ?? null,
  }));
  return { filters, total, posts };
}

export async function runChatSearch(ai, prisma, options, message) {
  const history = [
    { type: "user_input", content: [{ type: "text", text: message }] },
  ];
  let searchResult = null;
  const deadline = Date.now() + 60_000;
  const fallback = () => ({
    reply: searchResult.total
      ? `Tìm thấy ${searchResult.total} tin phù hợp, hiển thị ${searchResult.posts.length} tin mới nhất.`
      : "Không tìm thấy tin phù hợp. Bạn có thể thay đổi khu vực hoặc khoảng giá.",
    ...searchResult,
  });
  for (let round = 0; round < 3; round++) {
    const started = Date.now();
    const remaining = deadline - started;
    if (remaining <= 0) {
      if (searchResult) return fallback();
      const error = new Error("Chat deadline exceeded");
      error.name = "TimeoutError";
      throw error;
    }
    let interaction;
    try {
      interaction = await ai.interactions.create(
        {
          ...options,
          input: history,
          tools: [searchPropertiesTool],
          store: false,
        },
        { timeout: Math.min(30_000, remaining), maxRetries: 0 },
      );
    } catch (error) {
      if (
        searchResult &&
        ["APIConnectionTimeoutError", "TimeoutError", "AbortError"].includes(
          error.name,
        )
      )
        return fallback();
      throw error;
    }
    const steps = interaction.steps || interaction.outputs || [];
    const calls = steps.filter((step) => step.type === "function_call");
    if (!calls.length) {
      const reply =
        interaction.output_text?.trim() ||
        steps
          .filter((step) => step.type === "text")
          .map((step) => step.text)
          .join("\n")
          .trim();
      return {
        reply,
        posts: searchResult?.posts || [],
        total: searchResult?.total || 0,
        filters: searchResult?.filters || null,
      };
    }
    history.push(...steps);
    if (calls.length > 2) throw new Error("Too many tool calls");
    for (const call of calls) {
      const result =
        call.name === "searchProperties"
          ? await searchProperties(prisma, call.arguments)
          : { error: "Công cụ không được hỗ trợ." };
      if (call.name === "searchProperties" && !result.error)
        searchResult = result;
      history.push({
        type: "function_result",
        name: call.name,
        call_id: call.id,
        result: [{ type: "text", text: JSON.stringify(result) }],
      });
    }
  }
  if (searchResult)
    return {
      reply: searchResult.total
        ? `Tìm thấy ${searchResult.total} tin phù hợp, hiển thị ${searchResult.posts.length} tin mới nhất.`
        : "Không tìm thấy tin phù hợp. Bạn có thể thay đổi khu vực hoặc khoảng giá.",
      ...searchResult,
    };
  throw new Error("Tool calling did not complete");
}
