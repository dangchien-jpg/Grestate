import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AuthorContact from "@/components/contact/author-contact";
import PropertyCard from "@/components/property/property-card";
import { useFavorites } from "@/hooks/use-favorites";
import { postService } from "@/services/postService";
import type { PublicAuthorPosts } from "@/types/post";

function Profile({ id }: { id: string }) {
  useFavorites();
  const [data, setData] = useState<PublicAuthorPosts | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    postService
      .fetchPostsByUserPublic(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [id]);
  if (!data)
    return (
      <p role="status">
        {failed ? "Không thể tải trang cá nhân." : "Đang tải trang cá nhân…"}
      </p>
    );
  if (id !== data.author.profilePath) {
    return <Navigate replace to={`/nguoi-dang/${encodeURIComponent(data.author.profilePath)}`} />;
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-4 lg:gap-4">
      <aside>
        <AuthorContact author={data.author} total={data.total} />
      </aside>
      <section className="min-w-0 lg:col-span-3">
        <h1 className="mb-4 text-xl font-semibold">
          Tin đăng của {data.author.hoTen}
        </h1>
        {data.total === 0 && <p>Chưa có tin đăng đang hiển thị.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,18rem))] lg:justify-between">
          {data.posts.map((property) => (
            <PropertyCard
              key={property.maTinDang}
              property={property}
              featured
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ListPostByUserPage() {
  const { profilePath = "" } = useParams();
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-8 sm:px-20">
        <Profile key={profilePath} id={profilePath} />
      </main>
      <Footer />
    </>
  );
}
