# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

- **icon-192x192.png** - 192x192 pixels
- **icon-512x512.png** - 512x512 pixels

---

## Quick Start: Generate Icons

### Method 1: Use the Icon Generator (Easiest)

1. **Open the generator:**
   ```bash
   # Double-click this file in your file explorer:
   assets/icons/generate-icons.html
   ```
   Or open it in your browser directly.

2. **Customize (optional):**
   - Change the text (default: "N4")
   - Change the background color (default: #1e3a8a)
   - Click "Regenerate"

3. **Download:**
   - Click "⬇️ Download 192x192" button
   - Click "⬇️ Download 512x512" button
   - Save both files to this directory

4. **Done!** Icons are ready for your PWA

---

## Icon Design Guidelines

- **Square aspect ratio (1:1)** - No rectangles
- **Simple, recognizable design** - Clear at small sizes
- **Good contrast** - Works on light and dark backgrounds
- **Safe area padding** - Leave ~10% space on all sides
- **Maskable support** - Key elements centered

## Recommended Sizes

| Size | Purpose |
|------|---------|
| 192×192 | Standard app icon, splash screen |
| 512×512 | High-res displays, splash screen |

---

## Professional Icon Design

For production-quality icons, consider these tools:

### Free Tools
- **[Figma](https://www.figma.com)** - Professional design tool
- **[Canva](https://www.canva.com)** - Easy templates and icons
- **[RealFaviconGenerator](https://realfavicongenerator.net/)** - Automated icon generation

### Design Services
- **Fiverr** - Affordable professional designers
- **99designs** - Design contests
- **Upwork** - Freelance designers

---

## Icon Specifications

### Technical Requirements
- **Format:** PNG (24-bit or 32-bit with alpha)
- **Color Space:** sRGB
- **Compression:** Lossless PNG
- **Transparency:** Optional (but recommended for adaptive icons)

### Design Best Practices
1. **Centered focal point** - Main element in center
2. **High contrast text** - If using text, make it bold and legible
3. **Avoid fine details** - They get lost at small sizes
4. **Test at different sizes** - Preview at 48px, 96px, 192px
5. **Consider dark mode** - Icon should work on dark backgrounds

---

## Suggested Design Ideas

**For Hotel Number Four:**
- "N4" text on dark blue background (#1e3a8a)
- Simplified hotel building icon
- Key symbol (hotel theme)
- Bed icon with "N4"
- Minimalist "4" with hotel accent

**Color Scheme:**
- Primary: #1e3a8a (dark blue)
- Accent: #f59e0b (amber)
- Text: #ffffff (white)

---

## Image Magick Command (Alternative)

If you have ImageMagick installed:

```bash
# Create simple text icon
convert -size 512x512 xc:#1e3a8a \
  -gravity center \
  -pointsize 200 \
  -fill white \
  -font Arial-Bold \
  -annotate +0+0 "N4" \
  icon-512x512.png

# Resize for smaller version
convert icon-512x512.png \
  -resize 192x192 \
  icon-192x192.png
```

---

## Validation

After creating icons, validate them:

1. **File names match exactly:**
   - `icon-192x192.png`
   - `icon-512x512.png`

2. **Dimensions correct:**
   - Use image properties or:
   ```bash
   file icon-*.png
   ```

3. **Test in PWA:**
   - Install app on mobile device
   - Check icon appearance on home screen
   - Verify splash screen looks good

---

## Troubleshooting

**Icon not showing:**
- Check file names are exact (case-sensitive)
- Verify files are in `/assets/icons/` directory
- Clear browser cache and reinstall PWA
- Check browser console for 404 errors

**Icon looks blurry:**
- Ensure using PNG format (not JPEG)
- Verify exact pixel dimensions (192×192, 512×512)
- Don't scale up smaller images - create at full size

**Icon has white background:**
- Save with transparency (alpha channel)
- Use PNG-24 or PNG-32 format
- Check design software export settings

---

## Status

- ⏳ **Placeholder icons needed** - Use `generate-icons.html` to create
- ✅ **Generator ready** - See `generate-icons.html`
- 🎨 **Custom design optional** - Can replace placeholders later

---

**Last Updated:** 2025-11-15
