import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  userName,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Delete User
              </h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-secondary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}

        <div className="mt-6 rounded-xl bg-secondary/40 p-4 text-sm">
          Are you sure you want to permanently delete

          <span className="font-bold text-foreground">
            {" "}
            {userName}
          </span>

          ?
        </div>

        {/* Buttons */}

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2 font-semibold transition hover:bg-secondary"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

        </div>
      </div>
    </div>
  );
}