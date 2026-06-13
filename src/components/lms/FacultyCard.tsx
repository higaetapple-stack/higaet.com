import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function FacultyCard({ profile }: { profile: { full_name: string | null; avatar_url: string | null; headline: string | null } }) {
  const initial = (profile.full_name ?? "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg ring-1 ring-border p-3 bg-card">
      <Avatar className="size-10">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink truncate">{profile.full_name ?? "Faculty"}</div>
        {profile.headline && <div className="text-xs text-muted-foreground truncate">{profile.headline}</div>}
      </div>
    </div>
  );
}
