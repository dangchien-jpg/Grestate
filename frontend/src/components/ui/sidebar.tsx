import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { House } from "lucide-react";
import { Link, NavLink } from "react-router";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  icon: ReactNode;
  title: string;
  link: string;
  badge?: ReactNode;
  /** Display a red circular icon and a divider below this item. */
  variant?: "default" | "primary";
  /** Match only this URL instead of also matching child routes. */
  end?: boolean;
}

export interface SidebarProps extends ComponentPropsWithoutRef<"aside"> {
  items: SidebarItem[];
  logo?: ReactNode;
  logoLink?: string;
  brandName?: string;
  navigationLabel?: string;
}

/** Render inside a Router. Pass icons as elements, for example <Users />. */
export function Sidebar({
  items,
  logo,
  logoLink = "/",
  brandName = "Grestate",
  navigationLabel = "Điều hướng chính",
  className,
  ...props
}: SidebarProps) {
  return (
    <aside
      {...props}
      className={cn(
        "sticky top-0 flex h-dvh w-28 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white font-sans text-[#15191c]",
        className,
      )}
    >
      <Link
        to={logoLink}
        aria-label={`${brandName} - Trang chủ`}
        className="flex min-h-28 shrink-0 items-center justify-center px-2 py-6 "
      >
        {logo ?? (
          <span className="flex flex-col items-center gap-1">
            <House className="size-8" strokeWidth={1.7} aria-hidden="true" />
          </span>
        )}
      </Link>

      <nav aria-label={navigationLabel} className="flex-1 px-0.5 pb-6">
        <ul className="m-0 list-none p-0">
          {items.map((item) => {
            const primary = item.variant === "primary";

            return (
              <li
                key={item.link}
                className={cn(primary && "mb-3 border-b border-slate-200 pb-4")}
              >
                <NavLink
                  to={item.link}
                  end={item.end ?? item.link === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-25 flex-col items-center justify-center gap-2 rounded-none  px-1 py-3 text-center text-[15px] leading-5 transition-colors hover:bg-gray-100 ",
                      isActive &&
                        "font-bold border-r-2  border-primary text-primary",
                    )
                  }
                >
                  <span className="relative flex h-10 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 items-center justify-center [&_svg]:size-7 [&_svg]:stroke-[1.7]",
                        primary &&
                          "rounded-full bg-primary text-white [&_svg]:size-8 [&_svg]:stroke-[1.5]",
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.badge != null && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#c90000] px-1.5 py-0.5 text-xs font-bold leading-4 text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full break-words text-sm">
                    {item.title}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
