
The RPC call in `src/hooks/useParkSuggestions.tsx` (line 110) currently passes only `suggestion_id`. Since the old single-arg function was dropped and the new function has `admin_notes_text` defaulting to NULL, calls already resolve fine — but to make the call explicit and unambiguous (and prevent regressions if signatures change again), update it to pass both arguments.

### Change

**`src/hooks/useParkSuggestions.tsx`** (line 110):
```ts
const { error } = await supabase.rpc('approve_park_suggestion', {
  suggestion_id: id,
  admin_notes_text: '',
});
```

That's the only file that calls this RPC — no other usages in the codebase. After this, approve flow is fully explicit and the Martinique park can be approved cleanly.
