/**
 * Validates a report using Groq AI analysis with the last 15 chat messages as context.
 * @param {Object} params 
 * @param {string} params.reason 
 * @param {string} params.description
 * @param {Array}  params.recentMessages - last 15 messages [{sender, content, createdAt}]
 * @returns {Promise<boolean>} 
 */
const validateReport = async ({ reason, description, recentMessages = [] }) => {
  const apiKey = process.env.HYB_REPORT_API_KEY;

  // ------------------------------------------------------------------
  // Fallback: if no API key, use basic rule-based validation
  // ------------------------------------------------------------------
  if (!apiKey) {
    console.warn('[AI Validator] No HYB_REPORT_API_KEY found – using rule-based fallback');
    return _ruleBasedValidation({ reason, description });
  }

  if (!reason || !description) {
    console.log('[AI Validator] Invalid input: missing reason or description');
    return false;
  }

  try {
    // Build a human-readable transcript of the last 15 messages
    let chatContext = '';
    if (recentMessages && recentMessages.length > 0) {
      chatContext = recentMessages
        .map((m, i) => {
          const senderLabel = m.senderName || m.sender?.userName || m.sender?.fullName || 'User';
          const content = m.isDeleted ? '[deleted message]' : (m.content || '[image]');
          return `[${i + 1}] ${senderLabel}: ${content}`;
        })
        .join('\n');
    }

    const systemPrompt = `You are a content moderation AI for a community help platform called HYB (Help Your Buddy).
Your job is to decide whether a user report is VALID or INVALID based on:
- The report reason and description provided by the reporter
- The recent chat messages between the two users (if provided)

Rules:
1. Return ONLY a JSON object with fields: { "valid": boolean, "confidence": number (0-1), "reasoning": string }
2. A report is VALID if the chat messages or description clearly demonstrate the reported behavior
3. A report is INVALID if the description is vague, false, or the chat shows no such behavior
4. Be strict – do not validate reports that are frivolous or retaliatory
5. Context from messages is more important than description alone

Report reasons: spam, harassment, inappropriate_content, fraud, fake_request, abuse, other`;

    const userPrompt = `Report Reason: ${reason}
Reporter's Description: ${description}

Recent Chat Messages (last ${recentMessages.length}):
${chatContext || '(No chat messages available)'}

Based on the above, is this report valid?`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Validator] Groq API error:', response.status, errText);
      return _ruleBasedValidation({ reason, description });
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.warn('[AI Validator] Empty response from Groq');
      return _ruleBasedValidation({ reason, description });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.warn('[AI Validator] Could not parse JSON from Groq response:', rawContent);
      return _ruleBasedValidation({ reason, description });
    }

    const isValid = parsed?.valid === true;
    const confidence = parsed?.confidence ?? 0;

    console.log(`[AI Validator] Result: valid=${isValid}, confidence=${confidence}, reasoning=${parsed?.reasoning}`);

    // Require at least 60% confidence for a valid determination
    return isValid && confidence >= 0.6;

  } catch (error) {
    console.error('[AI Validator] Error during AI validation:', error);
    return _ruleBasedValidation({ reason, description });
  }
};

/**
 * Rule-based fallback when AI is unavailable
 */
const _ruleBasedValidation = ({ reason, description }) => {
  const validReasons = [
    'spam', 'harassment', 'inappropriate_content',
    'fraud', 'fake_request', 'abuse', 'other'
  ];
  const isValidReason = validReasons.includes(reason?.toLowerCase());
  const isDescriptionValid = (description?.trim()?.length || 0) >= 10;
  const result = isValidReason && isDescriptionValid;
  console.log(`[AI Validator] Rule-based fallback: ${result}`);
  return result;
};

/**
 * Analyzes report severity using AI
 */
const analyzeReportSeverity = async ({ reason, description }) => {
  try {
    const highSeverityReasons = ['violence', 'hate_speech', 'fraud', 'abuse'];
    const mediumSeverityReasons = ['harassment', 'inappropriate_content', 'fake_request'];

    if (highSeverityReasons.includes(reason?.toLowerCase())) return 'high';
    if (mediumSeverityReasons.includes(reason?.toLowerCase())) return 'medium';
    return 'low';
  } catch (error) {
    console.error('[AI Validator] Error analyzing severity:', error);
    return 'medium';
  }
};

/**
 * Validates a help request using Groq AI.
 * Checks if the request is spam, irrelevant, trolling, joke, or inappropriate.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @returns {Promise<{ isSpamOrIrrelevant: boolean, reasoning: string }>}
 */
const validateHelpRequest = async ({ title, description, category }) => {
  const apiKey = process.env.HYB_REPORT_API_KEY;

  if (!apiKey) {
    console.warn('[AI Help Request Validator] No HYB_REPORT_API_KEY found – skipping validation');
    return { isSpamOrIrrelevant: false, reasoning: 'No API key configured.' };
  }

  if (!title || !description) {
    return { isSpamOrIrrelevant: true, reasoning: 'Missing title or description.' };
  }

  try {
    const systemPrompt = `You are a content moderation AI for a community help platform called HYB (Help Your Buddy).
Your job is to decide whether a user's help request is SPAM, IRRELEVANT, TROLLING/JOKE, or DIRTY/INAPPROPRIATE.

Rules:
1. Return ONLY a JSON object with fields: { "isSpamOrIrrelevant": boolean, "confidence": number (0-1), "reasoning": string }
2. Mark isSpamOrIrrelevant as true if:
   - The request is spam, advertisements, promotional offers, or links to third-party sites.
   - The request is irrelevant to a community/campus mutual-help platform (e.g. random chats, testing, gibberish/nonsense, random letters, greeting messages like "hi", "hello" with no context).
   - The request is trolling, a joke, fake, or obviously non-serious.
   - The request is inappropriate, offensive, sexually explicit, abusive, or uses vulgar language/profanity.
3. Mark isSpamOrIrrelevant as false if:
   - The request is a legitimate query or offer for community/campus help, including sharing notes, academic assistance, looking for keys, buying/selling/borrowing books, lending/borrowing stationary or electronics, ordering/sharing food, seeking medical supplies/medicine, transport help, sports, lost & found, or general mutual aid.
   
Be strict – do not allow spam, gibberish, test requests, or inappropriate text.`;

    const userPrompt = `Category: ${category || 'none'}
Title: ${title}
Description: ${description}

Based on the above details, is this request spam, irrelevant, trolling, joke, or inappropriate?`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Help Request Validator] Groq API error:', response.status, errText);
      return { isSpamOrIrrelevant: false, reasoning: 'API error fallback.' };
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.warn('[AI Help Request Validator] Empty response from Groq');
      return { isSpamOrIrrelevant: false, reasoning: 'Empty response fallback.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.warn('[AI Help Request Validator] Could not parse JSON:', rawContent);
      return { isSpamOrIrrelevant: false, reasoning: 'Parse error fallback.' };
    }

    const isSpamOrIrrelevant = parsed?.isSpamOrIrrelevant === true;
    const confidence = parsed?.confidence ?? 0;
    const reasoning = parsed?.reasoning || '';

    console.log(`[AI Help Request Validator] Result: isSpamOrIrrelevant=${isSpamOrIrrelevant}, confidence=${confidence}, reasoning=${reasoning}`);

    // Require at least 60% confidence for a spam determination
    return {
      isSpamOrIrrelevant: isSpamOrIrrelevant && confidence >= 0.6,
      reasoning
    };

  } catch (error) {
    console.error('[AI Help Request Validator] Error during validation:', error);
    return { isSpamOrIrrelevant: false, reasoning: 'Exception error fallback.' };
  }
};

const _ruleBasedMarketplaceValidation = ({ title, description, category, listingType }) => {
  const text = `${title || ''} ${description || ''} ${category || ''} ${listingType || ''}`.toLowerCase();
  const compact = text.replace(/\s+/g, '');
  const blockedTerms = [
    'sex', 'porn', 'nude', 'drugs', 'weed', 'ganja', 'alcohol', 'weapon',
    'gun', 'knife', 'escort', 'casino', 'betting', 'hack', 'stolen', 'Condom', 'prostitute', 'escort', 'adult', 'xxx', 'gambling', 'illegal', 'scam', 'fraud', 'fake', 'troll', 'spam', 'test', 'joke', 'gibberish', 'nonsense', 'random letters', 'hi', 'hello'
  ];

  if (!title?.trim() || !description?.trim()) {
    return { isSpamOrIrrelevant: true, reasoning: 'Missing title or description.' };
  }
  if (title.trim().length < 3 || description.trim().length < 10) {
    return { isSpamOrIrrelevant: true, reasoning: 'The listing is too short to be useful.' };
  }
  if (blockedTerms.some((term) => text.includes(term))) {
    return { isSpamOrIrrelevant: true, reasoning: 'The listing appears to contain prohibited or inappropriate content.' };
  }
  if (/https?:\/\/|www\.|\.com|\.in/.test(text)) {
    return { isSpamOrIrrelevant: true, reasoning: 'External links or promotional text are not allowed in marketplace listings.' };
  }
  if (/(.)\1{7,}/.test(compact) || compact.length < 12) {
    return { isSpamOrIrrelevant: true, reasoning: 'The listing appears to be gibberish or spam.' };
  }

  return { isSpamOrIrrelevant: false, reasoning: '' };
};

/**
 * Validates a marketplace listing using Groq AI, with a conservative rule-based fallback.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @param {string} params.listingType
 * @returns {Promise<{ isSpamOrIrrelevant: boolean, reasoning: string }>}
 */
const validateMarketplaceListing = async ({ title, description, category, listingType }) => {
  const fallback = _ruleBasedMarketplaceValidation({ title, description, category, listingType });
  if (fallback.isSpamOrIrrelevant) return fallback;

  const apiKey = process.env.HYB_REPORT_API_KEY;
  if (!apiKey) {
    console.warn('[AI Marketplace Validator] No HYB_REPORT_API_KEY found - using rule-based fallback');
    return fallback;
  }

  try {
    const systemPrompt = `You are a strict content moderation AI for HYB Marketplace, a campus-only student marketplace.
Your job is to decide whether a sell/borrow listing is SPAM, IRRELEVANT, UNSAFE, FAKE, DIRTY, or INAPPROPRIATE.

Return ONLY JSON: { "isSpamOrIrrelevant": boolean, "confidence": number, "reasoning": string }

Mark true if:
- It is spam, promotional, gibberish, joke/test content, fake, or unrelated to campus buying/borrowing/lending.
- It sells or lends prohibited, unsafe, illegal, adult, stolen, abusive, hateful, or vulgar items/content.
- It asks users to leave HYB for suspicious external links.

Mark false if it is a normal campus item such as books, electronics, stationery, room items, cycles, lab equipment, sports items, clothing, or practical student belongings.`;

    const userPrompt = `Listing type: ${listingType || 'none'}
Category: ${category || 'none'}
Title: ${title}
Description: ${description}

Should this HYB Marketplace listing be blocked?`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Marketplace Validator] Groq API error:', response.status, errText);
      return fallback;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) return fallback;

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.warn('[AI Marketplace Validator] Could not parse JSON:', rawContent);
      return fallback;
    }

    const isSpamOrIrrelevant = parsed?.isSpamOrIrrelevant === true;
    const confidence = parsed?.confidence ?? 0;
    return {
      isSpamOrIrrelevant: isSpamOrIrrelevant && confidence >= 0.6,
      reasoning: parsed?.reasoning || fallback.reasoning
    };
  } catch (error) {
    console.error('[AI Marketplace Validator] Error during validation:', error);
    return fallback;
  }
};

export {
  validateReport,
  analyzeReportSeverity,
  validateHelpRequest,
  validateMarketplaceListing
};
