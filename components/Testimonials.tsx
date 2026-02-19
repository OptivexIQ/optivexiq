export function Testimonials() {
  const testimonials = [
    {
      quote:
        "OptivexIQ identified 8 positioning gaps we'd completely missed. Within 2 weeks of deploying the new copy, our demo bookings increased by 27%.",
      name: "Marcus Chen",
      role: "Founder & CEO",
      company: "PipelineHQ",
      companyDetail: "Series A • $32k MRR",
      metric: "+27%",
      metricLabel: "demo bookings",
      verified: "Verified impact",
    },
    {
      quote:
        "We spent months tweaking our pricing page with no results. OptivexIQ showed us exactly why our tiers were confusing prospects and rewrote them with clear value anchoring.",
      name: "Sarah Lindgren",
      role: "VP Growth",
      company: "MetricStack",
      companyDetail: "Series B • $18k MRR",
      metric: "+41%",
      metricLabel: "pricing conversion",
      verified: "Verified impact",
    },
    {
      quote:
        "The competitive differentiation map was eye-opening. We were using nearly identical messaging to our top 3 competitors. OptivexIQ gave us a distinct positioning angle in days.",
      name: "James Okafor",
      role: "Co-founder",
      company: "DealFlow.io",
      companyDetail: "120 employees",
      metric: "3 days",
      metricLabel: "to positioning clarity",
      verified: "Security-focused",
    },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Testimonials
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Trusted by SaaS Founders
            <br />
            <span className="text-muted-foreground">
              Who Take Positioning Seriously
            </span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:bg-secondary/30"
            >
              {/* Metric highlight */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground">
                    {testimonial.metric}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {testimonial.metricLabel}
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                  {testimonial.verified}
                </span>
              </div>

              <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                {`"${testimonial.quote}"`}
              </blockquote>

              <div className="flex items-center gap-3 border-t border-border/60 pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                  {testimonial.companyDetail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Logos / trust strip */}
        <div className="mt-16 border-t border-border/40 pt-12">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Built for teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              "PipelineHQ",
              "MetricStack",
              "DealFlow",
              "SaaSGrid",
              "ChurnZero",
              "ClosePad",
            ].map((company) => (
              <span
                key={company}
                className="text-sm font-semibold tracking-tight text-muted-foreground/40 transition-colors hover:text-muted-foreground/60"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
