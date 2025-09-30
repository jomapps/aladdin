# Tailwind CSS with Next.js - Quick Reference

**Source:** https://tailwindcss.com/docs/installation/framework-guides/nextjs

## Installation Steps

### 1. Create Next.js Project
```bash
npx create-next-app@latest my-project --typescript --eslint --app
cd my-project
```

### 2. Install Tailwind CSS
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

### 3. Configure PostCSS
Create `postcss.config.mjs` in project root:

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 4. Import Tailwind CSS
Add to `./app/globals.css`:

```css
@import "tailwindcss";
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Use Tailwind Classes
Example in `page.tsx`:

```tsx
export default function Home() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

## Key Concepts

### Utility Classes
Style elements using pre-built classes:
- Typography: `text-3xl`, `font-bold`, `underline`
- Colors: `text-blue-500`, `bg-gray-100`
- Spacing: `p-4`, `m-2`, `gap-4`
- Layout: `flex`, `grid`, `block`

### Responsive Design
Use breakpoint prefixes:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

Example: `md:text-lg lg:flex`

### State Modifiers
Add state-based styles:
- `hover:bg-blue-500`
- `focus:ring-2`
- `active:scale-95`
- `disabled:opacity-50`

### Dark Mode
Use `dark:` prefix for dark mode styles:
```tsx
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  Content
</div>
```

### Custom Styles
When needed, extend Tailwind with custom CSS in your globals.css or component styles.

## Useful Resources

- [Documentation](https://tailwindcss.com/docs) - Full Tailwind CSS documentation
- [Playground](https://play.tailwindcss.com/) - Test Tailwind classes online
- [Headless UI](https://headlessui.com/) - Unstyled accessible components
- [Heroicons](https://heroicons.com/) - Beautiful SVG icons

