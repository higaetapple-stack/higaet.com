import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SkillsInput({
  value,
  onChange,
  placeholder = "Type a skill and press Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="rounded-md ring-1 ring-border bg-background p-2 flex flex-wrap gap-1.5">
      {value.map((s) => (
        <span key={s} className="inline-flex items-center gap-1 text-xs bg-academy/10 text-academy px-2 py-1 rounded">
          {s}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} className="hover:text-ink">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={placeholder}
        className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[180px] h-7 px-1"
      />
    </div>
  );
}
