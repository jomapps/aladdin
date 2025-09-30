# Kokonut UI with Next.js - Quick Reference

**Source:** https://kokonutui.com/docs

## What is Kokonut UI?

Kokonut UI is a collection of animated and interactive UI components built with Tailwind CSS v4. It works alongside Shadcn/ui and uses the same CLI installation pattern.

## Installation

### 1. Configure components.json (Optional)

The `components.json` file is **only required if using the CLI**. If you're copying and pasting components, you can skip this step.

Add the Kokonut UI registry to your `components.json`:

```json
{
  "registries": {
    "@kokonutui": "https://kokonutui.com/r/{name}.json"
  }
}
```

### 2. Install Required Utilities

Ensure you have:
- **Tailwind CSS v4** installed (required for all components)
- **cn utility function** (used by many components)

Install the cn utility:
```bash
npx shadcn@latest add utils
```

### 3. Install Components

Add components using the Shadcn CLI:

```bash
npx shadcn@latest add @kokonutui/particle-button
```

**Note:** Use the CLI instead of copy/paste to ensure all necessary files are included.

### 4. Use Components

Import and use in your pages:

```tsx
import ParticleButton from "@/components/kokonutui/particle-button";

export default function Page() {
  return <ParticleButton />;
}
```

## Key Concepts

### Built With
- **Tailwind CSS v4**: Styling framework
- **Lucide Icons**: Icon library (auto-installed with CLI)
- **Shadcn/ui**: Some components use Shadcn components as dependencies

### Component Philosophy
- **Animated & Interactive**: Focus on motion and user interaction
- **CLI Installation**: Recommended over copy/paste for dependency management
- **Registry-based**: Uses Shadcn's registry system for component distribution

### Component Location
Components are added to: `@/components/kokonutui/`

## Dependencies

### Automatic Dependencies
When using the CLI, these are installed automatically:
- Lucide Icons
- Required Shadcn/ui components

### Optional Dependencies
Some components require additional libraries. Check the bottom of each component's documentation page for specific requirements.

## Monorepo Support

For monorepo setups, use the `-c` flag to specify your workspace path:

```bash
npx shadcn@latest add @kokonutui/[component-name] -c ./apps/web
```

## Installation Methods

### Method 1: CLI (Recommended)
```bash
npx shadcn@latest add @kokonutui/[component-name]
```
✅ Installs all dependencies automatically
✅ Ensures all necessary files are included

### Method 2: Copy/Paste
- Copy component code from the website
- Manually install any required dependencies
- ⚠️ May miss required files

## Tips

1. **Use the CLI**: Always prefer CLI installation over copy/paste
2. **Check Dependencies**: Review component docs for optional dependencies
3. **Works with Shadcn**: Kokonut UI complements Shadcn/ui, not replaces it
4. **Tailwind v4 Required**: Ensure you're using Tailwind CSS v4
5. **Animation Focus**: Great for adding interactive, animated components to your UI

## Useful Resources

- [Documentation](https://kokonutui.com/docs) - Full documentation
- [Components](https://kokonutui.com/) - Browse all components
- [Tailwind CSS v4](https://tailwindcss.com/docs/installation/framework-guides/nextjs) - Required framework
- [Shadcn/ui](https://ui.shadcn.com/) - Complementary component library
- [Lucide Icons](https://lucide.dev/guide/installation) - Icon library used

## Workflow Summary

1. Ensure Tailwind CSS v4 is installed
2. Add Kokonut UI registry to `components.json`
3. Install cn utility if not already present
4. Add components via CLI: `npx shadcn@latest add @kokonutui/[component]`
5. Import and use in your project
6. Check for and install any optional dependencies

