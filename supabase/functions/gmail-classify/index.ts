import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassificationRequest {
  emailId?: string;
  rawHeaders?: Record<string, string>;
  snippet?: string;
}

interface ClassificationResult {
  company: string;
  role: string | null;
  status: 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'ghosted' | 'withdrawn' | 'other';
  applied_at: string;
  confidence: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ClassificationRequest = await req.json();
    
    let result: ClassificationResult;

    if (body.emailId) {
      // Fetch email from Gmail API and classify
      result = await classifyByEmailId(body.emailId, req);
    } else if (body.rawHeaders && body.snippet) {
      // Classify from provided data
      result = classifyFromData(body.rawHeaders, body.snippet);
    } else {
      throw new Error('Either emailId or rawHeaders+snippet must be provided');
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Classification error:', error);
    
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

async function classifyByEmailId(emailId: string, req: Request): Promise<ClassificationResult> {
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

  // Get user's Google refresh token
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

  // Fetch email from Gmail
  const messageResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!messageResponse.ok) {
    throw new Error(`Failed to fetch email: ${messageResponse.statusText}`);
  }

  const messageData = await messageResponse.json();
  const headers = messageData.payload.headers.reduce((acc: Record<string, string>, header: any) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {});

  return classifyFromData(headers, messageData.snippet || '');
}

function classifyFromData(headers: Record<string, string>, snippet: string): ClassificationResult {
  const subject = headers.subject || '';
  const from = headers.from || '';
  const date = headers.date || '';

  const company = extractCompany(subject, from);
  const role = extractRole(subject, snippet);
  const status = inferStatus(subject, snippet);
  const applied_at = parseAppliedAt(date);
  const confidence = calculateConfidence(subject, snippet, from);

  return {
    company,
    role,
    status,
    applied_at,
    confidence
  };
}

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

function inferStatus(subject: string, snippet: string): ClassificationResult['status'] {
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

function calculateConfidence(subject: string, snippet: string, from: string): number {
  let confidence = 0.5; // Base confidence

  const text = `${subject} ${snippet} ${from}`.toLowerCase();
  
  // Job-related keywords increase confidence
  const jobKeywords = [
    'application', 'applied', 'interview', 'assessment', 'coding test',
    'recruiter', 'hiring', 'position', 'role', 'job', 'career'
  ];
  
  const matchingKeywords = jobKeywords.filter(keyword => text.includes(keyword));
  confidence += matchingKeywords.length * 0.1;

  // Company email domain increases confidence
  if (/@(?!gmail|outlook|yahoo|hotmail)/.test(from)) {
    confidence += 0.2;
  }

  // Specific status indicators increase confidence
  if (/interview|assessment|offer|rejected/i.test(text)) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1.0);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}