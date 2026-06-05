import { useState } from "react";
import { ContactHistoryChannelEnum, ContactHistoryDirectionEnum } from "@app/schemas";
import { useCreateContactHistory } from "./-data";

export function ComposeForm({ contactId, onSaved }: { contactId: number; onSaved: () => void }) {
  const createHistory = useCreateContactHistory();
  const [direction, setDirection] = useState<ContactHistoryDirectionEnum>(
    ContactHistoryDirectionEnum.Me,
  );
  const [channel, setChannel] = useState<ContactHistoryChannelEnum>(
    ContactHistoryChannelEnum.Email,
  );
  const [body, setBody] = useState("");
  const [sentAt, setSentAt] = useState(() => new Date().toISOString().slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    createHistory.mutate(
      { contactId, body: { direction, channel, body: body.trim(), sentAt } },
      {
        onSuccess: () => {
          setBody("");
          setSentAt(new Date().toISOString().slice(0, 10));
          onSaved();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3 border-t border-border">
      <div className="flex gap-2">
        <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-medium">
          {[
            { value: ContactHistoryDirectionEnum.Me, label: "Me" },
            { value: ContactHistoryDirectionEnum.Contact, label: "Contact" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDirection(opt.value)}
              className={[
                "h-7 px-3 transition-colors",
                direction === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-(--text-secondary) hover:bg-(--surface-raised)",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-medium">
          {[
            { value: ContactHistoryChannelEnum.Email, label: "Email" },
            { value: ContactHistoryChannelEnum.LinkedIn, label: "LinkedIn" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChannel(opt.value)}
              className={[
                "h-7 px-3 transition-colors",
                channel === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-(--text-secondary) hover:bg-(--surface-raised)",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={sentAt}
          onChange={(e) => setSentAt(e.target.value)}
          className="h-7 px-2 rounded-lg border border-border bg-background text-[12px] text-foreground outline-none focus:border-primary transition-colors ml-auto scheme-light dark:scheme-dark"
        />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type the message body…"
        rows={3}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={!body.trim() || createHistory.isPending}
        className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 self-end"
      >
        {createHistory.isPending ? "Saving…" : "Log message"}
      </button>
    </form>
  );
}
