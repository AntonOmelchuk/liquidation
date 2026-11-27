import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { useEffect, useRef, useState } from "react";
import type {
  ScreenshotGalleryProps,
  ScreenshotPreviewProps,
} from "./types.ts";

import { useScreenshotMessages } from "./messages.ts";
import { ScreenshotDialog } from "./screenshot-dialog.tsx";
import "./screenshots.css";

export function ScreenshotPreview({ shot, number }: ScreenshotPreviewProps) {
  const messages = useScreenshotMessages();
  const [objectUrl, setObjectUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [viewing, setViewing] = useState(false);
  const thumbnail = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!shot.file) return;
    const url = URL.createObjectURL(shot.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [shot.file]);

  const source = shot.file
    ? objectUrl
    : JOURNAL_ROUTES.planScreenshot + shot.id;
  const name = `${messages.image} · ${number}`;
  return (
    <>
      {failed ? (
        <p className="screenshot-placeholder">{messages.unavailable}</p>
      ) : (
        <button
          ref={thumbnail}
          className="screenshot-thumb"
          type="button"
          draggable={false}
          aria-haspopup="dialog"
          aria-label={`${messages.preview} · ${number}`}
          disabled={!source}
          onClick={() => setViewing(true)}
        >
          {source && (
            <img
              src={source}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() => setFailed(true)}
            />
          )}
        </button>
      )}
      {source && viewing && (
        <ScreenshotDialog
          source={source}
          title={name}
          onClose={() => {
            setViewing(false);
            thumbnail.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </>
  );
}

export function ScreenshotGallery({ ids }: ScreenshotGalleryProps) {
  if (!ids?.length) return null;
  return (
    <ul className="screenshot-grid">
      {ids.map((id, index) => (
        <li key={`${id}-${index}`}>
          <ScreenshotPreview shot={{ id }} number={index + 1} />
        </li>
      ))}
    </ul>
  );
}
