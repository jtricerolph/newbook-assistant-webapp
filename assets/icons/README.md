# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

- **icon-192x192.png** - 192x192 pixels
- **icon-512x512.png** - 512x512 pixels

## Icon Design Guidelines

- Square aspect ratio (1:1)
- Simple, recognizable design
- Good contrast for both light and dark backgrounds
- Include padding/safe area (about 10% on each side)

## Suggested Design

Use the hotel/building icon or "N4" logo on a solid color background matching the theme color (#1e3a8a - dark blue).

## How to Create

1. Use a tool like:
   - Canva
   - Figma
   - Adobe Illustrator
   - Online PWA icon generator

2. Export in PNG format at the required sizes

3. Place files in this directory

## Temporary Solution

Until proper icons are created, you can use placeholder images or simply colored squares with text. The app will still function, but the install experience won't be as polished.

## Image Magick Command (if available)

```bash
# Create a simple placeholder icon
convert -size 512x512 xc:#1e3a8a -gravity center -pointsize 200 -fill white -annotate +0+0 "N4" icon-512x512.png
convert icon-512x512.png -resize 192x192 icon-192x192.png
```
