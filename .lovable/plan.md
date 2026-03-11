

## Revert Two Labels

**1. `src/components/lost-dog/LostDogFAB.tsx`**
- Button label: `Pack Alert` → `Alert`
- aria-label: `Report Pack Alert` → `Report Lost Dog`

**2. `src/components/lost-dog/LostDogAlertModal.tsx`**
- Dialog title: `Report Pack Alert` → `Report Lost Dog`
- Success toast stays as-is (`Pack Alert sent!`)

