import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert at analyzing rugby/sports kit images and extracting color and pattern information.

Analyze the provided image of a sports kit (jersey, shorts, socks) and extract the following information in JSON format:

{
  "primary": "#XXXXXX",        // Main jersey color (hex)
  "secondary": "#XXXXXX",      // Secondary jersey color (hex)
  "accent": "#XXXXXX",         // Accent color if visible, otherwise match primary
  "pattern": "solid|hoops|stripes|halves|quarters|yoke|band",
  "patternSize": "thin|medium|thick",
  "patternCount": 2-8,         // Number of stripes/hoops if applicable
  "collarTrim": "#XXXXXX",     // Collar trim color
  "cuffTrim": "#XXXXXX",       // Cuff/sleeve trim color
  "shortsColor": "#XXXXXX",    // Main shorts color
  "shortsTrim": "#XXXXXX",     // Shorts side stripe/trim color
  "sockPrimary": "#XXXXXX",    // Main sock color
  "sockSecondary": "#XXXXXX",  // Secondary sock color
  "sockPattern": "solid|hoops|two-tone",
  "sockHoopCount": 1-4         // Number of sock hoops if applicable
}

Pattern definitions:
- solid: Single color jersey
- hoops: Horizontal stripes
- stripes: Vertical stripes  
- halves: Left/right split colors
- quarters: Diagonal quarters
- yoke: Contrasting shoulder yoke/panel
- band: Horizontal chest band

Be as accurate as possible with hex color codes. If you can't see certain elements clearly, make reasonable assumptions based on the visible colors.

IMPORTANT: Return ONLY the JSON object, no additional text or markdown.`;

    console.log('Sending image to AI for analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this rugby/sports kit image and extract the colors and patterns. Return only the JSON object.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received');
    
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the AI response
    let kitData;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      kitData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse kit data from AI response');
    }

    // Validate and normalize the response
    const normalizedKit = {
      primary: kitData.primary || '#1a365d',
      secondary: kitData.secondary || '#ffffff',
      accent: kitData.accent || kitData.primary || '#c7a000',
      pattern: ['solid', 'hoops', 'stripes', 'halves', 'quarters', 'yoke', 'band'].includes(kitData.pattern) 
        ? kitData.pattern : 'solid',
      patternSize: ['thin', 'medium', 'thick'].includes(kitData.patternSize) 
        ? kitData.patternSize : 'medium',
      patternCount: Math.min(8, Math.max(2, parseInt(kitData.patternCount) || 4)),
      collarTrim: kitData.collarTrim || kitData.secondary || '#ffffff',
      cuffTrim: kitData.cuffTrim || kitData.secondary || '#ffffff',
      shortsColor: kitData.shortsColor || kitData.primary || '#1a365d',
      shortsTrim: kitData.shortsTrim || kitData.secondary || '#ffffff',
      sockPrimary: kitData.sockPrimary || kitData.primary || '#1a365d',
      sockSecondary: kitData.sockSecondary || kitData.secondary || '#ffffff',
      sockPattern: ['solid', 'hoops', 'two-tone'].includes(kitData.sockPattern) 
        ? kitData.sockPattern : 'solid',
      sockHoopCount: Math.min(4, Math.max(1, parseInt(kitData.sockHoopCount) || 2)),
    };

    console.log('Kit analysis complete:', normalizedKit);

    return new Response(JSON.stringify({ kit: normalizedKit }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('analyze-kit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
