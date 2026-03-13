

## Delete Duplicate Parks

### Findings

13 duplicate park pairs found — all Washington state parks. Each pair has identical name, city, state, coordinates, and ratings. Neither copy in any pair has an `added_by` value, so we keep the lower-ID entry (the original) and delete the higher-ID duplicate.

### Duplicates to Delete (higher IDs)

| Keep Id | Delete Id | Park Name |
|---------|-----------|-----------|
| 141 | 176 | Marymoor Park (Doggy Disneyland) |
| 142 | 177 | Magnuson Park Off-Leash Area |
| 143 | 178 | Grandview Off-Leash Area |
| 144 | 179 | Fort Steilacoom Dog Park |
| 145 | 180 | Westcrest Park Off-Leash Area |
| 146 | 181 | Robinswood Off-Leash Area |
| 147 | 182 | Wapato Off-Leash Dog Park |
| 148 | 183 | Luther Burbank Dog Park |
| 149 | 184 | Edith Moulton Off-Leash Area |
| 150 | 185 | Genesee Off-Leash Area |
| 151 | 186 | Point Defiance Off-Leash Area |
| 152 | 187 | Beaver Lake Dog Park |
| 155 | 190 | French Lake Dog Park |

### Fix

Single SQL migration to delete the 13 duplicate rows by their specific IDs.

```sql
DELETE FROM parks WHERE "Id" IN (176,177,178,179,180,181,182,183,184,185,186,187,190);
```

No frontend changes needed.

| File | Change |
|------|--------|
| SQL migration | Delete 13 duplicate park rows by Id |

