# Open Graph Image Guide

## Required Image: og-image.png

Your site is configured to use an Open Graph image at:
`greeny-corner-frontend/public/og-image.png`

This image will be displayed when your website is shared on social media platforms like Facebook, Twitter, LinkedIn, WhatsApp, etc.

## Image Specifications

- **Dimensions**: 1200 x 630 pixels (recommended)
- **Format**: PNG or JPG
- **File size**: Under 1MB for best performance
- **Safe zone**: Keep important content within center 1200 x 600px

## Design Recommendations

Your og-image should include:
1. **Greeny Corner logo** - prominently displayed
2. **Tagline** - "Smart Plant Care & Identification App"
3. **Visual elements** - plant imagery or icons
4. **Brand colors** - Use your emerald/teal green theme
5. **High contrast text** - for readability on all platforms

## Tools to Create Your OG Image

### Online Tools (Free):
- **Canva**: https://www.canva.com (Templates available)
- **Figma**: https://www.figma.com (Design from scratch)
- **Remove.bg**: For creating transparent plant images

### Quick Template:
1. Use Canva's "Social Media" → "Facebook Post" template
2. Resize to 1200 x 630px
3. Add your logo (greeny-logo.svg)
4. Add text overlay
5. Export as PNG

## Example Layout

```
┌─────────────────────────────────────┐
│                                     │
│     [Greeny Corner Logo]            │
│                                     │
│   Smart Plant Care &                │
│   Identification App                │
│                                     │
│   [Plant Image/Icon]  Track • Care • Grow  │
│                                     │
└─────────────────────────────────────┘
```

## Testing Your OG Image

After adding your image, test it with these tools:
1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Current Status

⚠️ **Action Required**: Create and add `og-image.png` to the `greeny-corner-frontend/public/` directory.

The image URL is already configured in your metadata. Once you add the image file, it will automatically be used when your site is shared on social media.

## Alternative: Using Your Current Logo

If you want to use your existing logo temporarily:
1. The system will fall back to `/greeny-logo.svg`
2. However, a dedicated OG image with more context performs better on social media
3. Consider creating a proper OG image for better engagement

## Questions?

- OG Image dimensions: 1200 x 630 pixels
- Location: `public/og-image.png`
- Format: PNG (with transparency support) or JPG
