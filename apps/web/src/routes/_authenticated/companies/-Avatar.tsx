import Utilities from "@/utils";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeCls =
    size === "lg"
      ? "w-14 h-14 text-lg"
      : size === "sm"
        ? "w-7 h-7 text-[11px]"
        : "w-9 h-9 text-[13px]";
  return (
    <span
      className={[
        "rounded-full inline-flex items-center justify-center font-semibold shrink-0",
        "bg-(--surface-raised) text-(--text-secondary)",
        sizeCls,
      ].join(" ")}
    >
      {Utilities.getInitials(name)}
    </span>
  );
}

export default Avatar;
