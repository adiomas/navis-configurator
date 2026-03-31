import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_JSON_SCHEMA = {
  name: 'price_list_extraction',
  strict: true,
  schema: {
    type: 'object',
    required: ['boat', 'specs', 'categories'],
    additionalProperties: false,
    properties: {
      boat: {
        type: 'object',
        required: ['name', 'brand', 'model', 'year', 'base_price', 'description_en', 'description_hr'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'Full boat name e.g. "Azimut Fly 62"' },
          brand: { type: 'string', description: 'Brand name e.g. "Azimut", "Pirelli"' },
          model: { type: 'string', description: 'Model name e.g. "Fly 62"' },
          year: { type: 'integer', description: 'Model year' },
          base_price: { type: 'number', description: 'Base price in EUR (number only, no currency symbols)' },
          description_en: { type: ['string', 'null'], description: 'Short English description of the boat' },
          description_hr: { type: ['string', 'null'], description: 'Short Croatian translation of the description' },
        },
      },
      specs: {
        type: 'array',
        items: {
          type: 'object',
          required: ['category', 'label_en', 'label_hr', 'value'],
          additionalProperties: false,
          properties: {
            category: { type: 'string', description: 'Spec category. MUST be exactly one of: Dimensions, Engine, Performance, Capacity, Other' },
            label_en: { type: 'string' },
            label_hr: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name_en', 'name_hr', 'items'],
          additionalProperties: false,
          properties: {
            name_en: { type: 'string' },
            name_hr: { type: ['string', 'null'] },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name_en', 'name_hr', 'description_en', 'description_hr', 'price', 'manufacturer_code', 'is_standard', 'is_discountable'],
                additionalProperties: false,
                properties: {
                  name_en: { type: 'string' },
                  name_hr: { type: ['string', 'null'] },
                  description_en: { type: ['string', 'null'] },
                  description_hr: { type: ['string', 'null'] },
                  price: { type: 'number', description: 'Price in EUR. Use 0 for standard/included items.' },
                  manufacturer_code: { type: ['string', 'null'], description: 'Manufacturer item code if present (e.g. CC00025516)' },
                  is_standard: { type: 'boolean', description: 'true if included in base price' },
                  is_discountable: { type: 'boolean', description: 'true unless explicitly marked as non-discountable' },
                },
              },
            },
          },
        },
      },
    },
  },
}

const SYSTEM_PROMPT = `You are a marine yacht price list extraction expert. Extract ALL data from the provided PDF price list.

Rules:
- Extract the boat name, brand, model, year, and base price.
- If there are multiple base prices (engine variants), use the lowest as base_price and add other variants as equipment items in an "Engine Options" category.
- Extract ALL specifications (dimensions, engines, performance, capacity).
- Extract ALL equipment items grouped by category exactly as they appear in the PDF.
- Standard/included equipment: is_standard=true, price=0.
- Optional equipment with prices: is_standard=false, price=actual price.
- If an item is marked as non-discountable (e.g., "No Discount", "ND"), set is_discountable=false.
- Preserve manufacturer codes (e.g., CC00025516) in manufacturer_code field.
- If a package contains multiple items with one total price, keep it as one item with contents in description.
- Translate ALL English text to Croatian for the _hr fields. Use proper nautical/marine terminology in Croatian.
- All prices must be numbers in EUR (no currency symbols, no thousands separators).
- If the PDF is in Italian, translate to English for _en fields and Croatian for _hr fields.
- Spec categories MUST be capitalized: Dimensions, Engine, Performance, Capacity, Other.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can import price lists' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { pdf_base64 } = await req.json()
    if (!pdf_base64) {
      return new Response(
        JSON.stringify({ error: 'Missing pdf_base64 field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call OpenAI API
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_EXTRACTION_MODEL') || 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'file',
                file: {
                  file_data: `data:application/pdf;base64,${pdf_base64}`,
                  filename: 'pricelist.pdf',
                },
              },
              {
                type: 'text',
                text: 'Extract all boat information, specifications, and equipment from this price list PDF. Return structured JSON.',
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: OPENAI_JSON_SCHEMA,
        },
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text()
      console.error('OpenAI API error:', errorBody)
      return new Response(
        JSON.stringify({ error: 'AI extraction failed. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'AI returned empty response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extracted = JSON.parse(content)

    return new Response(
      JSON.stringify(extracted),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
