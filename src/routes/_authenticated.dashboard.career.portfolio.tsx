import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyCareerProfile, updatePortfolioSettings } from "@/lib/career.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/career/portfolio")({
  component: PortfolioSettings,
});

function PortfolioSettings() {
  const get = useServerFn(getMyCareerProfile);
  const upd = useServerFn(updatePortfolioSettings);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-career-profile"], queryFn: () => get() });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (q.data && !form) {
      const d: any = q.data;
      setForm({
        portfolio_visibility: d.portfolio_visibility ?? "private",
        portfolio_slug: d.portfolio_slug ?? "",
        show_email: !!d.show_email,
        show_phone: !!d.show_phone,
        show_resume: d.show_resume ?? true,
        show_certificates: d.show_certificates ?? true,
        show_projects: d.show_projects ?? true,
      });
    }
  }, [q.data, form]);

  const m = useMutation({
    mutationFn: (input: any) => upd({ data: input }),
    onSuccess: () => {
      toast.success("Portfolio updated");
      qc.invalidateQueries({ queryKey: ["my-career-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const onSave = () => {
    const payload: any = { ...form };
    if (!payload.portfolio_slug) delete payload.portfolio_slug;
    m.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-4">
        <h2 className="font-display text-lg font-medium text-ink">Visibility</h2>
        <RadioGroup value={form.portfolio_visibility} onValueChange={(v) => setForm({ ...form, portfolio_visibility: v })} className="space-y-2">
          {[
            { v: "private", t: "Private", d: "Only you and HIGAET admins can see your portfolio." },
            { v: "unlisted", t: "Unlisted", d: "Accessible by direct URL, hidden from search engines." },
            { v: "public", t: "Public", d: "Indexed by search engines. Recruiters can discover you." },
          ].map((o) => (
            <label key={o.v} className="flex items-start gap-3 rounded-lg ring-1 ring-border p-3 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value={o.v} id={o.v} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-ink">{o.t}</div>
                <div className="text-xs text-muted-foreground">{o.d}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-3">
        <h2 className="font-display text-lg font-medium text-ink">Portfolio handle</h2>
        <Label className="text-xs">URL slug (lowercase, 3–40 chars, letters/numbers/hyphens)</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/portfolio/</span>
          <Input value={form.portfolio_slug} onChange={(e) => setForm({ ...form, portfolio_slug: e.target.value.toLowerCase() })} placeholder="your-name" />
        </div>
        {form.portfolio_slug && form.portfolio_visibility !== "private" && (
          <Link to="/portfolio/$slug" params={{ slug: form.portfolio_slug }} target="_blank" className="inline-flex items-center gap-1 text-xs text-academy">
            Preview <ExternalLink className="size-3" />
          </Link>
        )}
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-3">
        <h2 className="font-display text-lg font-medium text-ink">What to show</h2>
        {([
          ["show_email", "Show email"],
          ["show_phone", "Show phone"],
          ["show_resume", "Resume download"],
          ["show_certificates", "HIGAET certificates"],
          ["show_projects", "Projects & portfolio work"],
        ] as const).map(([k, l]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm">{l}</span>
            <Switch checked={form[k]} onCheckedChange={(v) => setForm({ ...form, [k]: v })} />
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <Button onClick={onSave} disabled={m.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
          {m.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
