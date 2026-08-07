import { Link } from "react-router-dom";
import { useWebsiteSettingsStore } from "@/store/websiteSettingsStore";

export function Footer() {
  const {
    websiteLogo,
    websiteName,
    loading,
  } = useWebsiteSettingsStore();

return (
  <footer className="mt-24 border-t border-border bg-card">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 md:grid-cols-3 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          {!loading && websiteLogo && (
            <img
              src={websiteLogo}
              alt="Logo"
              className="h-10 w-10 rounded-xl object-contain"
            />
          )}

          {!loading && (
            <span className="text-xl font-black">
              {websiteName}
            </span>
          )}
        </div>
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
          Pakistan's trusted marketplace for verified home service workers.
        </p>
        {/* The four social icons that used to sit here were all href="#" --
            they scrolled the page to the top and nothing else. There are no
            social accounts recorded anywhere in website settings to point
            them at, so they are gone until there are. */}
      </div>

      {/* Every link below goes somewhere that actually exists. The previous
          "Help Center", "Privacy Policy", "Terms & Conditions", "Refund
          Policy" and "Contact" entries all pointed at "/", so clicking any
          of them silently dropped the visitor back on the landing page. */}
      <FooterCol
        title="For Users"
        links={[
          ["Browse Services", "/services"],
          ["My Bookings", "/my-bookings"],
          ["Transactions", "/transactions"],
          ["My Reviews", "/reviews"],
        ]}
      />
      <FooterCol
        title="Support"
        links={[
          ["Help Assistant", "/chat"],
          ["Report an Issue", "/disputes"],
          ["My Messages", "/messages"],
          ["Sign In", "/login"],
        ]}
      />
    </div>
    <div className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} HelpGhar. All rights reserved.</p>
        <p>Made with care in Pakistan 🇵🇰</p>
      </div>
    </div>
  </footer>
);
}

function FooterCol({ title, links, className }: { title: string; links: [string, string][]; className?: string }) {
  return (
    <div className={className}>
      <h4 className="text-sm font-bold">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={label}><Link to={to} className="transition hover:text-primary">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
