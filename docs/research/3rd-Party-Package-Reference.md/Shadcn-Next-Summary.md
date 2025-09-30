# Shadcn/ui with Next.js - Quick Reference

**Source:** https://ui.shadcn.com/docs/installation/next

## What is Shadcn/ui?

Shadcn/ui is a collection of re-usable components built with Radix UI and Tailwind CSS. Unlike traditional component libraries, it copies components directly into your project, giving you full control over the code.

## Installation

### Initialize Shadcn/ui in Your Project

Run the init command in your Next.js project:

```bash
# Using pnpm
pnpm dlx shadcn@latest init

# Using npm
npx shadcn@latest init

# Using yarn
yarn dlx shadcn@latest init

# Using bun
bunx shadcn@latest init
```

This will:
- Set up your project structure
- Configure `components.json`
- Install required dependencies
- Set up Tailwind CSS configuration

### Choose Project Type
During initialization, you can choose between:
- Standard Next.js project
- Monorepo setup

## Adding Components

### Add Individual Components

Add components as needed to your project:

```bash
# Add a button component
pnpm dlx shadcn@latest add button

# Add multiple components at once
pnpm dlx shadcn@latest add button card dialog
```

### Using Components

Import and use components in your project:

```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
```

## Key Concepts

### Component Philosophy
- **Copy, Don't Install**: Components are copied to your project, not installed as dependencies
- **Full Control**: You own the code and can customize it freely
- **No Lock-in**: Modify components to fit your needs without worrying about breaking changes

### Component Location
Components are added to: `@/components/ui/`

### Built With
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Full type safety

## Available Components

### Form Components
- Button, Input, Textarea, Checkbox, Radio Group
- Select, Combobox, Switch, Slider
- Date Picker, Calendar, Input OTP
- React Hook Form integration

### Layout Components
- Card, Separator, Aspect Ratio
- Resizable, Scroll Area, Sidebar
- Tabs, Accordion, Collapsible

### Overlay Components
- Dialog, Sheet, Drawer
- Popover, Hover Card, Tooltip
- Alert Dialog, Context Menu, Dropdown Menu

### Feedback Components
- Toast, Sonner (toast notifications)
- Alert, Progress, Skeleton

### Data Display
- Table, Data Table
- Badge, Avatar, Typography
- Chart (data visualization)

### Navigation
- Navigation Menu, Menubar
- Breadcrumb, Pagination

## CLI Commands

```bash
# Initialize project
shadcn@latest init

# Add component(s)
shadcn@latest add [component-name]

# Add all components
shadcn@latest add --all

# Update components
shadcn@latest update
```

## Configuration

The `components.json` file stores your project configuration:
- Component paths
- Tailwind config location
- TypeScript settings
- Style preferences

## Useful Resources

- [Documentation](https://ui.shadcn.com/docs) - Full documentation
- [Components](https://ui.shadcn.com/docs/components) - Browse all components
- [Blocks](https://ui.shadcn.com/blocks) - Pre-built component blocks
- [Themes](https://ui.shadcn.com/themes) - Theme customization
- [GitHub](https://github.com/shadcn-ui/ui) - Source code

## Tips

1. **Start Small**: Add components as you need them
2. **Customize Freely**: Modify component code to match your design system
3. **Use with Tailwind**: Leverage Tailwind classes for styling
4. **Check Examples**: Visit the docs for usage examples of each component
5. **Dark Mode**: Built-in dark mode support with Tailwind

