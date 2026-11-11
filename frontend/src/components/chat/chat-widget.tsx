import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import {
  Building2,
  MessageCircle,
  MessageSquareMore,
  Send,
  X,
} from "lucide-react";
import { chatError, chatService } from "@/services/chatService";
import type { ChatPost } from "@/services/chatService";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/lib/format-price";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  posts?: ChatPost[];
};
const suggestions = [
  "Tìm nhà tại Đà Nẵng",
  "Tìm đất dưới 2 tỷ",
  "Tin bất động sản mới nhất",
];

function PostCard({ post }: { post: ChatPost }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link
      to={`/detail/${post.maTinDang}`}
      className="group flex gap-3 rounded-sm border bg-card p-2.5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        {post.anhDaiDienUrl && !imageFailed ? (
          <img
            src={post.anhDaiDienUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <Building2 className="size-7" />
        )}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-xs font-semibold leading-5 group-hover:text-primary">
          {post.tieuDe}
        </p>
        <p className="mt-1 text-sm font-bold text-primary">
          {formatPrice(Number(post.giaNiemYet))}{" "}
          <span className="font-normal text-muted-foreground">
            · {Number(post.dienTich).toLocaleString("vi-VN")} m²
          </span>
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {post.diaChiChiTiet}
        </p>
      </div>
    </Link>
  );
}

function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{
    text: string;
    message: string;
  } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (open) {
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [open, messages, pending, failure]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string, retry = false) {
    const message = text.trim();
    if (!message || message.length > 4000 || controller.current) return;
    const active = new AbortController();
    controller.current = active;
    setPending(true);
    setFailure(null);
    setDraft("");
    if (!retry)
      setMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), role: "user", text: message },
      ]);
    try {
      const response = await chatService.sendMessage(message, active.signal);
      if (!active.signal.aborted)
        setMessages((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: response.reply,
            posts: response.posts,
          },
        ]);
    } catch (error) {
      if (!active.signal.aborted)
        setFailure({ text: chatError(error), message });
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setPending(false);
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[1000] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <section
          id="grestate-chat"
          role="dialog"
          aria-modal="false"
          aria-labelledby="grestate-chat-title"
          className="flex h-[min(620px,calc(100dvh-112px))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background text-foreground shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-4 text-primary-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
              <MessageCircle className="size-5" />
            </span>
            <div className="flex-1">
              <h2 id="grestate-chat-title" className="font-semibold">
                Trợ lý Grestate
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcher.current?.focus();
              }}
              aria-label="Đóng khung chat"
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="mb-4 rounded-2xl rounded-tl-sm border bg-card p-3 text-sm leading-6">
              Xin chào! Bạn muốn tìm nhà hay đất? Hãy cho mình biết khu vực,
              ngân sách và diện tích mong muốn.
            </div>
            {messages.length === 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestions.map((text) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => void send(text)}
                    disabled={pending}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
            <div
              role="log"
              aria-label="Tin nhắn"
              aria-live="polite"
              aria-relevant="additions"
              className="space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <p
                    className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card"}`}
                  >
                    {message.text.replace(/\*\*([^*]+)\*\*/g, "$1")}
                  </p>
                  {!!message.posts?.length && (
                    <div className="mt-2 w-full space-y-2">
                      {message.posts.map((post) => (
                        <PostCard key={post.maTinDang} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {pending && (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  role="status"
                  aria-label="Đang nhập"
                  className="inline-flex items-center gap-1 py-2"
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </p>
            )}
            {failure && (
              <div
                role="alert"
                className="mt-4 rounded-sm border border-destructive/25 bg-destructive/5 p-3 text-sm"
              >
                <p>{failure.text}</p>
                <button
                  type="button"
                  onClick={() => void send(failure.message, true)}
                  disabled={pending}
                  className="mt-2 font-semibold text-primary underline"
                >
                  Thử lại
                </button>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form onSubmit={submit} className="border-t bg-card p-3">
            <div className="flex items-end gap-2 rounded-sm border border-[#ccc] bg-background p-2 ">
              <textarea
                ref={input}
                aria-label="Nhập tin nhắn cho trợ lý"
                placeholder="Ví dụ: Nhà Đà Nẵng dưới 3 tỷ…"
                rows={2}
                maxLength={4000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent p-1 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Gửi tin nhắn"
                className="rounded-sm bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Nhập đầy đủ điều kiện mỗi lần · Không lưu lịch sử chat
            </p>
          </form>
        </section>
      )}
      <button
        ref={launcher}
        type="button"
        aria-label={open ? "Thu gọn trợ lý Grestate" : "Mở trợ lý Grestate"}
        aria-expanded={open}
        aria-controls="grestate-chat"
        onClick={() => setOpen((value) => !value)}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <MessageSquareMore className="size-7" />
        )}
      </button>
    </div>
  );
}

export default function ChatWidget() {
  const userId = useAuthStore((state) => state.user?.maNguoiDung);
  return <ChatPanel key={userId ?? "guest"} />;
}
