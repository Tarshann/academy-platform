# Lighthouse Performance Audit Guide
## The Academy Platform

## Quick Start

### 1. Build Production Version
```bash
pnpm build
```

### 2. Start Production Server
```bash
pnpm start
```

### 3. Run Lighthouse
1. Open Chrome and navigate to `http://localhost:3000`
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select all categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
5. Select "Desktop" or "Mobile" device
6. Click "Analyze page load"

## Target Scores

### Performance
- **Target**: > 90
- **Key Metrics**:
  - First Contentful Paint (FCP): < 1.8s
  - Largest Contentful Paint (LCP): < 2.5s
  - Total Blocking Time (TBT): < 200ms
  - Cumulative Layout Shift (CLS): < 0.1
  - Speed Index: < 3.4s

### Accessibility
- **Target**: > 95
- **Key Checks**:
  - Color contrast ratios
  - ARIA attributes
  - Alt text on images
  - Keyboard navigation
  - Semantic HTML

### Best Practices
- **Target**: > 90
- **Key Checks**:
  - HTTPS usage
  - No console errors
  - Image aspect ratios
  - Deprecated APIs

### SEO
- **Target**: > 95
- **Key Checks**:
  - Meta descriptions
  - Title tags
  - Structured data
  - Mobile-friendly

## Common Issues & Fixes

### Performance Issues

#### Large Images
**Issue**: Images not optimized
**Fix**: 
- Use WebP format with fallbacks
- Implement responsive images (srcset)
- Compress images before upload
- Use image CDN

#### Render-Blocking Resources
**Issue**: CSS/JS blocking page render
**Fix**:
- Code splitting (already implemented ✅)
- Lazy load non-critical CSS
- Defer non-critical scripts

#### Unused JavaScript
**Issue**: Large bundle size
**Fix**:
- Tree-shaking (Vite handles this ✅)
- Remove unused dependencies
- Use dynamic imports

### Accessibility Issues

#### Color Contrast
**Issue**: Text doesn't meet WCAG AA (4.5:1)
**Fix**:
- Use lighter text colors on dark backgrounds
- Add text shadows for gradient text (already implemented ✅)
- Test with contrast checker

#### Missing Alt Text
**Issue**: Images without alt attributes
**Fix**:
- Add descriptive alt text to all images (already implemented ✅)
- Use empty alt="" for decorative images

### SEO Issues

#### Missing Meta Descriptions
**Issue**: Pages without descriptions
**Fix**:
- Add unique meta descriptions (already implemented ✅)
- Keep descriptions 150-160 characters

#### Missing Structured Data
**Issue**: No schema markup
**Fix**:
- Add JSON-LD structured data (already implemented ✅)
- Validate with Google's Rich Results Test

## Testing Checklist

- [ ] Run Lighthouse on homepage
- [ ] Run Lighthouse on Programs page
- [ ] Run Lighthouse on Shop page
- [ ] Run Lighthouse on mobile view
- [ ] Check all scores meet targets
- [ ] Review opportunities for improvement
- [ ] Fix critical issues
- [ ] Re-run audit to verify fixes

## Performance Budget

Recommended limits:
- **JavaScript**: < 200KB (gzipped)
- **CSS**: < 50KB (gzipped)
- **Images**: < 500KB per image
- **Total Page Weight**: < 2MB

## Tools

- **Lighthouse**: Built into Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org/
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
