# Conversation History

**What we're building**

A manual message log for each contact, accessible via the History tab in the contact detail panel. The user can record any message — from themselves or from the contact — by typing the body, picking a direction (Me / Contact), and picking a channel (Email or LinkedIn). Each logged message appears as a chat bubble in chronological order, alternating sides like a messaging app. Outgoing messages from the user are automatically numbered as Touch 1, Touch 2, etc. by the backend. The tab shows a live count of total messages and how many replies (contact-direction messages) exist.

The deeper purpose is to build a paper trail that the ContextBuilder (a future feature) can pull when drafting Touch 2, Touch 3, and re-engagement messages — so the AI knows what was already said, what the contact replied, and can write the next message without repeating itself or ignoring prior context.

- Remove Mark as Replied button.
- Need apis for create/edit/delete of a message.
- Need a date picker for knowing `sentAt` date.

---

**What's out of scope**

- **Auto-recording sent messages** — "Mark as Sent" does not yet write to conversation history. Messages are only logged manually. Wiring the send confirmation to auto-create a history entry is deferred.
- **ContextBuilder** — reading conversation history and injecting it into AI prompts is not part of this spec. The table is built now; the consumption is later.
- **Rich text or attachments** — plain text body only.
