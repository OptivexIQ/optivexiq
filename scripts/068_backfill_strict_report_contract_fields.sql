-- 068: Backfill strict canonical report contract fields required by runtime schema validation.
-- Safe/idempotent: only patches missing/empty fields in report_data JSON.

begin;

with normalized as (
  select
    id,
    coalesce(report_data, '{}'::jsonb) as report_data,
    coalesce(report_data->>'status', status::text, 'failed') as effective_status
  from public.conversion_gap_reports
  where report_data is not null
),
patched as (
  select
    id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      report_data,
                      '{riskModelVersion}',
                      to_jsonb(
                        case
                          when coalesce(nullif(report_data->>'riskModelVersion', ''), '') <> ''
                            then report_data->>'riskModelVersion'
                          else 'v2.1'
                        end
                      ),
                      true
                    ),
                    '{taxonomyVersion}',
                    to_jsonb(
                      case
                        when coalesce(nullif(report_data->>'taxonomyVersion', ''), '') <> ''
                          then report_data->>'taxonomyVersion'
                        when coalesce(nullif(report_data#>>'{competitor_synthesis,taxonomyVersion}', ''), '') <> ''
                          then report_data#>>'{competitor_synthesis,taxonomyVersion}'
                        else 'v1.0'
                      end
                    ),
                    true
                  ),
                  '{scoringWeightsVersion}',
                  to_jsonb(
                    case
                      when coalesce(nullif(report_data->>'scoringWeightsVersion', ''), '') <> ''
                        then report_data->>'scoringWeightsVersion'
                      else '2026-03-03.v1'
                    end
                  ),
                  true
                ),
                '{competitor_synthesis,taxonomyVersion}',
                to_jsonb(
                  case
                    when coalesce(nullif(report_data#>>'{competitor_synthesis,taxonomyVersion}', ''), '') <> ''
                      then report_data#>>'{competitor_synthesis,taxonomyVersion}'
                    when coalesce(nullif(report_data->>'taxonomyVersion', ''), '') <> ''
                      then report_data->>'taxonomyVersion'
                    else 'v1.0'
                  end
                ),
                true
              ),
              '{competitor_synthesis,companyTaxonomy}',
              case
                when jsonb_typeof(report_data#>'{competitor_synthesis,companyTaxonomy}') = 'object'
                  then report_data#>'{competitor_synthesis,companyTaxonomy}'
                else jsonb_build_object(
                  'competitor', 'you',
                  'valuePropositions', jsonb_build_array('insufficient signal depth'),
                  'targetSegments', jsonb_build_array('insufficient signal depth'),
                  'primaryClaims', jsonb_build_array('insufficient signal depth'),
                  'differentiationSignals', jsonb_build_array('insufficient signal depth'),
                  'pricingSignals', jsonb_build_array('insufficient signal depth')
                )
              end,
              true
            ),
            '{competitor_synthesis,competitorTaxonomies}',
            case
              when jsonb_typeof(report_data#>'{competitor_synthesis,competitorTaxonomies}') = 'array'
                and jsonb_array_length(report_data#>'{competitor_synthesis,competitorTaxonomies}') > 0
                then report_data#>'{competitor_synthesis,competitorTaxonomies}'
              else jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'valuePropositions', jsonb_build_array('insufficient signal depth'),
                  'targetSegments', jsonb_build_array('insufficient signal depth'),
                  'primaryClaims', jsonb_build_array('insufficient signal depth'),
                  'differentiationSignals', jsonb_build_array('insufficient signal depth'),
                  'pricingSignals', jsonb_build_array('insufficient signal depth')
                )
              )
            end,
            true
          ),
          '{competitor_synthesis,dimensionalOverlap}',
          case
            when jsonb_typeof(report_data#>'{competitor_synthesis,dimensionalOverlap}') = 'object'
              then report_data#>'{competitor_synthesis,dimensionalOverlap}'
            else jsonb_build_object(
              'messaging_overlap', 0,
              'positioning_overlap', 0,
              'pricing_overlap', 0,
              'aggregate_overlap', 0
            )
          end,
          true
        ),
        '{competitor_synthesis,overlapByCompetitor}',
        case
          when jsonb_typeof(report_data#>'{competitor_synthesis,overlapByCompetitor}') = 'array'
            and jsonb_array_length(report_data#>'{competitor_synthesis,overlapByCompetitor}') > 0
            then report_data#>'{competitor_synthesis,overlapByCompetitor}'
          else jsonb_build_array(
            jsonb_build_object(
              'competitor', 'insufficient signal depth',
              'messaging_overlap', 0,
              'positioning_overlap', 0,
              'pricing_overlap', 0,
              'aggregate_overlap', 0,
              'signal_density', 0
            )
          )
        end,
        true
      ),
      '{messagingOverlap,items}',
      case
        when effective_status = 'completed'
          and (
            jsonb_typeof(report_data#>'{messagingOverlap,items}') <> 'array'
            or jsonb_array_length(report_data#>'{messagingOverlap,items}') = 0
            or jsonb_typeof(report_data#>'{messagingOverlap,items,0,competitor}') <> 'string'
            or jsonb_typeof(report_data#>'{messagingOverlap,items,0,you}') <> 'number'
            or jsonb_typeof(report_data#>'{messagingOverlap,items,0,competitors}') <> 'number'
            or lower(coalesce(report_data#>>'{messagingOverlap,items,0,risk}', '')) not in ('low', 'medium', 'high')
          )
          then jsonb_build_array(
            jsonb_build_object(
              'competitor', coalesce(nullif(report_data#>>'{competitor_synthesis,overlapByCompetitor,0,competitor}', ''), 'insufficient signal depth'),
              'you', 100,
              'competitors', 0,
              'risk', 'low',
              'dimensionalOverlap', jsonb_build_object(
                'messaging_overlap', 0,
                'positioning_overlap', 0,
                'pricing_overlap', 0,
                'aggregate_overlap', 0,
                'signal_density', 0
              )
            )
          )
        else coalesce(report_data#>'{messagingOverlap,items}', '[]'::jsonb)
      end,
      true
    ) as patched_report_data
  from normalized
),
patched_with_copy as (
  select
    id,
    jsonb_set(
      jsonb_set(
        patched_report_data,
        '{messagingOverlap,insight}',
        to_jsonb(
          case
            when coalesce(nullif(patched_report_data#>>'{messagingOverlap,insight}', ''), '') <> ''
              then patched_report_data#>>'{messagingOverlap,insight}'
            else 'Insufficient competitive signal depth to derive overlap lanes.'
          end
        ),
        true
      ),
      '{messagingOverlap,ctaLabel}',
      to_jsonb(
        case
          when coalesce(nullif(patched_report_data#>>'{messagingOverlap,ctaLabel}', ''), '') <> ''
            then patched_report_data#>>'{messagingOverlap,ctaLabel}'
          else 'Add competitor evidence'
        end
      ),
      true
    ) as final_report_data
  from patched
),
strict_aligned as (
  select
    id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    final_report_data,
                    '{canonicalSchemaVersion}',
                    to_jsonb(
                      case
                        when coalesce(nullif(final_report_data->>'canonicalSchemaVersion', ''), '') <> ''
                          then final_report_data->>'canonicalSchemaVersion'
                        else '2026-02-24'
                      end
                    ),
                    true
                  ),
                  '{scoringModelVersion}',
                  to_jsonb(
                    case
                      when coalesce(nullif(final_report_data->>'scoringModelVersion', ''), '') <> ''
                        then final_report_data->>'scoringModelVersion'
                      else '2026-02-23.v1'
                    end
                  ),
                  true
                ),
                '{competitor_synthesis,taxonomyVersion}',
                to_jsonb(
                  coalesce(
                    nullif(final_report_data->>'taxonomyVersion', ''),
                    'v1.0'
                  )
                ),
                true
              ),
              '{competitor_synthesis,coreDifferentiationTension}',
              to_jsonb(
                case
                  when coalesce(nullif(final_report_data#>>'{competitor_synthesis,coreDifferentiationTension}', ''), '') <> ''
                    then final_report_data#>>'{competitor_synthesis,coreDifferentiationTension}'
                  else 'insufficient signal depth'
                end
              ),
              true
            ),
            '{competitor_synthesis,substitutionRiskNarrative}',
            to_jsonb(
              case
                when coalesce(nullif(final_report_data#>>'{competitor_synthesis,substitutionRiskNarrative}', ''), '') <> ''
                  then final_report_data#>>'{competitor_synthesis,substitutionRiskNarrative}'
                else 'insufficient signal depth'
              end
            ),
            true
          ),
          '{competitor_synthesis,counterPositioningVector}',
          to_jsonb(
            case
              when coalesce(nullif(final_report_data#>>'{competitor_synthesis,counterPositioningVector}', ''), '') <> ''
                then final_report_data#>>'{competitor_synthesis,counterPositioningVector}'
              else 'insufficient signal depth'
            end
          ),
          true
        ),
        '{competitor_synthesis,pricingDefenseNarrative}',
        to_jsonb(
          case
            when coalesce(nullif(final_report_data#>>'{competitor_synthesis,pricingDefenseNarrative}', ''), '') <> ''
              then final_report_data#>>'{competitor_synthesis,pricingDefenseNarrative}'
            else 'insufficient signal depth'
          end
        ),
        true
      ),
      '{competitor_synthesis,messagingOverlapRisk}',
      jsonb_build_object(
        'level',
        case
          when lower(coalesce(final_report_data#>>'{competitor_synthesis,messagingOverlapRisk,level}', '')) in ('low', 'moderate', 'high')
            then lower(final_report_data#>>'{competitor_synthesis,messagingOverlapRisk,level}')
          else 'moderate'
        end,
        'explanation',
        case
          when coalesce(nullif(final_report_data#>>'{competitor_synthesis,messagingOverlapRisk,explanation}', ''), '') <> ''
            then final_report_data#>>'{competitor_synthesis,messagingOverlapRisk,explanation}'
          else 'Insufficient competitive signal depth to derive overlap lanes.'
        end
      ),
      true
    ) as strict_report_data
  from patched_with_copy
),
strict_final as (
  select
    sa.id,
    jsonb_set(
      jsonb_set(
        sa.strict_report_data,
        '{status}',
        to_jsonb(
          case
            when coalesce(sa.strict_report_data->>'status', n.effective_status, '') in ('queued', 'running', 'completed', 'failed')
              then coalesce(sa.strict_report_data->>'status', n.effective_status)
            else 'failed'
          end
        ),
        true
      ),
      '{threatLevel}',
      to_jsonb(
        case
          when lower(coalesce(sa.strict_report_data->>'threatLevel', '')) in ('low', 'medium', 'high')
            then lower(sa.strict_report_data->>'threatLevel')
          else 'low'
        end
      ),
      true
    ) as final_report_data
  from strict_aligned sa
  join normalized n on n.id = sa.id
),
contract_complete as (
  select
    sf.id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                (
                  sf.final_report_data || jsonb_build_object(
                    'id',
                    coalesce(nullif(sf.final_report_data->>'id', ''), sf.id::text),
                    'company',
                    coalesce(nullif(sf.final_report_data->>'company', ''), 'Unknown'),
                    'segment',
                    coalesce(nullif(sf.final_report_data->>'segment', ''), 'SaaS'),
                    'createdAt',
                    coalesce(nullif(sf.final_report_data->>'createdAt', ''), now()::text),
                    'conversionScore',
                    case
                      when coalesce(sf.final_report_data->>'conversionScore', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'conversionScore')::numeric
                      else 0
                    end,
                    'funnelRisk',
                    case
                      when coalesce(sf.final_report_data->>'funnelRisk', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'funnelRisk')::numeric
                      else 0
                    end,
                    'winRateDelta',
                    case
                      when coalesce(sf.final_report_data->>'winRateDelta', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'winRateDelta')::numeric
                      else 0
                    end,
                    'pipelineAtRisk',
                    case
                      when coalesce(sf.final_report_data->>'pipelineAtRisk', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'pipelineAtRisk')::numeric
                      else 0
                    end,
                    'differentiationScore',
                    case
                      when coalesce(sf.final_report_data->>'differentiationScore', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'differentiationScore')::numeric
                      else 0
                    end,
                    'pricingScore',
                    case
                      when coalesce(sf.final_report_data->>'pricingScore', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'pricingScore')::numeric
                      else 0
                    end,
                    'clarityScore',
                    case
                      when coalesce(sf.final_report_data->>'clarityScore', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'clarityScore')::numeric
                      else 0
                    end,
                    'confidenceScore',
                    case
                      when coalesce(sf.final_report_data->>'confidenceScore', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                        then (sf.final_report_data->>'confidenceScore')::numeric
                      else 0
                    end,
                    'executiveNarrative',
                    coalesce(nullif(sf.final_report_data->>'executiveNarrative', ''), 'Insufficient signal depth to produce a complete executive narrative.'),
                    'executiveSummary',
                    coalesce(nullif(sf.final_report_data->>'executiveSummary', ''), 'Insufficient signal depth to produce a complete executive summary.')
                  )
                ),
                '{scoringBreakdown}',
                case
                  when jsonb_typeof(sf.final_report_data->'scoringBreakdown') = 'object'
                    then sf.final_report_data->'scoringBreakdown'
                  else jsonb_build_object(
                    'clarity', 0,
                    'differentiation', 0,
                    'objectionCoverage', 0,
                    'competitiveOverlap', 0,
                    'pricingExposure', 0,
                    'weightedScore', 0,
                    'revenueRiskSignal', 0,
                    'competitiveThreatSignal', 0
                  )
                end,
                true
              ),
              '{diagnosis}',
              case
                when jsonb_typeof(sf.final_report_data->'diagnosis') = 'object'
                  and coalesce(nullif(sf.final_report_data#>>'{diagnosis,summary}', ''), '') <> ''
                  and coalesce(nullif(sf.final_report_data#>>'{diagnosis,primaryGap}', ''), '') <> ''
                  and coalesce(nullif(sf.final_report_data#>>'{diagnosis,primaryRisk}', ''), '') <> ''
                  and coalesce(nullif(sf.final_report_data#>>'{diagnosis,primaryOpportunity}', ''), '') <> ''
                  then sf.final_report_data->'diagnosis'
                else jsonb_build_object(
                  'summary', 'Insufficient signal depth for complete diagnosis.',
                  'primaryGap', 'Insufficient signal depth',
                  'primaryRisk', 'Insufficient signal depth',
                  'primaryOpportunity', 'Insufficient signal depth'
                )
              end,
              true
            ),
            '{sectionConfidence}',
            case
              when jsonb_typeof(sf.final_report_data->'sectionConfidence') = 'object'
                then sf.final_report_data->'sectionConfidence'
              else jsonb_build_object(
                'positioning', 0,
                'objections', 0,
                'differentiation', 0,
                'scoring', 0,
                'narrative', 0
              )
            end,
            true
          ),
          '{diagnosticEvidence}',
          case
            when jsonb_typeof(sf.final_report_data->'diagnosticEvidence') = 'object'
              then sf.final_report_data->'diagnosticEvidence'
            else jsonb_build_object(
              'positioningClarity', jsonb_build_array(
                jsonb_build_object(
                  'claim', 'Insufficient signal depth to assess positioning clarity.',
                  'evidence', jsonb_build_array('Insufficient signal depth: structured evidence unavailable.'),
                  'derivedFrom', jsonb_build_array('homepage'),
                  'confidenceScore', 0
                )
              ),
              'objectionCoverage', jsonb_build_array(
                jsonb_build_object(
                  'claim', 'Insufficient signal depth to assess objection coverage.',
                  'evidence', jsonb_build_array('Insufficient signal depth: structured evidence unavailable.'),
                  'derivedFrom', jsonb_build_array('homepage'),
                  'confidenceScore', 0
                )
              ),
              'competitiveOverlap', jsonb_build_array(
                jsonb_build_object(
                  'claim', 'Insufficient signal depth to assess competitive overlap.',
                  'evidence', jsonb_build_array('Insufficient signal depth: structured evidence unavailable.'),
                  'derivedFrom', jsonb_build_array('competitor'),
                  'confidenceScore', 0
                )
              ),
              'riskPrioritization', jsonb_build_array(
                jsonb_build_object(
                  'claim', 'Insufficient signal depth to prioritize risks confidently.',
                  'evidence', jsonb_build_array('Insufficient signal depth: structured evidence unavailable.'),
                  'derivedFrom', jsonb_build_array('homepage'),
                  'confidenceScore', 0
                )
              ),
              'narrativeDiagnosis', jsonb_build_array(
                jsonb_build_object(
                  'claim', 'Insufficient signal depth to form a narrative diagnosis.',
                  'evidence', jsonb_build_array('Insufficient signal depth: structured evidence unavailable.'),
                  'derivedFrom', jsonb_build_array('homepage'),
                  'confidenceScore', 0
                )
              )
            )
          end,
          true
        ),
        '{competitiveInsights}',
        case
          when jsonb_typeof(sf.final_report_data->'competitiveInsights') = 'array'
            and jsonb_array_length(sf.final_report_data->'competitiveInsights') > 0
            then sf.final_report_data->'competitiveInsights'
          else jsonb_build_array(
            jsonb_build_object(
              'claim', 'Insufficient signal depth to derive competitive claim.',
              'evidence', jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'snippet', 'Insufficient signal depth: structured evidence unavailable.'
                )
              ),
              'reasoning', 'Insufficient signal depth: structured evidence unavailable for competitive reasoning.',
              'confidence', 0,
              'actionPriority', 'P2'
            )
          )
        end,
        true
      ),
      '{competitiveMatrix}',
      case
        when jsonb_typeof(sf.final_report_data->'competitiveMatrix') = 'object'
          then sf.final_report_data->'competitiveMatrix'
        else jsonb_build_object(
          'profileMatrix', jsonb_build_array(
            jsonb_build_object(
              'competitor', 'insufficient signal depth',
              'ourAdvantage', 'insufficient signal depth',
              'theirAdvantage', 'insufficient signal depth'
            )
          ),
          'competitorRows', jsonb_build_array(
            jsonb_build_object(
              'competitor', 'insufficient signal depth',
              'summary', 'Insufficient signal depth to summarize competitor profile.',
              'strengths', jsonb_build_array('insufficient signal depth'),
              'weaknesses', jsonb_build_array('insufficient signal depth'),
              'positioning', jsonb_build_array('insufficient signal depth')
            )
          ),
          'differentiators', jsonb_build_array(
            jsonb_build_object(
              'claim', 'insufficient signal depth',
              'proof', 'insufficient signal depth'
            )
          ),
          'counters', jsonb_build_array(
            jsonb_build_object(
              'competitor', 'insufficient signal depth',
              'counter', 'insufficient signal depth'
            )
          ),
          'coreDifferentiationTension', coalesce(nullif(sf.final_report_data#>>'{competitor_synthesis,coreDifferentiationTension}', ''), 'insufficient signal depth'),
          'substitutionRiskNarrative', coalesce(nullif(sf.final_report_data#>>'{competitor_synthesis,substitutionRiskNarrative}', ''), 'insufficient signal depth'),
          'counterPositioningVector', coalesce(nullif(sf.final_report_data#>>'{competitor_synthesis,counterPositioningVector}', ''), 'insufficient signal depth'),
          'pricingDefenseNarrative', coalesce(nullif(sf.final_report_data#>>'{competitor_synthesis,pricingDefenseNarrative}', ''), 'insufficient signal depth')
        )
      end,
      true
    ) as contract_report_data
  from strict_final sf
),
contract_complete_2 as (
  select
    cc.id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            cc.contract_report_data,
            '{positioningMap}',
            case
              when jsonb_typeof(cc.contract_report_data->'positioningMap') = 'object'
                and exists (
                  select 1
                  from jsonb_each(cc.contract_report_data->'positioningMap')
                )
                then cc.contract_report_data->'positioningMap'
              else jsonb_build_object('status', 'insufficient signal depth')
            end,
            true
          ),
          '{rewrites}',
          case
            when jsonb_typeof(cc.contract_report_data->'rewrites') = 'object'
              and exists (
                select 1
                from jsonb_each(cc.contract_report_data->'rewrites')
              )
              then cc.contract_report_data->'rewrites'
            else jsonb_build_object('homepage', 'insufficient signal depth')
          end,
          true
        ),
        '{rewriteRecommendations}',
        case
          when jsonb_typeof(cc.contract_report_data->'rewriteRecommendations') = 'array'
            and jsonb_array_length(cc.contract_report_data->'rewriteRecommendations') > 0
            then cc.contract_report_data->'rewriteRecommendations'
          else jsonb_build_array(
            jsonb_build_object(
              'title', 'Insufficient signal depth',
              'slug', 'insufficient-signal-depth',
              'category', 'diagnostic',
              'metric', 'confidence',
              'copy', 'Add more source and competitor evidence to unlock stronger recommendations.',
              'iconName', 'default'
            )
          )
        end,
        true
      ),
      '{revenueImpact}',
      case
        when jsonb_typeof(cc.contract_report_data->'revenueImpact') = 'object'
          then cc.contract_report_data->'revenueImpact'
        else jsonb_build_object(
          'pipelineAtRisk', 0,
          'estimatedLiftPercent', 0,
          'modeledWinRateDelta', 0,
          'projectedPipelineRecovery', 0
        )
      end,
      true
    ) as contract_report_data
  from contract_complete cc
),
contract_complete_3 as (
  select
    cc2.id,
    jsonb_set(
      jsonb_set(
        cc2.contract_report_data,
        '{revenueProjection}',
        case
          when jsonb_typeof(cc2.contract_report_data->'revenueProjection') = 'object'
            then cc2.contract_report_data->'revenueProjection'
          else jsonb_build_object(
            'estimatedLiftPercent', 0,
            'modeledWinRateDelta', 0,
            'projectedPipelineRecovery', 0
          )
        end,
        true
      ),
      '{priorityIssues}',
      case
        when jsonb_typeof(cc2.contract_report_data->'priorityIssues') = 'array'
          then cc2.contract_report_data->'priorityIssues'
        else '[]'::jsonb
      end,
      true
    ) as contract_report_data
  from contract_complete_2 cc2
),
contract_complete_4 as (
  select
    cc3.id,
    jsonb_set(
      jsonb_set(
        cc3.contract_report_data,
        '{priorityIndex}',
        case
          when jsonb_typeof(cc3.contract_report_data->'priorityIndex') = 'array'
            then cc3.contract_report_data->'priorityIndex'
          else '[]'::jsonb
        end,
        true
      ),
      '{objectionCoverage}',
      case
        when jsonb_typeof(cc3.contract_report_data->'objectionCoverage') = 'object'
          then cc3.contract_report_data->'objectionCoverage'
        else jsonb_build_object(
          'score', 0,
          'identified', '[]'::jsonb,
          'missing', jsonb_build_array(
            jsonb_build_object(
              'objection', 'insufficient signal depth',
              'severity', 'low',
              'evidence', 'Insufficient signal depth: structured evidence unavailable.',
              'impact', 'insufficient signal depth'
            )
          ),
          'risks', jsonb_build_array('insufficient signal depth'),
          'guidance', jsonb_build_array(
            jsonb_build_object(
              'objection', 'insufficient signal depth',
              'recommendedStrategy', 'Collect additional source and competitor evidence.'
            )
          )
        )
      end,
      true
    ) as contract_report_data
  from contract_complete_3 cc3
),
contract_complete_5 as (
  select
    cc4.id,
    jsonb_set(
      cc4.contract_report_data,
      '{differentiationInsights}',
      case
        when jsonb_typeof(cc4.contract_report_data->'differentiationInsights') = 'object'
          then cc4.contract_report_data->'differentiationInsights'
        else jsonb_build_object(
          'similarityScore', 0,
          'overlapAreas', jsonb_build_array('insufficient signal depth'),
          'opportunities', jsonb_build_array(
            jsonb_build_object(
              'theme', 'insufficient signal depth',
              'rationale', 'insufficient signal depth',
              'implementationDifficulty', 'medium',
              'expectedImpact', 'low'
            )
          ),
          'strategyRecommendations', jsonb_build_array('Collect stronger source and competitor evidence.'),
          'parityRisks', jsonb_build_array('insufficient signal depth'),
          'strategicNarrativeDifferences', jsonb_build_array(
            jsonb_build_object(
              'difference', 'insufficient signal depth',
              'evidence', jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'snippet', 'Insufficient signal depth: structured evidence unavailable.'
                )
              ),
              'confidence', 0,
              'actionPriority', 'P2'
            )
          ),
          'underservedPositioningTerritories', jsonb_build_array(
            jsonb_build_object(
              'territory', 'insufficient signal depth',
              'rationale', 'insufficient signal depth',
              'evidence', jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'snippet', 'Insufficient signal depth: structured evidence unavailable.'
                )
              ),
              'confidence', 0,
              'actionPriority', 'P2'
            )
          ),
          'credibleDifferentiationAxes', jsonb_build_array(
            jsonb_build_object(
              'axis', 'insufficient signal depth',
              'rationale', 'insufficient signal depth',
              'evidence', jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'snippet', 'Insufficient signal depth: structured evidence unavailable.'
                )
              ),
              'confidence', 0,
              'actionPriority', 'P2'
            )
          ),
          'marketPerceptionRisks', jsonb_build_array(
            jsonb_build_object(
              'risk', 'insufficient signal depth',
              'whyItMatters', 'insufficient signal depth',
              'evidence', jsonb_build_array(
                jsonb_build_object(
                  'competitor', 'insufficient signal depth',
                  'snippet', 'Insufficient signal depth: structured evidence unavailable.'
                )
              ),
              'confidence', 0,
              'actionPriority', 'P2'
            )
          ),
          'recommendedPositioningDirection', jsonb_build_object(
            'direction', 'insufficient signal depth',
            'rationale', 'insufficient signal depth',
            'supportingEvidence', jsonb_build_array(
              jsonb_build_object(
                'competitor', 'insufficient signal depth',
                'snippet', 'Insufficient signal depth: structured evidence unavailable.'
              )
            ),
            'confidence', 0,
            'actionPriority', 'P2'
          )
        )
      end,
      true
    ) as final_report_data
  from contract_complete_4 cc4
)
update public.conversion_gap_reports r
set report_data = p.final_report_data
from contract_complete_5 p
where r.id = p.id;

commit;
