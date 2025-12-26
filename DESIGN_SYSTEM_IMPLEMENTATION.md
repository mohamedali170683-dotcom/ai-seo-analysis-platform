# Dashboard Design System - Implementation Guide

## Overview

This project now implements a comprehensive, evidence-based dashboard design system based on peer-reviewed cognitive science research. All pages should follow these principles for consistency and optimal user experience.

**Research Foundation:**
- Miller's Law (1956): 7±2 chunks in working memory
- Sweller's Cognitive Load Theory (1988)
- Tufte's Data-Ink Ratio (1983)
- Few's Dashboard Design (2006, 2013)
- Nielsen Norman Group eye-tracking research

## System Location

**Primary file:** `/lib/theme/design-system.ts`
**Colors file:** `/lib/theme/colors.ts` (exports both `DASHBOARD_COLORS` and `SEMANTIC_COLORS`)
**Components:** `/components/Dashboard/` and `/components/Charts/`

## Core Principles Already Implemented

### 1. Semantic Color System ✅

```typescript
import { SEMANTIC_COLORS, getStatusColor } from '@/lib/theme/colors';

// Use semantic colors for data
const color = getStatusColor(75); // Returns '#16a34a' (green)

// Color meanings (NEVER reverse these):
// positive: '#16a34a'  - Green - above target, success
// warning: '#d97706'   - Amber - needs monitoring
// critical: '#dc2626'  - Red - needs immediate attention
// muted: '#6b7280'     - Gray - secondary, non-actionable data
```

**Already applied to:**
- ✅ DashboardHero component
- ✅ SummaryCard component (uses status colors)
- ✅ BulletGraph component
- ✅ Sparkline component

### 2. Progressive Disclosure Pattern ✅

**Implemented in:**
- ✅ CollapsibleSection component
- ✅ SummaryCardsGrid (collapsed by default)
- ✅ Results page (journey stages with expand/collapse)

**Pattern:**
```typescript
const [expandedSections, setExpandedSections] = useState({});

// All sections collapsed by default
// User clicks to reveal details
```

### 3. Visual Hierarchy (3 Tiers) ✅

**Tier 1 - Primary (Always visible):**
- Large score display (64px font, DashboardHero)
- Critical metrics only
- Position: Top, no scroll required

**Tier 2 - Secondary (Below fold):**
- Summary cards grid
- Key supporting metrics
- Status indicators

**Tier 3 - Tertiary (Hidden by default):**
- Detailed breakdowns
- Historical data
- Full explanations

### 4. Evidence-Based Chart Components ✅

**Sparkline:** Pure SVG trend visualization
- Replaces complex charts for at-a-glance trends
- 80x24px default size (configurable)
- Minimal, high data-ink ratio

**BulletGraph:** Stephen Few's design for KPIs
- Replaces gauges, meters, dials
- Shows actual vs target vs qualitative ranges
- Space-efficient, information-dense

**SentimentBar:** Diverging stacked bar
- For sentiment analysis (positive/neutral/negative)
- Shows opposing values with clear visual weight

## Implementation Checklist for Each Page

### For Data Dashboard Pages (automation, alerts, webhooks, results)

- [ ] **Import design system**
  ```typescript
  import { SEMANTIC_COLORS, getStatusColor, getStatusClasses } from '@/lib/theme/colors';
  import { DashboardHero } from '@/components/Dashboard';
  ```

- [ ] **Replace old score displays with DashboardHero**
  ```tsx
  <DashboardHero
    score={overallScore}
    maxScore={100}
    trend={trendData}
    change={scoreChange}
    changeLabel="vs last scan"
  />
  ```

- [ ] **Use semantic colors consistently**
  ```tsx
  // ❌ WRONG
  <div className="text-green-600">Good</div>

  // ✅ RIGHT
  const classes = getStatusClasses(score);
  <div className={classes.text}>{getStatusLabel(score)}</div>
  ```

- [ ] **Apply progressive disclosure**
  ```tsx
  const [expandedSections, setExpandedSections] = useState({});

  <CollapsibleSection
    isExpanded={expandedSections['section-id']}
    onToggle={() => toggleSection('section-id')}
  >
    {detailedContent}
  </CollapsibleSection>
  ```

- [ ] **Limit visible modules to 7±2**
  - Count primary information modules
  - If > 9, collapse secondary sections by default
  - Use SummaryCards for at-a-glance view

- [ ] **Add sparklines to all metrics with trends**
  ```tsx
  import { Sparkline } from '@/components/Charts';

  <Sparkline
    data={trendArray}
    width={80}
    height={24}
    color={SEMANTIC_COLORS.neutral}
  />
  ```

- [ ] **Replace progress bars/gauges with BulletGraphs**
  ```tsx
  import { BulletGraph } from '@/components/Charts';

  <BulletGraph
    label="Visibility Score"
    actual={current}
    target={goal}
    max={100}
  />
  ```

- [ ] **Use 8px spacing grid**
  ```tsx
  // Use Tailwind classes that follow 8px grid:
  gap-2  // 8px
  gap-4  // 16px
  gap-6  // 24px
  gap-8  // 32px
  p-4    // 16px padding
  p-6    // 24px padding
  ```

### For Form/Input Pages (analyze, book-demo, etc.)

- [ ] **Use semantic colors for validation states**
  ```tsx
  // Error states
  <input className="border-critical" />

  // Success states
  <input className="border-positive" />
  ```

- [ ] **Maintain visual hierarchy**
  - Primary CTA buttons: Largest, most prominent
  - Secondary actions: Smaller, less emphasis
  - Tertiary/cancel actions: Text-only links

- [ ] **Consistent spacing**
  - Form fields: gap-4 (16px) between
  - Field groups: gap-6 (24px) between
  - Sections: gap-8 (32px) between

## Pages Status

### ✅ Fully Implemented
- `/app/results/[id]/page.tsx` - DashboardHero + SummaryCardsGrid integrated
- `/components/Dashboard/*` - All components follow design system
- `/components/Charts/*` - Sparkline, BulletGraph, SentimentBar

### ⚠️ Partially Implemented (has structure, needs enhancement)
- `/app/automation/page.tsx` - Has stats cards, needs sparklines
- `/app/alerts/page.tsx` - Has stats cards, needs progressive disclosure
- `/app/webhooks/page.tsx` - Has stats cards, needs sparklines

### ❌ Needs Implementation
- `/app/dashboard/page.tsx` - Main dashboard needs complete redesign
- `/app/hallucination-detector/page.tsx` - If data-heavy, apply principles

## Quick Wins for Each Page

### `/app/automation/page.tsx`

**Current state:** Has stats cards with icons
**Quick improvements:**
1. Add sparklines to "Total Runs" and "Success Rate" stats
2. Add BulletGraph for success rate visualization
3. Collapse execution history by default (progressive disclosure)
4. Use semantic colors for status badges

**Example:**
```tsx
// Add to stats card
<div className="flex items-center gap-2">
  <span className="text-2xl font-bold">{stats.totalRuns}</span>
  <Sparkline
    data={runsOverTime}
    width={60}
    height={20}
    color={SEMANTIC_COLORS.neutral}
  />
</div>
```

### `/app/alerts/page.tsx`

**Current state:** Has alert type overview grid
**Quick improvements:**
1. Add DashboardHero for total active alerts
2. Collapse alert configurations by default
3. Add sparklines to trigger count trends
4. Use BulletGraph for throttling visualization

### `/app/webhooks/page.tsx`

**Current state:** Has delivery stats
**Quick improvements:**
1. Add sparklines to success/failure trends
2. Collapse delivery history by default
3. Use BulletGraph for success rate
4. Gray out inactive webhooks (semantic color)

### `/app/dashboard/page.tsx`

**Current state:** Basic stats cards
**Recommended redesign:**
1. Add DashboardHero with total analyses count
2. Replace stats cards with SummaryCardsGrid
3. Add sparklines to show trend over time
4. Collapse FAQ section by default
5. Use progressive disclosure for recent analyses

## Anti-Patterns to Avoid

### ❌ DON'T

```tsx
// Don't use progress bars
<div className="w-full bg-gray-200 rounded">
  <div className="bg-green-600 h-2" style={{width: `${percent}%`}} />
</div>

// Don't use pie charts
<PieChart data={distribution} />

// Don't use gauges/meters
<CircularGauge value={score} />

// Don't show all details by default
<div>{expandedContent}</div>

// Don't use color without meaning
<div className="bg-gradient-to-r from-purple-500 to-pink-500">

// Don't use brand colors for data
<div className="text-blue-600">{metric}</div>
```

### ✅ DO

```tsx
// Use bullet graphs
<BulletGraph actual={score} target={target} />

// Use sparklines
<Sparkline data={trend} />

// Use stacked bars for part-to-whole
<div className="flex h-4">
  <div className="bg-green-100" style={{width: `${positive}%`}} />
  <div className="bg-gray-100" style={{width: `${neutral}%`}} />
  <div className="bg-red-100" style={{width: `${negative}%`}} />
</div>

// Use progressive disclosure
<CollapsibleSection isExpanded={false}>
  {expandedContent}
</CollapsibleSection>

// Use semantic colors
const classes = getStatusClasses(score);
<div className={classes.bg}>{metric}</div>

// Use gray for data, brand for navigation
<span className="text-gray-600">{metric}</span>
```

## Accessibility Checklist

Every page must meet these standards:

- [ ] **Keyboard navigation works**
  - Tab through all interactive elements
  - Enter/Space activates buttons
  - Escape closes modals

- [ ] **ARIA labels present**
  ```tsx
  <button aria-expanded={isExpanded} aria-controls="section-id">
  <div role="status" aria-live="polite">
  <svg role="img" aria-label="Trend showing...">
  ```

- [ ] **Color contrast meets WCAG 2.1**
  - Normal text: 4.5:1 minimum
  - Large text (18px+): 3:1 minimum
  - UI components: 3:1 minimum

- [ ] **Focus states visible**
  ```css
  :focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  ```

- [ ] **Color not sole indicator**
  - Status: Use color + icon + label
  - Alerts: Use color + icon + text
  - Trends: Use color + arrow + percentage

## Testing Guidelines

Before considering implementation complete:

### Cognitive Load Test
1. Show page to fresh user for 5 seconds
2. Remove page
3. Ask: "What was the most important number?"
4. If they can't answer → hero section needs work

### Information Hierarchy Test
1. Print page to grayscale
2. Can you still identify:
   - Primary metric?
   - Secondary metrics?
   - Actions needed?
3. If not → increase size/weight contrast

### Progressive Disclosure Test
1. Count visible information modules
2. If > 9 → move some behind progressive disclosure
3. Ensure critical data always visible without interaction

### Accessibility Test
1. Tab through entire page with keyboard
2. Use screen reader (Mac VoiceOver: Cmd+F5)
3. Test with browser zoom at 200%
4. Verify in colorblind mode (browser DevTools)

## Next Steps

### Immediate (High Priority)
1. ✅ Apply design system to results page (DONE)
2. ⏳ Enhance automation/alerts/webhooks pages with sparklines
3. ⏳ Add progressive disclosure to data-heavy sections
4. ⏳ Replace any remaining progress bars with BulletGraphs

### Short Term
1. Redesign main dashboard page with DashboardHero
2. Add trend data to all stat cards
3. Implement collapsible sections throughout
4. Add accessibility audit to CI/CD

### Long Term
1. Create Storybook documentation for all components
2. Add automated accessibility testing
3. Conduct user testing with 5-second tests
4. Create design system documentation site

## Resources

**Internal:**
- `/lib/theme/design-system.ts` - Full system specification
- `/lib/theme/colors.ts` - Color palette and helpers
- `/components/Dashboard/` - Reference implementations
- `/components/Charts/` - Visualization components

**External Research:**
- [Stephen Few - Dashboard Design](https://www.perceptualedge.com/articles/visual_business_intelligence/dashboard_design.pdf)
- [Edward Tufte - Data-Ink Ratio](https://thedoublethink.com/tuftes-principles-for-visualizing-quantitative-information/)
- [Nielsen Norman Group - Dashboard Usability](https://www.nngroup.com/articles/dashboard-design/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For questions about implementing the design system:
1. Check `/lib/theme/design-system.ts` for constants and helpers
2. Reference `/components/Dashboard/` components as examples
3. Review this implementation guide
4. Test changes with cognitive load/hierarchy tests above

**Remember:** The goal is not aesthetic perfection, but cognitive efficiency. Every design choice should reduce user effort and increase comprehension speed.
