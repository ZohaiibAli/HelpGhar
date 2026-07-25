import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
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
        <div className="mt-4 flex gap-3">
          {[Facebook, Instagram, Twitter, Linkedin].map((I, i) => (
            <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
              <I className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {/* <FooterCol title="Company" links={[["About Us", "/"], ["How it Works", "/"], ["Careers", "/"], ["Press", "/"]]} /> */}
      <FooterCol title="For Users" links={[["Browse Services", "/services"], ["My Bookings", "/my-bookings"], ["Transactions", "/transactions"], ["Help Center", "/"]]} />
      <FooterCol title="Legal" links={[["Privacy Policy", "/"], ["Terms & Conditions", "/"], ["Refund Policy", "/"], ["Contact", "/"]]} />
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
