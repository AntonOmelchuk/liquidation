import { useId, useLayoutEffect, useRef, useState } from "react";
import { usePlanningMessages } from "./messages.ts";

export function ThoughtExcerpt({ text }: { text: string }) {
  const m = usePlanningMessages();
  const id = useId();
  const content = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  useLayoutEffect(() => {
    const paragraph = content.current;
    if (!paragraph || expanded) return;
    const measure = () =>
      setClipped(paragraph.scrollHeight > paragraph.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div className="thought-excerpt">
      <p
        ref={content}
        id={id}
        className="record-prose"
        data-expanded={expanded}
      >
        {text}
      </p>
      {(clipped || expanded) && (
        <button
          type="button"
          className="secondary thought-toggle"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? m.collapseThought : m.expandThought}
          <span className="thought-toggle-chevron" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
