import {
  MAX_SCREENSHOTS_PER_SECTION,
  SCREENSHOT_TYPES,
} from "@liquidation/domain/evidence/constants";
import { useId, useState } from "react";
import { SCREENSHOT_DRAG_TYPE } from "./constants.ts";
import type { ScreenshotError, ScreenshotFieldProps } from "./types.ts";

import { addScreenshots } from "./draft.ts";
import { useScreenshotMessages } from "./messages.ts";
import { ScreenshotPreview } from "./screenshot-gallery.tsx";

export function ScreenshotField({
  value,
  onChange,
  disabled = false,
}: ScreenshotFieldProps) {
  const messages = useScreenshotMessages();
  const hintId = useId();
  const [error, setError] = useState<ScreenshotError | null>(null);
  const full = value.length >= MAX_SCREENSHOTS_PER_SECTION;
  const canAdd = !disabled && !full;

  function add(files: File[]) {
    if (disabled || !files.length) return;
    const next = addScreenshots(value, files);
    if (next.error) {
      setError(next.error);
      return;
    }
    setError(null);
    onChange(next.screenshots);
  }

  function move(from: number, to: number) {
    if (disabled || from === to || from < 0 || to < 0 || to >= value.length)
      return;
    const ordered = [...value];
    const [shot] = ordered.splice(from, 1);
    ordered.splice(to, 0, shot);
    onChange(ordered);
  }

  return (
    <div className="screenshot-field">
      <div
        className="screenshot-drop"
        role="group"
        tabIndex={canAdd ? 0 : undefined}
        aria-label={messages.title}
        aria-describedby={hintId}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files);
          if (files.length === 0) return;
          event.preventDefault();
          add(files);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files"))
            event.preventDefault();
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          add(Array.from(event.dataTransfer.files));
        }}
      >
        <label className="screenshot-select">
          <span>{messages.add}</span>
          <input
            type="file"
            className="visually-hidden"
            multiple
            accept={SCREENSHOT_TYPES.join(",")}
            disabled={!canAdd}
            onChange={(event) => {
              add(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = "";
            }}
          />
        </label>
        <p id={hintId}>{messages.hint}</p>
      </div>
      {error && (
        <p className="error" role="alert">
          {messages[error]}
        </p>
      )}
      {value.length > 0 && (
        <ul className="screenshot-grid">
          {value.map((shot, index) => (
            <li
              key={shot.id}
              draggable={!disabled && value.length > 1}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(SCREENSHOT_DRAG_TYPE, shot.id);
              }}
              onDragOver={(event) => {
                if (
                  !disabled &&
                  event.dataTransfer.types.includes(SCREENSHOT_DRAG_TYPE)
                )
                  event.preventDefault();
              }}
              onDrop={(event) => {
                const id = event.dataTransfer.getData(SCREENSHOT_DRAG_TYPE);
                if (!id) return;
                event.preventDefault();
                move(
                  value.findIndex((candidate) => candidate.id === id),
                  index,
                );
              }}
            >
              <ScreenshotPreview shot={shot} number={index + 1} />
              <div className="screenshot-actions">
                <button
                  type="button"
                  className="secondary"
                  aria-label={`${messages.moveEarlier} · ${index + 1}`}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="secondary"
                  aria-label={`${messages.moveLater} · ${index + 1}`}
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  className="secondary"
                  aria-label={`${messages.remove} · ${index + 1}`}
                  disabled={disabled}
                  onClick={() => {
                    setError(null);
                    onChange(value.filter(({ id }) => id !== shot.id));
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
