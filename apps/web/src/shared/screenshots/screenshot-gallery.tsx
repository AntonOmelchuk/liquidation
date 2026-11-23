import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { useEffect, useState } from "react";
import type {
  ScreenshotGalleryProps,
  ScreenshotPreviewProps,
} from "./types.ts";

import { useScreenshotMessages } from "./messages.ts";
import "./screenshots.css";

export function ScreenshotPreview({ shot, number }: ScreenshotPreviewProps) {
  const messages = useScreenshotMessages();
  const [objectUrl, setObjectUrl] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!shot.file) return;
    const url = URL.createObjectURL(shot.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [shot.file]);

  const source = shot.file
    ? objectUrl
    : JOURNAL_ROUTES.planScreenshot + shot.id;
  const name = `${messages.title} · ${number}`;
  if (failed)
    return <p className="screenshot-placeholder">{messages.unavailable}</p>;
  const thumbnail = source && (
    <img
      src={source}
      alt={name}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );

  return shot.file ? (
    <div className="screenshot-thumb">{thumbnail}</div>
  ) : (
    <a
      className="screenshot-thumb"
      href={source}
      target="_blank"
      draggable={false}
      rel="noreferrer"
      aria-label={`${messages.preview} · ${number}`}
    >
      {thumbnail}
    </a>
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
