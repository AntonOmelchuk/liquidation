import {
  REPORT_FIELDS,
  REPORT_PROGRESS_MAX,
} from "@liquidation/domain/workspace/constants";
import type { Report } from "@liquidation/domain/workspace/types";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { useScreenshotMessages } from "../../../shared/screenshots/messages.ts";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import { GradeBadge } from "../grade-badge.tsx";
import { useWorkspaceMessages } from "../messages.ts";
import { REPORT_LESSON_FIELD, REPORT_NOTE_ACCENTS } from "./constants.ts";
import { ReviewIcon } from "./review-icon.tsx";
import "./report-summary.css";

export function ReportSummary({ report }: { report: Report }) {
  const m = useWorkspaceMessages();
  const screenshots = useScreenshotMessages();
  const { format } = useLocale();

  return (
    <div className="report-summary">
      <dl className="report-scorecard">
        {report.grade && (
          <div data-accent="violet">
            <dt>
              <ReviewIcon name="grade" />
              {m.processGrade}
            </dt>
            <dd>
              <GradeBadge value={report.grade} />
            </dd>
          </div>
        )}
        {report.quality && (
          <div data-accent="amber">
            <dt>
              <ReviewIcon name="quality" />
              {m.quality}
            </dt>
            <dd>
              <GradeBadge value={report.quality} />
            </dd>
          </div>
        )}
        {report.progress !== undefined && (
          <div data-accent="blue">
            <dt>
              <ReviewIcon name="progress" />
              {m.focusProgress}
            </dt>
            <dd className="report-progress-value">
              <span>
                {report.progress}
                <span className="report-progress-max">
                  /{REPORT_PROGRESS_MAX}
                </span>
              </span>
              <MetricBar
                segments={[
                  {
                    tone: "accent",
                    ratio: report.progress / REPORT_PROGRESS_MAX,
                  },
                ]}
              />
            </dd>
          </div>
        )}
        {report.writtenPnl !== undefined && (
          <div data-accent={report.writtenPnl < 0 ? "red" : "green"}>
            <dt>
              <ReviewIcon name="pnl" />
              {m.savedReviewPnl}
            </dt>
            <dd className={numericTone(report.writtenPnl)}>
              {format.money.format(report.writtenPnl)}
            </dd>
          </div>
        )}
      </dl>

      <div className="report-note-grid">
        {REPORT_FIELDS.map((key) =>
          report[key] ? (
            <section
              key={key}
              className="report-note"
              data-accent={REPORT_NOTE_ACCENTS[key]}
            >
              <h3>
                <ReviewIcon name={key} />
                {key === REPORT_LESSON_FIELD ? m.keyLesson : m[key]}
              </h3>
              <p>{report[key]}</p>
            </section>
          ) : null,
        )}
      </div>
      {report.screenshotIds?.length ? (
        <section className="report-note" data-accent="blue">
          <h3>
            <ReviewIcon name="screenshots" />
            {screenshots.title}
          </h3>
          <ScreenshotGallery ids={report.screenshotIds} />
        </section>
      ) : null}
    </div>
  );
}
