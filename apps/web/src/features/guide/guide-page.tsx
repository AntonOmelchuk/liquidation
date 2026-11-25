import { PAGE_HASHES } from "../../app/constants.ts";
import { Panel } from "../../shared/ui/layout.tsx";
import { FACTOR_SECTIONS } from "../statistics/constants.ts";
import { useStatisticsHelp } from "../statistics/help-messages.ts";
import { useStatisticsMessages } from "../statistics/messages.ts";
import { MetricGlossary } from "../statistics/metric-glossary.tsx";
import { GUIDE_SECTIONS } from "./constants.ts";
import { useGuideMessages } from "./messages.ts";
import "./guide.css";

export default function GuidePage() {
  const m = useGuideMessages();
  const s = useStatisticsMessages();
  const { factors: help } = useStatisticsHelp();
  return (
    <main className="guide-page">
      <header className="page-heading">
        <div>
          <h1>{m.title}</h1>
          <p>{m.introduction}</p>
        </div>
      </header>
      <div className="layout">
        <Panel title={m.workflow}>
          <div className="guide-workflow">
            {GUIDE_SECTIONS.map(({ page, title, description }) => (
              <section className="guide-workflow-item" key={title}>
                <h3>
                  {page ? (
                    <a href={PAGE_HASHES[page]}>{m[title]} →</a>
                  ) : (
                    m[title]
                  )}
                </h3>
                <p>{m[description]}</p>
              </section>
            ))}
          </div>
        </Panel>
        <Panel
          title={m.statistics}
          detail={<a href={PAGE_HASHES.statistics}>{s.title} →</a>}
        >
          <ol className="guide-steps">
            {m.statisticsSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Panel>
        <Panel title={m.factors}>
          <p>{s.periodHint}</p>
          <div className="guide-factor-grid">
            {Object.entries(FACTOR_SECTIONS).map(([section, factors]) => (
              <section key={section}>
                <h3>{s[section as keyof typeof FACTOR_SECTIONS]}</h3>
                <dl className="statistics-metric-glossary">
                  {factors.map((factor) => (
                    <div key={factor}>
                      <dt>{s[factor]}</dt>
                      <dd>{help[factor]}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </Panel>
        <Panel title={m.calculations}>
          <MetricGlossary />
        </Panel>
      </div>
    </main>
  );
}
