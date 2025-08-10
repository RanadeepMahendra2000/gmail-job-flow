import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    snippet?: string;
  };
  snippet: string;
}

interface ParsedApplication {
  company: string;
  role: string | null;
  status: 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'ghosted' | 'withdrawn' | 'other';
  applied_at: string;
  snippet: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create authenticated supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    console.log(`Starting Gmail sync for user: ${user.id}`);

    // Get user's Google refresh token from auth.identities
    const { data: identities, error: identitiesError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (identitiesError || !identities) {
      throw new Error('Failed to fetch user identities');
    }

    const googleIdentity = identities.user.identities?.find(id => id.provider === 'google');
    if (!googleIdentity) {
      throw new Error('No Google identity found for user');
    }

    const refreshToken = googleIdentity.identity_data?.refresh_token;
    if (!refreshToken) {
      throw new Error('No refresh token found. Please re-authenticate with Google.');
    }

    // Get fresh access token
    const accessToken = await getGoogleAccessToken(refreshToken);

    // Fetch Gmail messages
    const messages = await fetchGmailMessages(accessToken);
    console.log(`Fetched ${messages.length} messages from Gmail`);

    // Parse and upsert applications
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const message of messages) {
      try {
        const parsed = parseGmailMessage(message);
        if (!parsed) {
          skipped++;
          continue;
        }

        // Check if application already exists
        const { data: existing } = await supabaseClient
          .from('applications')
          .select('id')
          .eq('email_id', message.id)
          .single();

        const applicationData = {
          user_id: user.id,
          source: 'gmail' as const,
          company: parsed.company,
          role: parsed.role,
          status: parsed.status,
          applied_at: parsed.applied_at,
          email_id: message.id,
          thread_id: message.threadId,
          snippet: parsed.snippet,
          metadata: {
            headers: message.payload.headers.reduce((acc, header) => {
              acc[header.name.toLowerCase()] = header.value;
              return acc;
            }, {} as Record<string, string>)
          }
        };

        if (existing) {
          await supabaseClient
            .from('applications')
            .update(applicationData)
            .eq('id', existing.id);
          updated++;
        } else {
          await supabaseClient
            .from('applications')
            .insert(applicationData);
          created++;
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        skipped++;
      }
    }

    // Log sync results
    await supabaseClient
      .from('sync_logs')
      .insert({
        user_id: user.id,
        status: 'success',
        stats: {
          scanned: messages.length,
          created,
          updated,
          skipped
        }
      });

    const stats = { scanned: messages.length, created, updated, skipped };
    console.log('Sync completed:', stats);

    return new Response(
      JSON.stringify({ ok: true, stats }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Gmail sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getGoogleAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Google token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchGmailMessages(accessToken: string): Promise<GmailMessage[]> {
  // Search query for job-related emails
  const query = 'category:primary newer_than:90d (applied OR application OR interview OR assessment OR "coding test" OR recruiter OR "job opportunity" OR "position" OR "role")';
  
  // Get message list
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=200`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to fetch message list: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  const messageIds = listData.messages || [];

  // Fetch message details
  const messages: GmailMessage[] = [];
  for (const { id } of messageIds.slice(0, 50)) { // Limit to 50 for rate limiting
    try {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        messages.push(messageData);
      }
    } catch (error) {
      console.error(`Error fetching message ${id}:`, error);
    }
  }

  return messages;
}

function parseGmailMessage(message: GmailMessage): ParsedApplication | null {
  const headers = message.payload.headers.reduce((acc, header) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {} as Record<string, string>);

  const subject = headers.subject || '';
  const from = headers.from || '';
  const date = headers.date || '';
  const snippet = message.snippet || '';

  // Skip if not job-related
  if (!isJobRelated(subject, snippet, from)) {
    return null;
  }

  const company = extractCompany(subject, from);
  const role = extractRole(subject, snippet);
  const status = inferStatus(subject, snippet);
  const applied_at = parseAppliedAt(date);

  return {
    company,
    role,
    status,
    applied_at,
    snippet: snippet.slice(0, 500), // Limit snippet length
  };
}

function isJobRelated(subject: string, snippet: string, from: string): boolean {
  const text = `${subject} ${snippet} ${from}`.toLowerCase();
  
  const jobKeywords = [
    'application', 'applied', 'interview', 'assessment', 'coding test',
    'recruiter', 'hiring', 'position', 'role', 'job', 'career',
    'opportunity', 'talent', 'candidate', 'resume', 'cv'
  ];

  return jobKeywords.some(keyword => text.includes(keyword));
}

function extractCompany(subject: string, from: string): string {
  // Try to extract from email domain
  const emailMatch = from.match(/@([^.]+)\./);
  if (emailMatch) {
    const domain = emailMatch[1];
    if (!['gmail', 'outlook', 'yahoo', 'hotmail', 'recruiting', 'talent'].includes(domain.toLowerCase())) {
      return capitalize(domain);
    }
  }

  // Try to extract from sender name
  const nameMatch = from.match(/^([^<@]+)/);
  if (nameMatch) {
    const name = nameMatch[1].trim().replace(/"/g, '');
    const words = name.split(/\s+/);
    if (words.length > 0) {
      return words[0];
    }
  }

  // Try to extract from subject
  const subjectWords = subject.split(/[\s\-|—]+/);
  for (const word of subjectWords) {
    if (word.length > 2 && /^[A-Z]/.test(word)) {
      return word;
    }
  }

  return 'Unknown Company';
}

function extractRole(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`;
  
  // Common patterns for role extraction
  const patterns = [
    /(?:for|as|position|role)\s+(?:a\s+)?([^,.\n]+?)(?:\s+at|\s+with|\s*,|\s*\.|\s*\n|$)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Engineer|Developer|Manager|Analyst|Specialist|Lead|Director)/i,
    /(Software Engineer|Product Manager|Data Scientist|Frontend Developer|Backend Developer|Full Stack Developer)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const role = match[1].trim();
      if (role.length > 2 && role.length < 100) {
        return role;
      }
    }
  }

  return null;
}

function inferStatus(subject: string, snippet: string): ParsedApplication['status'] {
  const text = `${subject} ${snippet}`.toLowerCase();

  if (/interview|onsite|screen|schedule|meet|call/i.test(text)) {
    return 'interview';
  }
  if (/assessment|take[- ]home|cod(e|ing)|hackerrank|test/i.test(text)) {
    return 'assessment';
  }
  if (/offer|congratulations|pleased to|happy to/i.test(text)) {
    return 'offer';
  }
  if (/rejected|declined|unfortunately|not moving forward|not selected/i.test(text)) {
    return 'rejected';
  }
  
  return 'applied';
}

function parseAppliedAt(dateHeader: string): string {
  try {
    const date = new Date(dateHeader);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}