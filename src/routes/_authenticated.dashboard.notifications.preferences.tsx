import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyPreferences,
  upsertMyPreference,
} from "@/lib/notifications.functions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/types";
import type {
  NotificationPreferenceRow,
  NotificationChannel,
} from "@/lib/notifications/types";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/dashboard/notifications/preferences",
)({
  component: PreferencesPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

const DEFAULT_PREF = { in_app: true, email: true, push: false };

function PreferencesPage() {
  const qc = useQueryClient();
  const fetchPrefs = useServerFn(getMyPreferences);
  const upsert = useServerFn(upsertMyPreference);

  const { data: prefs = [] } = useQuery<NotificationPreferenceRow[]>({
    queryKey: ["notifications", "preferences"],
    queryFn: () => fetchPrefs(),
  });

  const upsertMut = useMutation({
    mutationFn: (input: {
      category: string;
      in_app: boolean;
      email: boolean;
      push: boolean;
    }) => upsert({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast.success("Preferences saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function getPref(category: string) {
    return (
      prefs.find((p) => p.category === category) ?? {
        category,
        ...DEFAULT_PREF,
      }
    );
  }

  function toggle(category: string, channel: NotificationChannel, value: boolean) {
    const current = getPref(category);
    upsertMut.mutate({
      category,
      in_app: channel === "in_app" ? value : current.in_app,
      email: channel === "email" ? value : current.email,
      push: channel === "push" ? value : current.push,
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">
          Notification preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to hear from us for each topic.
        </p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-surface">
        <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-3 border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Category</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
          <span className="text-center">Push</span>
        </div>
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const p = getPref(cat.key);
          return (
            <div
              key={cat.key}
              className="grid grid-cols-[1fr_80px_80px_80px] items-center px-4 py-3 border-b border-border last:border-b-0"
            >
              <Label className="text-sm text-ink">{cat.label}</Label>
              <div className="flex justify-center">
                <Switch
                  checked={p.in_app}
                  onCheckedChange={(v) => toggle(cat.key, "in_app", v)}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={p.email}
                  onCheckedChange={(v) => toggle(cat.key, "email", v)}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={p.push}
                  onCheckedChange={(v) => toggle(cat.key, "push", v)}
                  disabled
                  aria-label="Push (coming soon)"
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Push notifications are coming soon. Critical security alerts cannot be
        disabled.
      </p>
    </div>
  );
}
