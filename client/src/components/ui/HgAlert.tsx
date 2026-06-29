import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { MailX, ServerCrash, CheckCircle2, AlertTriangle } from "lucide-react";

type AlertType = "error" | "warning" | "success" | "server";

interface HgAlertProps {
  open: boolean;
  onClose: () => void;
  type?: AlertType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
}

const config: Record<AlertType, { icon: React.ReactNode; iconBg: string; iconColor: string }> = {
  error: {
    icon: <MailX className="h-6 w-6" />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  server: {
    icon: <ServerCrash className="h-6 w-6" />,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
};

export function HgAlert({
  open,
  onClose,
  type = "error",
  title,
  description,
  actionLabel,
  onAction,
  cancelLabel = "Got it",
}: HgAlertProps) {
  const { icon, iconBg, iconColor } = config[type];

  return (
    <AlertDialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm rounded-2xl p-6 text-center">
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
          {icon}
        </div>

        <AlertDialogHeader className="items-center text-center">
          <AlertDialogTitle className="text-base font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 flex-col gap-2 sm:flex-col">
          {actionLabel && onAction && (
            <AlertDialogAction
              onClick={onAction}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold hover:bg-primary-dark"
            >
              {actionLabel}
            </AlertDialogAction>
          )}
          <AlertDialogCancel
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted mt-0"
          >
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}