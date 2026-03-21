

## Plan: Add medical/safety disclaimer to Explore Assistant system prompt

### Change

**File: `supabase/functions/explore-assistant/index.ts`**

Update the `systemPrompt` string (around line 83) to add a new guideline instructing the AI to include a medical/safety disclaimer when users ask health or emergency questions.

Add to the GUIDELINES section:
```
- If a user asks a medical, health, or safety-related question about their pet, ALWAYS include this disclaimer in your response: "I am an AI assistant, not a veterinarian. If your pet is having a medical emergency, please contact a professional vet immediately."
- Never provide specific medical diagnoses or treatment plans
```

### Files changed
- `supabase/functions/explore-assistant/index.ts` — system prompt update only

