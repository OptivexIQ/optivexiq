-- 039: Backfill legacy envelope-shaped report_data into canonical ConversionGapReport JSON
-- Safe to run multiple times; only transforms rows that still match legacy envelope shape.

begin;

with legacy_rows as (
  select
    cgr.id,
    cgr.created_at,
    cgr.status as row_status,
    cgr.report_data
  from public.conversion_gap_reports cgr
  where cgr.report_type = 'full'
    and jsonb_typeof(cgr.report_data) = 'object'
    and cgr.report_data ? 'metadata'
    and cgr.report_data ? 'scores'
),
backfilled as (
  select
    lr.id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'id', coalesce(nullif(lr.report_data #>> '{metadata,report_id}', ''), lr.id::text),
        'company', coalesce(nullif(lr.report_data #>> '{metadata,company}', ''), 'Unknown'),
        'segment', coalesce(nullif(lr.report_data #>> '{metadata,segment}', ''), 'SaaS'),
        'status',
          case
            when coalesce(nullif(lr.report_data #>> '{metadata,status}', ''), lr.row_status) in ('queued', 'running', 'completed', 'failed')
              then coalesce(nullif(lr.report_data #>> '{metadata,status}', ''), lr.row_status)
            else 'failed'
          end,
        'createdAt',
          coalesce(
            nullif(lr.report_data #>> '{metadata,created_at}', ''),
            lr.created_at::text,
            now()::text
          ),
        'conversionScore', coalesce((lr.report_data #>> '{scores,conversion_score}')::numeric, 0),
        'funnelRisk', coalesce((lr.report_data #>> '{scores,funnel_risk}')::numeric, 0),
        'winRateDelta', coalesce((lr.report_data #>> '{scores,win_rate_delta}')::numeric, 0),
        'pipelineAtRisk', coalesce((lr.report_data #>> '{scores,pipeline_at_risk}')::numeric, 0),
        'differentiationScore', coalesce((lr.report_data #>> '{scores,differentiation_score}')::numeric, 0),
        'pricingScore', coalesce((lr.report_data #>> '{scores,pricing_score}')::numeric, 0),
        'clarityScore', coalesce((lr.report_data #>> '{scores,clarity_score}')::numeric, 0),
        'confidenceScore', coalesce((lr.report_data #>> '{scores,confidence_score}')::numeric, 0),
        'threatLevel',
          case
            when lr.report_data #>> '{scores,threat_level}' in ('low', 'medium', 'high')
              then lr.report_data #>> '{scores,threat_level}'
            else 'low'
          end,
        'executiveNarrative', coalesce(nullif(lr.report_data #>> '{metadata,executive_narrative}', ''), ''),
        'executiveSummary', coalesce(nullif(lr.report_data #>> '{metadata,executive_summary}', ''), ''),
        'messagingOverlap',
          coalesce(
            lr.report_data #> '{metadata,messaging_overlap}',
            jsonb_build_object('items', '[]'::jsonb, 'insight', '', 'ctaLabel', '')
          ),
        'objectionCoverage', coalesce(lr.report_data #> '{metadata,objection_coverage}', '{}'::jsonb),
        'competitiveMatrix', coalesce(lr.report_data #> '{metadata,competitive_matrix}', '{}'::jsonb),
        'positioningMap', coalesce(lr.report_data #> '{metadata,positioning_map}', '{}'::jsonb),
        'rewrites', coalesce(lr.report_data -> 'rewrites', '{}'::jsonb),
        'rewriteRecommendations', coalesce(lr.report_data #> '{metadata,rewrite_recommendations}', '[]'::jsonb),
        'competitor_synthesis', lr.report_data -> 'competitor_synthesis',
        'revenueImpact',
          coalesce(
            lr.report_data #> '{metadata,revenue_impact}',
            jsonb_build_object(
              'pipelineAtRisk', coalesce((lr.report_data #>> '{scores,pipeline_at_risk}')::numeric, 0),
              'estimatedLiftPercent', coalesce((lr.report_data #>> '{metadata,revenue_projection,estimatedLiftPercent}')::numeric, 0),
              'modeledWinRateDelta', coalesce((lr.report_data #>> '{metadata,revenue_projection,modeledWinRateDelta}')::numeric, 0),
              'projectedPipelineRecovery', coalesce((lr.report_data #>> '{metadata,revenue_projection,projectedPipelineRecovery}')::numeric, 0)
            )
          ),
        'revenueProjection',
          coalesce(
            lr.report_data #> '{metadata,revenue_projection}',
            jsonb_build_object(
              'estimatedLiftPercent', 0,
              'modeledWinRateDelta', 0,
              'projectedPipelineRecovery', 0
            )
          ),
        'priorityIssues', coalesce(lr.report_data #> '{metadata,priority_issues}', '[]'::jsonb),
        'priorityIndex', coalesce(lr.report_data #> '{metadata,priority_index}', '[]'::jsonb)
      )
    ) as canonical_report_data
  from legacy_rows lr
)
update public.conversion_gap_reports cgr
set report_data = b.canonical_report_data
from backfilled b
where cgr.id = b.id;

-- Safety check: no legacy envelope rows should remain after backfill.
do $$
declare
  v_remaining_legacy int;
begin
  select count(*)
    into v_remaining_legacy
  from public.conversion_gap_reports cgr
  where cgr.report_type = 'full'
    and jsonb_typeof(cgr.report_data) = 'object'
    and cgr.report_data ? 'metadata'
    and cgr.report_data ? 'scores';

  if v_remaining_legacy > 0 then
    raise exception 'Canonical report_data backfill incomplete. remaining_legacy_rows=%', v_remaining_legacy;
  end if;
end
$$;

commit;
