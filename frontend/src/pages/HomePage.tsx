import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroBackgroundSlider from "@/components/slicer/hero-background-slider";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { usePostStore } from "@/stores/postStore";
import { useFavorites } from "@/hooks/use-favorites";
import PropertyCard from "@/components/property/property-card";
import { useAuthStore } from "@/stores/authStore";

const sampleProjects = [
  {
    name: "An Hòa Riverside",
    location: "Đà Nẵng",
    type: "Khu căn hộ ven sông",
    photo: "photo-1600607687920-4e2a09cf159d",
  },
  {
    name: "Minh Khôi Garden",
    location: "Hà Nội",
    type: "Nhà phố sân vườn",
    photo: "photo-1600585154340-be6161a56a0c",
  },
  {
    name: "Nam Viên Residence",
    location: "TP. Hồ Chí Minh",
    type: "Căn hộ đô thị",
    photo: "photo-1600210492486-724fe5c67fb0",
  },
  {
    name: "An Lâm Villas",
    location: "Đồng Nai",
    type: "Biệt thự vườn",
    photo: "photo-1564013799919-ab600027ffc6",
  },
];
const listing = "/nha-dat-ban";
const cities = [
  { name: "TP. Hồ Chí Minh", id: "79", photo: "ho-chi-minh" },
  { name: "Hà Nội", id: "01", photo: "ha-noi" },
  { name: "Đà Nẵng", id: "48", photo: "da-nang" },
  { name: "Bình Dương", id: "74", photo: "binh-duong" },
  { name: "Đồng Nai", id: "75", photo: "dong-nai" },
];
const wrap = "mx-auto w-full max-w-[1400px] px-4 sm:px-20 ";
function Heading({ title, more }: { title: string; more?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      {more && (
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-blue-800"
          to={listing}
        >
          Xem tất cả <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export default function HomePage() {
  useFavorites();
  const { posts, fetchPost } = usePostStore();
  const [status, setStatus] = useState("Đang tải tin đăng…");
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = useAuthStore((state) => !!state.accessToken);
  useEffect(() => {
    let active = true;
    fetchPost()
      .then(() => {
        if (active) {
          setStatus("Chưa có tin đăng.");
        }
      })
      .catch(() => {
        if (active) setStatus("Không tải được tin đăng.");
      });
    return () => {
      active = false;
    };
  }, [fetchPost]);
  const featured = posts.filter((p) => p.anhDaiDienUrl).slice(0, 8);
  const picks = [
    ...featured,
    ...posts.filter((p) => !featured.includes(p)),
  ].slice(0, 8);
  return (
    <>
      <Header />
      <main className="bg-[#FAFAFA] text-slate-900">
        <section className="relative isolate flex min-h-[400px] items-center bg-slate-950 py-10 sm:py-12 lg:py-[60px]">
          <HeroBackgroundSlider />
          <div
            className={
              wrap +
              " grid items-end gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:gap-x-10 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] "
            }
          >
            <div className="flex min-w-0 flex-col">
              <h1 className="max-w-[32ch] text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.18]">
                Tìm được ngôi nhà ưng ý với mức giá bạn hoàn toàn yên tâm
              </h1>
              <p className="mt-3 max-w-[64ch] text-pretty text-base leading-relaxed font-normal text-slate-100 sm:text-lg">
                Từ căn hộ nhỏ đến đất nền lớn, mọi tin đăng đều có giá rõ ràng
                và được kiểm duyệt
              </p>
              <form
                className="mt-5 flex items-center gap-2 rounded-sm bg-white p-1 pl-4 shadow"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(
                    keyword.trim()
                      ? listing + "?q=" + encodeURIComponent(keyword.trim())
                      : listing,
                  );
                }}
              >
                <Search size={20} />
                <Input
                  aria-label="Từ khóa tìm kiếm"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo khu vực, dự án hoặc tên đường..."
                  className="h-12 flex-1 border-0 px-1 text-sm text-slate-900 placeholder:text-slate-600 placeholder:opacity-100 shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-sm"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 text-sm font-semibold"
                >
                  Tìm kiếm
                </Button>
              </form>
            </div>
            <aside className="flex flex-col rounded-sm bg-white p-4 shadow-md sm:p-5">
              <h2 className="text-xl font-bold leading-tight text-slate-900">
                Định giá AI{" "}
              </h2>
              <p className="mt-2 mb-3 text-sm text-slate-700">
                Ước tính giá nhà theo vị trí và diện tích để đối chiếu với giá
                chào bán.
              </p>
              <Button
                nativeButton={false}
                render={
                  <Link
                    to={signedIn ? "/predict" : "/signin"}
                    state={
                      signedIn
                        ? undefined
                        : { backgroundLocation: location, returnTo: "/predict" }
                    }
                  />
                }
                size="lg"
                variant="outline"
                className="w-full border-primary text-sm font-bold text-primary"
              >
                Định giá ngay
                <ArrowRight
                  size={20}
                  aria-hidden="true"
                  className="size-6 motion-safe:animate-[valuation-arrow_2.4s_ease-in-out_infinite]"
                />
              </Button>
            </aside>
          </div>{" "}
        </section>
        <div className={wrap + " space-y-5 py-5 "}>
          <section>
            <Heading title="Bất động sản nổi bật" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,18rem))] lg:justify-between">
              {picks.map((property) => (
                <PropertyCard
                  key={property.maTinDang}
                  property={property}
                  featured
                />
              ))}
              {!posts.length && status}
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                nativeButton={false}
                render={<Link to={listing} />}
                variant="outline"
                size="lg"
                className="bg-white border border-[#ccc] rounded-sm text-sm font-semibold h-12 pl-4"
              >
                Xem thêm <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </section>
          <section>
            <Heading title="Bất động sản theo khu vực" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {cities.map((city, index) => (
                <Link
                  key={city.id}
                  to={listing}
                  state={{
                    filter: {
                      type: "location",
                      maTinhThanh: city.id,
                      label: city.name,
                    },
                  }}
                  className={`group relative isolate overflow-hidden rounded-sm bg-slate-800 p-3 text-white sm:p-5 ${index === 0 ? "col-span-2 aspect-[2/1] lg:row-span-2 lg:aspect-auto" : "aspect-[1.38]"}`}
                >
                  <img
                    src={`/regions/${city.photo}.jpg`}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 -z-20 size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-linear-to-b from-slate-950/80 via-slate-950/20 to-transparent"
                  />
                  <strong className="block text-lg leading-tight sm:text-xl">
                    {city.name}
                  </strong>
                  <span className="mt-1 block text-sm font-semibold">
                    {posts
                      .filter((post) => post.phuongXa.maTinhThanh === city.id)
                      .length.toLocaleString("vi-VN")}{" "}
                    tin đăng
                  </span>
                </Link>
              ))}
            </div>
          </section>
          <section className="flex flex-wrap items-center justify-around gap-4 rounded-sm bg-blue-50 px-5 py-3">
            <img
              src="/House searching-amico.svg"
              alt=""
              className="hidden h-16 sm:block"
            />
            <div>
              <h2 className="text-xl font-bold">Đăng tin bất động sản</h2>
              <p>Tiếp cận hàng ngàn khách hàng đang tìm kiếm mỗi ngày.</p>
            </div>
            <Button
              nativeButton={false}
              render={<Link to="/me/create-post" />}
              size="lg"
              className="px-5 text-sm font-bold"
            >
              Đăng tin ngay <ArrowRight size={16} />
            </Button>
          </section>
          <section>
            <Heading title="Dự án mới nhất" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sampleProjects.map((project) => (
                <Card
                  key={project.name}
                  className="gap-0 overflow-hidden rounded-sm py-0 shadow-md"
                >
                  <img
                    src={`https://images.unsplash.com/${project.photo}?auto=format&fit=crop&w=800&q=85`}
                    alt=""
                    loading="lazy"
                    className="aspect-[2/1] w-full object-cover"
                  />
                  <CardContent className="space-y-1 p-4">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-sm ">
                      {project.type} · {project.location}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
