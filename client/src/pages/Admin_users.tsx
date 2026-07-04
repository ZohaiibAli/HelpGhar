// import { useState, useRef, useEffect } from "react";
import { useState, useEffect } from "react";
import { Search, ShieldCheck, ShieldOff, Mail, Phone, MoreVertical, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { adminService } from "@/services/adminService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlatformUser {
  id: string;
  customerId?: string;
  workerId?: string;
  fullName: string;
  email: string;
  phone: string;
  role: "customer" | "worker";
  status: "active" | "suspended";
  joined: string;
}



function UserActionsMenu({
  user,
  onToggleStatus,
  onDelete,
}: {
  user: PlatformUser;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="User actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => onToggleStatus(user.id)}
          className="cursor-pointer"
        >
          {user.status === "active" ? (
            <>
              <ShieldOff className="mr-2 h-4 w-4" />
              Suspend
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => {
            if (
              window.confirm(
                `Delete ${user.fullName}? This action cannot be undone.`
              )
            ) {
              onDelete(user.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminUsers() {
  const [tab, setTab] = useState<"all" | "customer" | "worker">("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error(error);
    }
  };

  // Run once when page opens
  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (tab === "all" || u.role === tab) &&
      u.fullName.toLowerCase().includes(query.toLowerCase())
  );


  async function toggleStatus(id: string) {
    const selected = users.find((u) => u.id === id);

    if (!selected) return;

    try {
      await adminService.toggleUserStatus(
        selected.role,
        selected.id
      );

      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteUser(id: string) {
    const selected = users.find((u) => u.id === id);

    if (!selected) return;

    try {
      await adminService.deleteUser(
        selected.role,
        selected.id
      );

      fetchUsers();
    } catch (error) {
      console.error(error);
    }
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
                  className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
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
                  <th className="w-32 py-2">User ID</th>
                  <th className="w-48">User</th>
                  <th className="w-96">Contact</th>
                  <th className="w-32">Role</th>
                  <th className="w-32">Status</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="py-3 text-xs font-semibold text-muted-foreground">
                      {u.role === "customer" ? u.customerId : u.workerId}
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-xs font-bold">{u.fullName}</p>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</div>
                      <div className="mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone}</div>
                    </td>
                    <td className="text-xs font-semibold capitalize text-muted-foreground">{u.role}</td>
                    <td>
                      <span
                        className={`inline-flex w-24 justify-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${u.status === "active"
                            ? "bg-primary-soft text-primary-dark"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {u.status}
                      </span>
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