import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IndustryScore {
  industry: string;
  score: number;
  reasoning: string;
}

interface Lead {
  business_name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  geography: string;
  industry: string;
  score: number;
  traffic_trend: string;
  has_schema: boolean;
  has_faq: boolean;
  has_org: boolean;
  meta_title_ok: boolean;
  meta_desc_ok: boolean;
  content_fresh_months?: number;
  core_web_vitals_lcp?: number;
  tech_stack?: string[];
  issues: string[];
  notes?: string;
  source: string;
  status: string;
  priority: string;
}

async function identifyTopIndustries(geography: string, count: number): Promise<IndustryScore[]> {
  const industries = [
    { industry: 'HVAC Services', score: 92, reasoning: 'High search volume, competitive market, strong local SEO need' },
    { industry: 'Plumbing Services', score: 90, reasoning: 'Emergency services demand, local search critical' },
    { industry: 'Landscaping', score: 88, reasoning: 'Seasonal high demand, visual portfolio importance' },
    { industry: 'Dental Practices', score: 87, reasoning: 'High-value patients, trust and reputation critical' },
    { industry: 'Law Firms', score: 86, reasoning: 'Competitive market, lead value extremely high' },
    { industry: 'Real Estate', score: 85, reasoning: 'Visual content heavy, local expertise showcase' },
    { industry: 'Roofing Services', score: 84, reasoning: 'Emergency needs, trust-based decisions' },
    { industry: 'Electrical Services', score: 83, reasoning: 'Safety concerns drive online research' },
    { industry: 'Auto Repair', score: 82, reasoning: 'Review-driven decisions, local proximity important' },
    { industry: 'Restaurant', score: 80, reasoning: 'High mobile search volume, visual content critical' },
  ];

  return industries.slice(0, count);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let supabase: any;
  let campaignRunId: string | null = null;

  try {
    const { geography, campaignId, manualRun = false } = await req.json();

    if (!geography) {
      throw new Error('Geography is required');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, supabaseKey);

    let campaign = null;
    if (campaignId) {
      const { data: campaignData } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      campaign = campaignData;
    }

    const industriesToSearch = campaign?.industries_to_search || 3;
    const leadsPerIndustry = campaign?.leads_per_industry || 10;

    const { data: campaignRun, error: runError } = await supabase
      .from('campaign_runs')
      .insert({
        campaign_id: campaignId || null,
        geography,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) throw runError;
    campaignRunId = campaignRun.id;

    console.log(`Starting automated discovery for ${geography}`);

    const topIndustries = await identifyTopIndustries(geography, industriesToSearch);
    console.log(`Identified top ${topIndustries.length} industries:`, topIndustries.map(i => i.industry));

    await supabase
      .from('campaign_runs')
      .update({ industries_found: topIndustries })
      .eq('id', campaignRun.id);

    const allLeads: Lead[] = [];
    const findLeadsUrl = `${supabaseUrl}/functions/v1/find-leads`;

    for (const industryScore of topIndustries) {
      console.log(`Searching for leads in ${industryScore.industry}...`);

      try {
        const response = await fetch(findLeadsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            geography,
            industry: industryScore.industry,
            maxResults: leadsPerIndustry,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to find leads for ${industryScore.industry}`);
          continue;
        }

        const data = await response.json();
        const industryLeads = data.leads || [];

        console.log(`Found ${industryLeads.length} leads for ${industryScore.industry}`);

        for (const lead of industryLeads) {
          allLeads.push(lead);

          if (lead.id) {
            await supabase.from('campaign_run_leads').insert({
              campaign_run_id: campaignRun.id,
              lead_id: lead.id,
              industry: industryScore.industry,
            });
          }
        }
      } catch (error) {
        console.error(`Error searching ${industryScore.industry}:`, error);
      }
    }

    await supabase
      .from('campaign_runs')
      .update({
        status: 'completed',
        total_leads_found: allLeads.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignRun.id);

    if (campaignId && !manualRun) {
      const scheduleMap: Record<string, string> = {
        daily: '1 day',
        weekly: '1 week',
        monthly: '1 month',
      };

      const schedule = campaign?.schedule || 'weekly';
      const interval = scheduleMap[schedule] || '1 week';

      await supabase
        .from('automated_campaigns')
        .update({
          last_run: new Date().toISOString(),
          next_run: new Date(Date.now() + (schedule === 'daily' ? 86400000 : schedule === 'weekly' ? 604800000 : 2592000000)).toISOString(),
        })
        .eq('id', campaignId);
    }

    if (campaign?.email_recipients && Array.isArray(campaign.email_recipients) && campaign.email_recipients.length > 0) {
      const emailUrl = `${supabaseUrl}/functions/v1/send-campaign-report`;

      for (const email of campaign.email_recipients) {
        try {
          await fetch(emailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              campaignRunId: campaignRun.id,
              recipientEmail: email,
              geography,
              industries: topIndustries,
              totalLeads: allLeads.length,
            }),
          });

          await supabase.from('email_delivery_log').insert({
            campaign_run_id: campaignRun.id,
            recipient_email: email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          await supabase.from('email_delivery_log').insert({
            campaign_run_id: campaignRun.id,
            recipient_email: email,
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
          });
        }
      }
    }

    console.log('Starting async lead enrichment...');
    const enrichUrl = `${supabaseUrl}/functions/v1/enrich-lead-metrics`;
    fetch(enrichUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        campaignRunId: campaignRun.id,
      }),
    }).catch(err => console.error('Enrichment trigger failed:', err));

    return new Response(
      JSON.stringify({
        success: true,
        campaignRunId: campaignRun.id,
        geography,
        industries: topIndustries,
        totalLeads: allLeads.length,
        leads: allLeads,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Automated discovery error:', error);

    if (supabase && campaignRunId) {
      await supabase
        .from('campaign_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaignRunId);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
        details: 'Check campaign_runs table for more information'
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