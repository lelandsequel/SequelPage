import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateEmailHtml(geography: string, industries: any[], totalLeads: number, leads: any[]): string {
  const industryRows = industries.map(ind => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${ind.industry}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${ind.score}/100
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        ${ind.reasoning}
      </td>
    </tr>
  `).join('');

  const leadsByIndustry: Record<string, any[]> = {};
  leads.forEach(lead => {
    if (!leadsByIndustry[lead.industry]) {
      leadsByIndustry[lead.industry] = [];
    }
    leadsByIndustry[lead.industry].push(lead);
  });

  const leadSections = Object.entries(leadsByIndustry).map(([industry, industryLeads]) => {
    const topLeads = industryLeads.slice(0, 5);
    const leadRows = topLeads.map(lead => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${lead.business_name}</strong><br>
          <span style="font-size: 12px; color: #6b7280;">${lead.website || 'No website'}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; background-color: ${lead.score < 50 ? '#fee2e2' : lead.score < 70 ? '#fef3c7' : '#d1fae5'}; color: ${lead.score < 50 ? '#dc2626' : lead.score < 70 ? '#d97706' : '#059669'};">
            ${lead.score}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
          ${lead.issues.slice(0, 3).join(', ')}
        </td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom: 32px;">
        <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 20px;">${industry} (${industryLeads.length} Leads)</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Business</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Score</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Top Issues</th>
            </tr>
          </thead>
          <tbody>
            ${leadRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Lead Discovery Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Weekly Lead Discovery Report</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 18px;">${geography}</p>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 32px; border-radius: 4px;">
        <h2 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">Executive Summary</h2>
        <p style="color: #1e40af; margin: 0; line-height: 1.6;">
          This week's automated discovery identified <strong>${industries.length} high-opportunity industries</strong> in ${geography}, 
          uncovering <strong>${totalLeads} potential clients</strong> with significant SEO improvement opportunities.
        </p>
      </div>

      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; border-bottom: 3px solid #667eea; padding-bottom: 12px;">Top Industries Identified</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Industry</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Score</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Reasoning</th>
          </tr>
        </thead>
        <tbody>
          ${industryRows}
        </tbody>
      </table>

      <h2 style="color: #1f2937; margin: 32px 0 20px 0; font-size: 24px; border-bottom: 3px solid #667eea; padding-bottom: 12px;">Top Leads by Industry</h2>
      ${leadSections}

      <div style="margin-top: 40px; padding: 24px; background: #f9fafb; border-radius: 8px; text-align: center;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          This is an automated report generated by CandlPage Lead Discovery System.<br>
          Generated on ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { campaignRunId, recipientEmail, geography, industries, totalLeads } = await req.json();

    if (!campaignRunId || !recipientEmail) {
      throw new Error('Campaign run ID and recipient email are required');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: leadLinks } = await supabase
      .from('campaign_run_leads')
      .select('lead_id, industry')
      .eq('campaign_run_id', campaignRunId);

    const leadIds = leadLinks?.map(l => l.lead_id) || [];

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds);

    const leadsWithIndustry = (leads || []).map(lead => {
      const link = leadLinks?.find(l => l.lead_id === lead.id);
      return {
        ...lead,
        industry: link?.industry || lead.industry,
      };
    });

    const emailHtml = generateEmailHtml(geography, industries, totalLeads, leadsWithIndustry);

    console.log(`Email would be sent to: ${recipientEmail}`);
    console.log(`Subject: Weekly Lead Discovery Report - ${geography}`);
    console.log(`Note: Email service integration required (Resend, SendGrid, etc.)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email report generated successfully',
        recipient: recipientEmail,
        geography,
        totalLeads,
        note: 'Email service integration required to send actual emails',
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
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