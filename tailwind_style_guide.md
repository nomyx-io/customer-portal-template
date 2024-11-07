# Tailwind CSS Style Guide for Kronos

This style guide outlines the common Tailwind CSS classes used throughout the Kronos HTML files for consistent styling across components.

## Colors

### Background
- `bg-gray-900`: Main body background
- `bg-gray-800`: Sections like headers and sidebars
- `bg-gray-700`: Interactive elements like buttons and input fields
- `bg-blue-500`: Buttons and links for primary action
- `bg-green-500`: Success states or positive actions
- `bg-red-500`: Error states or destructive actions

### Text
- `text-white`: Text on dark backgrounds
- `text-blue-500`: Active items or actionable text
- `text-gray-400`: Less important or secondary text

## Typography
- `text-3xl`: Main titles
- `text-2xl`: Section headings
- `text-lg`: Subheadings within sections
- `text-sm`: Small text and details
- `font-semibold`: Headings and important text
- `font-bold`: Emphasis or important call-to-actions

## Spacing and Layout
- Flexbox utilities: `flex`, `flex-col`, `flex-1`
- Screen height: `h-screen`
- Max width: `max-w-4xl`
- Horizontal centering: `mx-auto`
- Vertical spacing: `my-8`, `mb-6`
- Padding: `p-6`
- Rounded corners: `rounded`

## Buttons and Inputs
- Larger roundness: `rounded-lg`
- Standard button sizing: `py-2 px-4`
- Hover interactiveness: `hover:bg-blue-600`
- Rounded buttons and inputs: `rounded`

## Miscellaneous
- Shadows: `shadow-md`, `shadow-lg`
- Borders: `border-b border-gray-600`

## Icons and Images
- Rounded images: `rounded`
- Sized images: `w-` and `h-` utilities

Apply these classes in React components using the `className` attribute for consistent styling across your application. Create reusable components for any repetitive styles to simplify maintenance.