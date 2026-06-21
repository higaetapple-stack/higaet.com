import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListTemplates,
  adminUpsertTemplate,
  adminSendTestToSelf,
} from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DOMAIN_EVENTS,
  NOTIFICATION_CATEGORIES,
} from "@/lib/notifications/types";
import type {
  NotificationTemplateRow,
  NotificationChannel,
} from "@/lib/notifications/types";

export const Route = createFileRoute(
  "/_authenticated/dashboard/admin/notifications",
)({
  component: AdminTemplatesPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

interface DraftTemplate {
  id?: string;
  key: string;
  channel: NotificationChannel;
  locale: string;
  subject: string;
  title: string;
  body_template: string;
  action_url: string;
  category: string;
  enabled: boolean;
}

const EMPTY: DraftTemplate = {
  key: "",
  channel: "in_app",
  locale: "en",
  subject: "",
  title: "",
  body_template: "",
  action_url: "",
  category: "system",
  enabled: true,
};

function AdminTemplatesPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(adminListTemplates);
  const upsert = useServerFn(adminUpsertTemplate);
  const sendTest = useServerFn(adminSendTestToSelf);

  const { data: templates = [], isLoading } = useQuery<
    NotificationTemplateRow[]
  >({
    queryKey: ["notifications", "templates"],
    queryFn: async () => (await fetchAll()) as NotificationTemplateRow[],
  });

  const [draft, setDraft] = useState<DraftTemplate>(EMPTY);

  const upsertMut = useMutation({
    mutationFn: (d: DraftTemplate) =>
      upsert({
        data: {
          ...d,
          subject: d.subject || null,
          title: d.title || null,
          action_url: d.action_url || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "templates"] });
      toast.success("Template saved");
      setDraft(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: (eventType: string) =>
      sendTest({
        data: {
          eventType,
          category: "system",
          title: "Test notification",
          body: "This is a test from the admin console.",
          priority: "normal",
        },
      }),
    onSuccess: () => toast.success("Test dispatched"),
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(t: NotificationTemplateRow) {
    setDraft({
      id: t.id,
      key: t.key,
      channel: t.channel,
      locale: t.locale,
      subject: t.subject ?? "",
      title: t.title ?? "",
      body_template: t.body_template,
      action_url: t.action_url ?? "",
      category: t.category,
      enabled: t.enabled,
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">
          Notification templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage messages for every event type and channel. Variables use{" "}
          <code className="px-1 bg-muted rounded">{"{{var}}"}</code> syntax.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* List */}
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : templates.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No templates yet. Create one on the right.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {templates.map((t) => (
                <li key={t.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink">{t.key}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {t.channel}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {t.locale}
                      </Badge>
                      {!t.enabled && (
                        <Badge variant="destructive" className="text-[10px]">
                          disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {t.title || t.subject || t.body_template.slice(0, 80)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => edit(t)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testMut.mutate(t.key)}
                  >
                    Test
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor */}
        <form
          className="border border-border rounded-lg p-4 bg-surface space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            upsertMut.mutate(draft);
          }}
        >
          <h2 className="font-semibold text-sm text-ink">
            {draft.id ? "Edit template" : "New template"}
          </h2>

          <div className="space-y-1">
            <Label className="text-xs">Event key</Label>
            <Input
              list="event-keys"
              value={draft.key}
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              placeholder="enrollment.created"
              required
            />
            <datalist id="event-keys">
              {DOMAIN_EVENTS.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Channel</Label>
              <Select
                value={draft.channel}
                onValueChange={(v) =>
                  setDraft({ ...draft, channel: v as NotificationChannel })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-app</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Locale</Label>
              <Input
                value={draft.locale}
                onChange={(e) => setDraft({ ...draft, locale: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft({ ...draft, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {draft.channel === "email" && (
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input
                value={draft.subject}
                onChange={(e) =>
                  setDraft({ ...draft, subject: e.target.value })
                }
              />
            </div>
          )}

          {draft.channel !== "email" && (
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Body</Label>
            <Textarea
              rows={4}
              value={draft.body_template}
              onChange={(e) =>
                setDraft({ ...draft, body_template: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Action URL</Label>
            <Input
              value={draft.action_url}
              onChange={(e) =>
                setDraft({ ...draft, action_url: e.target.value })
              }
              placeholder="/dashboard/..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
                id="enabled"
              />
              <Label htmlFor="enabled" className="text-xs">
                Enabled
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraft(EMPTY)}
              >
                Clear
              </Button>
              <Button type="submit" size="sm" disabled={upsertMut.isPending}>
                {draft.id ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
