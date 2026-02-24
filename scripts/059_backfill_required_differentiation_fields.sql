-- 059: Backfill required differentiation contract fields for completed full reports

begin;

with target_reports as (
  select
    id,
    report_data
  from public.conversion_gap_reports
  where report_type = 'full'
    and status = 'completed'
    and jsonb_typeof(report_data) = 'object'
),
normalized_differentiation_root as (
  select
    id,
    case
      when jsonb_typeof(report_data -> 'differentiationInsights') = 'object' then report_data
      else jsonb_set(report_data, '{differentiationInsights}', '{}'::jsonb, true)
    end as report_data
  from target_reports
),
backfilled_differentiation as (
  select
    id,
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              report_data,
              '{differentiationInsights,strategicNarrativeDifferences}',
              case
                when jsonb_typeof(report_data #> '{differentiationInsights,strategicNarrativeDifferences}') = 'array'
                  then report_data #> '{differentiationInsights,strategicNarrativeDifferences}'
                else '[]'::jsonb
              end,
              true
            ),
            '{differentiationInsights,underservedPositioningTerritories}',
            case
              when jsonb_typeof(report_data #> '{differentiationInsights,underservedPositioningTerritories}') = 'array'
                then report_data #> '{differentiationInsights,underservedPositioningTerritories}'
              else '[]'::jsonb
            end,
            true
          ),
          '{differentiationInsights,credibleDifferentiationAxes}',
          case
            when jsonb_typeof(report_data #> '{differentiationInsights,credibleDifferentiationAxes}') = 'array'
              then report_data #> '{differentiationInsights,credibleDifferentiationAxes}'
            else '[]'::jsonb
          end,
          true
        ),
        '{differentiationInsights,marketPerceptionRisks}',
        case
          when jsonb_typeof(report_data #> '{differentiationInsights,marketPerceptionRisks}') = 'array'
            then report_data #> '{differentiationInsights,marketPerceptionRisks}'
          else '[]'::jsonb
        end,
        true
      ),
      '{differentiationInsights,recommendedPositioningDirection}',
      case
        when jsonb_typeof(report_data #> '{differentiationInsights,recommendedPositioningDirection}') = 'object'
          then report_data #> '{differentiationInsights,recommendedPositioningDirection}'
        else jsonb_build_object(
          'direction', 'insufficient data',
          'rationale', 'insufficient data',
          'supportingEvidence', '[]'::jsonb,
          'confidence', 0,
          'actionPriority', 'P2'
        )
      end,
      true
    ) as report_data
  from normalized_differentiation_root
),
backfilled_competitive_insights as (
  select
    id,
    jsonb_set(
      report_data,
      '{competitiveInsights}',
      case
        when jsonb_typeof(report_data -> 'competitiveInsights') = 'array' then
          coalesce(
            (
              select jsonb_agg(
                case
                  when jsonb_typeof(entry.item) = 'object' then
                    jsonb_set(
                      entry.item,
                      '{actionPriority}',
                      case
                        when entry.item ? 'actionPriority'
                          and jsonb_typeof(entry.item -> 'actionPriority') = 'string'
                          then entry.item -> 'actionPriority'
                        else '"P2"'::jsonb
                      end,
                      true
                    )
                  else entry.item
                end
                order by entry.ord
              )
              from jsonb_array_elements(report_data -> 'competitiveInsights') with ordinality as entry(item, ord)
            ),
            '[]'::jsonb
          )
        else '[]'::jsonb
      end,
      true
    ) as report_data
  from backfilled_differentiation
)
update public.conversion_gap_reports as reports
set report_data = patched.report_data
from backfilled_competitive_insights as patched
where reports.id = patched.id
  and reports.report_data is distinct from patched.report_data;

commit;
