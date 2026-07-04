import { useState, useRef, useEffect } from "react";
import { Search, ShieldCheck, ShieldOff, Mail, Phone, MoreVertical, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";

interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  role: "customer" | "worker";
  status: "active" | "suspended";
  joined: string;
}

const platformUsers: PlatformUser[] = [
  { id: "u1", fullName: "Hassan Iqbal", email: "hassan.iqbal@mail.com", phone: "0300-1234567", avatar: "https://i.pravatar.cc/300?img=11", role: "customer", status: "active", joined: "2024-02-14" },
  { id: "u2", fullName: "Mariam Saeed", email: "mariam.saeed@mail.com", phone: "0321-9876543", avatar: "https://i.pravatar.cc/300?img=25", role: "customer", status: "active", joined: "2024-05-02" },
  { id: "u3", fullName: "Omar Sheikh", email: "omar.sheikh@mail.com", phone: "0333-4567890", avatar: "https://i.pravatar.cc/300?img=15", role: "customer", status: "suspended", joined: "2023-11-19" },
  { id: "u4", fullName: "Ayesha Khan", email: "ayesha.khan@mail.com", phone: "0301-1122334", avatar: "https://i.pravatar.cc/300?img=12", role: "worker", status: "active", joined: "2022-03-14" },
  { id: "u5", fullName: "Bilal Ahmed", email: "bilal.ahmed@mail.com", phone: "0345-5566778", avatar: "https://i.pravatar.cc/300?img=22", role: "worker", status: "active", joined: "2021-08-02" },
  { id: "u6", fullName: "Rashid Mehmood", email: "rashid.mehmood@mail.com", phone: "0312-9988776", avatar: "https://i.pravatar.cc/300?img=59", role: "worker", status: "active", joined: "2022-11-19" },
  { id: "u7", fullName: "Sana Tariq", email: "sana.tariq@mail.com", phone: "0335-6677889", avatar: "https://i.pravatar.cc/300?img=51", role: "worker", status: "suspended", joined: "2023-09-05" },
];

function UserActionsMenu({
  user,
  onToggleStatus,
  onDelete,
}: {
  user: PlatformUser;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="User actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <button
            onClick={() => {
              onToggleStatus(user.id);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground transition hover:bg-secondary"
          >
            {user.status === "active" ? (
              <>
                <ShieldOff className="h-3.5 w-3.5" /> Suspend
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete ${user.fullName}? This action cannot be undone.`)) {
                onDelete(user.id);
              }
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [tab, setTab] = useState<"all" | "customer" | "worker">("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(platformUsers);

  const filtered = users.filter(
    (u) =>
      (tab === "all" || u.role === tab) &&
      u.fullName.toLowerCase().includes(query.toLowerCase())
  );

  function toggleStatus(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
  }

  function deleteUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer and worker accounts.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(["all", "customer", "worker"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                    tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                        <p className="text-xs font-bold">{u.fullName}</p>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</div>
                      <div className="mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone}</div>
                    </td>
                    <td className="text-xs font-semibold capitalize text-muted-foreground">{u.role}</td>
                    <td className="text-xs text-muted-foreground">{u.joined}</td>
                    <td>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        u.status === "active" ? "bg-primary-soft text-primary-dark" : "bg-red-100 text-red-700"
                      }`}>{u.status}</span>
                    </td>
                    <td className="text-right">
                      <UserActionsMenu user={u} onToggleStatus={toggleStatus} onDelete={deleteUser} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}