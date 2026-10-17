import Link from "next/link";

type AdminNavigationProps = {
  active: "overview" | "sales";
  mobile?: boolean;
};

const links = [
  {
    label: "Overview",
    href: "/admin",
    active: (page: AdminNavigationProps["active"]) => page === "overview",
    icon: (
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Sales",
    href: "/admin/sales",
    active: (page: AdminNavigationProps["active"]) => page === "sales",
    icon: (
      <>
        <path d="M4 19V5m0 14h16" strokeLinecap="round" />
        <path
          d="m7 15 4-4 3 2 5-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: "Products",
    href: "/admin#products",
    active: () => false,
    icon: (
      <path
        d="M6 7.5h12l1 12H5l1-12ZM9 8V6a3 3 0 0 1 6 0v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export function AdminNavigation({
  active,
  mobile = false,
}: AdminNavigationProps) {
  return (
    <nav
      aria-label="Admin navigation"
      className={
        mobile
          ? "flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-5 py-2 lg:hidden sm:px-8"
          : "mt-14 space-y-1"
      }
    >
      {links.map((link) => {
        const isActive = link.active(active);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "flex shrink-0 items-center gap-3 bg-black px-3 py-2.5 text-sm font-medium text-white"
                : mobile
                  ? "flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
                  : "flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
            }
            href={link.href}
            key={link.label}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              {link.icon}
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
