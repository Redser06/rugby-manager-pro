import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Strict hex color validation
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/).or(z.string().transform(() => null));

// Schema for validating AI response
const KitResponseSchema = z.object({
  primary: hexColorSchema.optional(),
  secondary: hexColorSchema.optional(),
  accent: hexColorSchema.optional(),
  pattern: z.enum(['solid', 'hoops', 'stripes', 'halves', 'quarters', 'yoke', 'band']).optional(),
  patternSize: z.enum(['thin', 'medium', 'thick']).optional(),
  patternCount: z.number().int().min(2).max(8).optional().or(z.string().transform(s => {
    const n = parseInt(s);
    return isNaN(n) ? undefined : Math.min(8, Math.max(2, n));
  })),
  collarTrim: hexColorSchema.optional(),
  cuffTrim: hexColorSchema.optional(),
  shortsColor: hexColorSchema.optional(),
  shortsTrim: hexColorSchema.optional(),
  sockPrimary: hexColorSchema.optional(),
  sockSecondary: hexColorSchema.optional(),
  sockPattern: z.enum(['solid', 'hoops', 'two-tone']).optional(),
  sockHoopCount: z.number().int().min(1).max(4).optional().or(z.string().transform(s => {
    const n = parseInt(s);
    return isNaN(n) ? undefined : Math.min(4, Math.max(1, n));
  })),
}).passthrough();

// Generic error response helper
const errorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[AUTH] Missing authorization header');
      return errorResponse('Unauthorized', 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.warn('[AUTH] Unauthorized access attempt');
      return errorResponse('Unauthorized', 401);
    }

    console.log('[INFO] Request from authenticated user');

    // Rate limiting: 10 requests per hour per user
    const RATE_LIMIT_MAX = 10;
    const RATE_LIMIT_WINDOW_HOURS = 1;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabaseClient
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('endpoint', 'analyze-kit')
      .gte('created_at', windowStart);

    if (countError) {
      console.error('[RATE_LIMIT] Check error:', countError.message);
    } else if ((count ?? 0) >= RATE_LIMIT_MAX) {
      console.warn('[RATE_LIMIT] Exceeded for user');
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    console.log(`[RATE_LIMIT] ${count ?? 0}/${RATE_LIMIT_MAX} requests used`);

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return errorResponse('Invalid request format', 400);
    }

    const { imageBase64 } = requestBody;
    
    // Validate image is provided
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return errorResponse('No image provided', 400);
    }

    // Validate size limit (5MB base64 = ~3.75MB actual image)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (imageBase64.length > MAX_SIZE) {
      return errorResponse('Image too large. Maximum 5MB.', 413);
    }

    // Validate image format - check for data URL or raw base64
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
    const rawBase64Pattern = /^[A-Za-z0-9+/]+=*$/;
    
    const isDataUrl = dataUrlPattern.test(imageBase64);
    const isRawBase64 = rawBase64Pattern.test(imageBase64.slice(0, 100));
    
    if (!isDataUrl && !isRawBase64) {
      return errorResponse('Invalid image format', 400);
    }

    // Validate supported image types for data URLs
    if (isDataUrl) {
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const typeMatch = imageBase64.match(/^data:(.*?);base64,/);
      if (typeMatch && !supportedTypes.includes(typeMatch[1])) {
        return errorResponse('Unsupported image type', 400);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[CONFIG] Required environment variable not set');
      return errorResponse('Service temporarily unavailable', 503);
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

    // Record this request for rate limiting (do this before the AI call)
    const { error: insertError } = await supabaseClient
      .from('rate_limits')
      .insert({ user_id: user.id, endpoint: 'analyze-kit' });
    
    if (insertError) {
      console.error('[RATE_LIMIT] Failed to record:', insertError.message);
    }

    console.log('[AI] Sending image for analysis');

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
        return errorResponse('Service busy. Please try again later.', 429);
      }
      if (response.status === 402) {
        return errorResponse('Service temporarily unavailable.', 503);
      }
      console.error('[AI] Gateway error:', response.status);
      return errorResponse('Unable to analyze image. Please try again.', 500);
    }

    const aiResponse = await response.json();
    console.log('[AI] Response received');
    
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[AI] No content in response');
      return errorResponse('Unable to analyze image. Please try again.', 500);
    }

    // Parse the JSON from the AI response
    let kitData;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      kitData = JSON.parse(jsonStr);
    } catch {
      console.error('[AI] Failed to parse response as JSON');
      return errorResponse('Unable to analyze image. Please try again.', 500);
    }

    // Validate with Zod schema
    const parseResult = KitResponseSchema.safeParse(kitData);
    if (!parseResult.success) {
      console.error('[VALIDATION] Schema validation failed:', parseResult.error.message);
      // Continue with raw data but apply strict normalization
    }

    const validatedData = parseResult.success ? parseResult.data : kitData;

    // Safely extract and validate hex colors
    const safeHex = (value: unknown, fallback: string): string => {
      if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
        return value;
      }
      return fallback;
    };

    // Normalize the response with safe defaults
    const normalizedKit = {
      primary: safeHex(validatedData.primary, '#1a365d'),
      secondary: safeHex(validatedData.secondary, '#ffffff'),
      accent: safeHex(validatedData.accent, safeHex(validatedData.primary, '#c7a000')),
      pattern: ['solid', 'hoops', 'stripes', 'halves', 'quarters', 'yoke', 'band'].includes(validatedData.pattern) 
        ? validatedData.pattern : 'solid',
      patternSize: ['thin', 'medium', 'thick'].includes(validatedData.patternSize) 
        ? validatedData.patternSize : 'medium',
      patternCount: typeof validatedData.patternCount === 'number' 
        ? Math.min(8, Math.max(2, validatedData.patternCount)) 
        : 4,
      collarTrim: safeHex(validatedData.collarTrim, safeHex(validatedData.secondary, '#ffffff')),
      cuffTrim: safeHex(validatedData.cuffTrim, safeHex(validatedData.secondary, '#ffffff')),
      shortsColor: safeHex(validatedData.shortsColor, safeHex(validatedData.primary, '#1a365d')),
      shortsTrim: safeHex(validatedData.shortsTrim, safeHex(validatedData.secondary, '#ffffff')),
      sockPrimary: safeHex(validatedData.sockPrimary, safeHex(validatedData.primary, '#1a365d')),
      sockSecondary: safeHex(validatedData.sockSecondary, safeHex(validatedData.secondary, '#ffffff')),
      sockPattern: ['solid', 'hoops', 'two-tone'].includes(validatedData.sockPattern) 
        ? validatedData.sockPattern : 'solid',
      sockHoopCount: typeof validatedData.sockHoopCount === 'number' 
        ? Math.min(4, Math.max(1, validatedData.sockHoopCount)) 
        : 2,
    };

    console.log('[SUCCESS] Kit analysis complete');

    return new Response(JSON.stringify({ kit: normalizedKit }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error instanceof Error ? error.message : 'Unknown');
    return errorResponse('An error occurred. Please try again.', 500);
  }
});
