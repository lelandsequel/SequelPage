import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getDataForSEOBacklinks(domain: string): Promise<{
  backlinks_count?: number;
  referring_domains?: number;
}> {
  const dataForSeoKey = Deno.env.get("DATAFORSEO_API_KEY");

  if (!dataForSeoKey) {
    return {};
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

    const response = await fetch('https://api.dataforseo.com/v3/backlinks/summary/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${dataForSeoKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: cleanDomain,
      }]),
    });

    if (!response.ok) {
      console.error('DataForSEO Backlinks API error:', response.status);
      return {};
    }

    const data = await response.json();

    if (data.tasks && data.tasks[0]?.result && data.tasks[0].result.length > 0) {
      const metrics = data.tasks[0].result[0];

      return {
        backlinks_count: metrics.backlinks || undefined,
        referring_domains: metrics.referring_domains || undefined,
      };
    }

    return {};
  } catch (error) {
    console.error('DataForSEO Backlinks error:', error);
    return {};
  }
}

async function getDataForSEODomainMetrics(domain: string): Promise<{
  traffic_trend: string;
  domain_rank?: number;
  organic_traffic?: number;
}> {
  const dataForSeoKey = Deno.env.get("DATAFORSEO_API_KEY");

  if (!dataForSeoKey) {
    return {
      traffic_trend: 'Unknown',
    };
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

    const response = await fetch('https://api.dataforseo.com/v3/domain_analytics/google/overview/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${dataForSeoKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: cleanDomain,
        location_code: 2840,
        language_code: 'en',
      }]),
    });

    if (!response.ok) {
      console.error('DataForSEO Domain Analytics API error:', response.status);
      return { traffic_trend: 'Unknown' };
    }

    const data = await response.json();

    if (data.tasks && data.tasks[0]?.result && data.tasks[0].result.length > 0) {
      const metrics = data.tasks[0].result[0];

      const organicTraffic = metrics.metrics?.organic?.etv || 0;
      const organicTrend = metrics.metrics?.organic?.etv_difference || 0;

      let traffic_trend = 'Stable';
      if (organicTrend > 10) traffic_trend = 'Growing';
      else if (organicTrend < -10) traffic_trend = 'Declining';

      return {
        traffic_trend,
        domain_rank: metrics.metrics?.organic?.pos_1 || undefined,
        organic_traffic: organicTraffic || undefined,
      };
    }

    return { traffic_trend: 'Unknown' };
  } catch (error) {
    console.error('DataForSEO Domain Analytics error:', error);
    return { traffic_trend: 'Unknown' };
  }
}

async function getDataForSEOPageSpeed(url: string): Promise<{
  core_web_vitals_lcp?: number;
}> {
  const dataForSeoKey = Deno.env.get("DATAFORSEO_API_KEY");

  if (!dataForSeoKey) {
    return {};
  }

  try {
    const response = await fetch('https://api.dataforseo.com/v3/on_page/lighthouse/live/json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${dataForSeoKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        url: url,
        categories: ['performance'],
      }]),
    });

    if (!response.ok) {
      console.error('DataForSEO PageSpeed API error:', response.status);
      return {};
    }

    const data = await response.json();

    if (data.tasks && data.tasks[0]?.result && data.tasks[0].result.length > 0) {
      const metrics = data.tasks[0].result[0];
      const lcp = metrics.audits?.['largest-contentful-paint']?.numericValue;

      if (lcp) {
        return {
          core_web_vitals_lcp: Math.round(lcp),
        };
      }
    }

    return {};
  } catch (error) {
    console.error('DataForSEO PageSpeed error:', error);
    return {};
  }
}

function recalculateScore(lead: any): number {
  let score = 50;

  if (lead.has_schema) score += 10;
  if (lead.has_faq) score += 8;
  if (lead.has_org) score += 7;
  if (lead.meta_title_ok) score += 5;
  if (lead.meta_desc_ok) score += 5;

  if (lead.core_web_vitals_lcp) {
    if (lead.core_web_vitals_lcp <= 2500) score += 10;
    else if (lead.core_web_vitals_lcp <= 4000) score += 5;
  }

  if (lead.traffic_trend === 'Growing') score += 10;
  else if (lead.traffic_trend === 'Declining') score -= 10;

  if (lead.content_fresh_months !== undefined) {
    if (lead.content_fresh_months <= 3) score += 8;
    else if (lead.content_fresh_months <= 6) score += 4;
    else if (lead.content_fresh_months > 12) score -= 5;
  }

  const issueCount = lead.issues?.length || 0;
  score -= issueCount * 2;

  return Math.max(0, Math.min(100, score));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { campaignRunId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: campaignLeads } = await supabase
      .from('campaign_run_leads')
      .select('lead_id')
      .eq('campaign_run_id', campaignRunId);

    if (!campaignLeads || campaignLeads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No leads to enrich' }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const leadIds = campaignLeads.map(cl => cl.lead_id);

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('analysis_status', 'basic');

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No leads need enrichment' }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Starting enrichment for ${leads.length} leads`);
    let enrichedCount = 0;

    for (const lead of leads) {
      if (!lead.website) {
        console.log(`Skipping ${lead.business_name} - no website`);
        await supabase
          .from('leads')
          .update({ analysis_status: 'complete' })
          .eq('id', lead.id);
        continue;
      }

      console.log(`Enriching ${lead.business_name} - ${lead.website}`);
      const startTime = Date.now();

      try {
        const [domainMetrics, backlinkMetrics, pageSpeedMetrics] = await Promise.all([
          getDataForSEODomainMetrics(lead.website),
          getDataForSEOBacklinks(lead.website),
          getDataForSEOPageSpeed(lead.website),
        ]);

        const updates: any = {
          traffic_trend: domainMetrics.traffic_trend,
          domain_rank: domainMetrics.domain_rank,
          organic_traffic: domainMetrics.organic_traffic,
          backlinks_count: backlinkMetrics.backlinks_count,
          referring_domains: backlinkMetrics.referring_domains,
          core_web_vitals_lcp: pageSpeedMetrics.core_web_vitals_lcp || lead.core_web_vitals_lcp,
          analysis_status: 'complete',
        };

        const updatedLead = { ...lead, ...updates };

        if (updates.core_web_vitals_lcp && updates.core_web_vitals_lcp > 2500) {
          const issues = [...(lead.issues || [])];
          if (!issues.includes('Slow LCP (>2.5s)')) {
            issues.push('Slow LCP (>2.5s)');
          }
          updates.issues = issues;
          updatedLead.issues = issues;
        }

        updates.score = recalculateScore(updatedLead);

        await supabase
          .from('leads')
          .update(updates)
          .eq('id', lead.id);

        enrichedCount++;
        const endTime = Date.now();
        console.log(`Enriched ${lead.business_name} in ${(endTime - startTime) / 1000}s`);

      } catch (error) {
        console.error(`Failed to enrich ${lead.business_name}:`, error);
        await supabase
          .from('leads')
          .update({ analysis_status: 'complete' })
          .eq('id', lead.id);
      }
    }

    console.log(`Enrichment complete. Processed ${enrichedCount} of ${leads.length} leads`);

    return new Response(
      JSON.stringify({
        success: true,
        enrichedCount,
        totalLeads: leads.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Enrichment error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});