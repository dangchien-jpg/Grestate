export function createSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPostUrl(post: {
  maTinDang: number;
  tieuDe: string;
}): string {
  const slug = createSlug(post.tieuDe) || "tin-dang";
  return `/detail/${slug}-${post.maTinDang}`;
}

export function getPostId(value: string | undefined): number {
  const match = value?.match(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*-)?([0-9]+)$/);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : NaN;
}
