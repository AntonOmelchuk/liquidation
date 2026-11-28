import { PencilIcon, TrashIcon } from "./action-icons.tsx";
import { ICON_ACTION } from "./constants.ts";
import type { IconActionProps } from "./types.ts";

export function IconAction({ icon, label, ...target }: IconActionProps) {
  const remove = icon === ICON_ACTION.DELETE;
  const glyph = remove ? <TrashIcon /> : <PencilIcon />;
  const attributes = {
    "aria-label": label,
    title: label,
  };
  const style = remove
    ? "secondary icon-action record-delete"
    : "secondary icon-action";
  if (target.href !== undefined) {
    return (
      <a
        className={"action-link " + style}
        href={target.href}
        onClick={target.onClick}
        {...attributes}
      >
        {glyph}
      </a>
    );
  }
  return (
    <button
      {...attributes}
      type="button"
      className={style}
      disabled={target.disabled}
      aria-haspopup={target["aria-haspopup"]}
      onClick={target.onClick}
    >
      {glyph}
    </button>
  );
}
