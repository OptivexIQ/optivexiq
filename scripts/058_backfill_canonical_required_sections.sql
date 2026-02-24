-- 058: Backfill canonical required intelligence sections and schema version
-- Ensures legacy report_data satisfies strict canonical contract.

begin;

with normalized as (
  select
    id,
    coalesce(report_data, '{}'::jsonb) as report_data,
    status
  from public.conversion_gap_reports
),
patched as (
  select
    id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              report_data,
              '{canonicalSchemaVersion}',
              to_jsonb('2026-02-24'::text),
              true
            ),
            '{differentiationInsights}',
            case
              when jsonb_typeof(report_data->'differentiationInsights') = 'object' then report_data->'differentiationInsights'
              else jsonb_build_object(
                'similarityScore', 0,
                'overlapAreas', jsonb_build_array('insufficient data'),
                'opportunities', jsonb_build_array(
                  jsonb_build_object(
                    'theme', 'insufficient data',
                    'rationale', 'insufficient data',
                    'implementationDifficulty', 'medium',
                    'expectedImpact', 'low'
                  )
                ),
                'strategyRecommendations', jsonb_build_array('insufficient data'),
                'parityRisks', jsonb_build_array('insufficient data'),
                'strategicNarrativeDifferences', jsonb_build_array(
                  jsonb_build_object(
                    'difference', 'insufficient data',
                    'evidence', jsonb_build_array(
                      jsonb_build_object(
                        'competitor', 'insufficient data',
                        'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                      )
                    ),
                    'confidence', 0,
                    'actionPriority', 'P2'
                  )
                ),
                'underservedPositioningTerritories', jsonb_build_array(
                  jsonb_build_object(
                    'territory', 'insufficient data',
                    'rationale', 'insufficient data',
                    'evidence', jsonb_build_array(
                      jsonb_build_object(
                        'competitor', 'insufficient data',
                        'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                      )
                    ),
                    'confidence', 0,
                    'actionPriority', 'P2'
                  )
                ),
                'credibleDifferentiationAxes', jsonb_build_array(
                  jsonb_build_object(
                    'axis', 'insufficient data',
                    'rationale', 'insufficient data',
                    'evidence', jsonb_build_array(
                      jsonb_build_object(
                        'competitor', 'insufficient data',
                        'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                      )
                    ),
                    'confidence', 0,
                    'actionPriority', 'P2'
                  )
                ),
                'marketPerceptionRisks', jsonb_build_array(
                  jsonb_build_object(
                    'risk', 'insufficient data',
                    'whyItMatters', 'insufficient data',
                    'evidence', jsonb_build_array(
                      jsonb_build_object(
                        'competitor', 'insufficient data',
                        'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                      )
                    ),
                    'confidence', 0,
                    'actionPriority', 'P2'
                  )
                ),
                'recommendedPositioningDirection', jsonb_build_object(
                  'direction', 'insufficient data',
                  'rationale', 'insufficient data',
                  'supportingEvidence', jsonb_build_array(
                    jsonb_build_object(
                      'competitor', 'insufficient data',
                      'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                    )
                  ),
                  'confidence', 0,
                  'actionPriority', 'P2'
                )
              )
            end,
            true
          ),
          '{competitiveInsights}',
          case
            when jsonb_typeof(report_data->'competitiveInsights') = 'array'
              and jsonb_array_length(report_data->'competitiveInsights') > 0
            then report_data->'competitiveInsights'
            else jsonb_build_array(
              jsonb_build_object(
                'claim', 'insufficient data',
                'evidence', jsonb_build_array(
                  jsonb_build_object(
                    'competitor', 'insufficient data',
                    'snippet', 'insufficient data: legacy record missing structured evidence for this field.'
                  )
                ),
                'reasoning', 'insufficient data: legacy record missing structured evidence for this field.',
                'confidence', 0,
                'actionPriority', 'P2'
              )
            )
          end,
          true
        ),
        '{competitor_synthesis}',
        case
          when jsonb_typeof(report_data->'competitor_synthesis') = 'object' then report_data->'competitor_synthesis'
          else jsonb_build_object(
            'coreDifferentiationTension', 'insufficient data',
            'messagingOverlapRisk', jsonb_build_object(
              'level', 'moderate',
              'explanation', 'insufficient data'
            ),
            'substitutionRiskNarrative', 'insufficient data',
            'counterPositioningVector', 'insufficient data',
            'pricingDefenseNarrative', 'insufficient data'
          )
        end,
        true
      ),
      '{status}',
      to_jsonb(
        case
          when coalesce(report_data->>'status', status::text) in ('queued', 'running', 'completed', 'failed')
            then coalesce(report_data->>'status', status::text)
          else 'failed'
        end
      ),
      true
    ) as patched_report_data
  from normalized
)
update public.conversion_gap_reports r
set report_data = p.patched_report_data
from patched p
where r.id = p.id;

commit;
