---
name: VisitFlow
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#49607e'
  primary: '#000f22'
  on-primary: '#ffffff'
  primary-container: '#0a2540'
  on-primary-container: '#768dad'
  inverse-primary: '#b0c8eb'
  secondary: '#006c4b'
  on-secondary: '#ffffff'
  secondary-container: '#60f9bd'
  on-secondary-container: '#00714f'
  tertiary: '#160d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#312200'
  on-tertiary-container: '#b28400'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#b0c8eb'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#314865'
  secondary-fixed: '#63fcc0'
  secondary-fixed-dim: '#3fdfa5'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005138'
  tertiary-fixed: '#ffdea0'
  tertiary-fixed-dim: '#fbbc0e'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar_width: 260px
  container_max_width: 1440px
  gutter: 24px
---

## Brand & Style
The design system for this product is engineered to project **institutional trust, operational velocity, and premium security**. As an enterprise visitor management platform, the UI must balance the rigidity required for security protocols with the fluid ease of modern SaaS.

The visual direction is **Corporate / Modern**, drawing heavily from the structured precision of international design standards. It utilizes high-quality whitespace, a disciplined color application, and a focus on clarity to ensure that complex data—such as visitor logs and multi-location booking schedules—remains digestible and actionable for enterprise administrators.

## Colors
The palette is anchored by **Navy (#0A2540)**, representing authority and depth. This is used for core navigation elements and primary typography to establish a "source of truth" feel. 

**Emerald (#00C48C)** serves as the primary action and success signal, providing a high-energy contrast that guides users toward completion and confirmation. **Gold (#F5B700)** is reserved for cautionary states and premium status indicators. The background architecture utilizes a layered white-on-soft-gray approach to separate the workspace from the canvas.

## Typography
**Inter** is the sole typeface for this design system, chosen for its exceptional legibility in data-dense environments. 

Headings use a semi-bold to bold weight with slight negative letter-spacing to appear "tight" and professional. Body text defaults to a 14px base for density, while 16px is used for focused reading or onboarding. All labels should use medium weights to distinguish them from standard body text without requiring a larger font size.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid Grid**. The primary navigation is a fixed-width (260px) vertical sidebar on the left, rendered in Navy. The main content area uses a fluid 12-column grid with a maximum width of 1440px to prevent excessive line lengths on ultra-wide monitors.

Spacing follows a **4px scale**, with 16px (md) being the standard padding for components and 24px (lg) being the standard gutter between cards. 

**Breakpoints:**
- **Mobile (< 640px):** Sidebar collapses to a hamburger menu; margins reduce to 16px.
- **Tablet (640px - 1024px):** Sidebar collapses to icons-only (rail); 2-column card layouts.
- **Desktop (> 1024px):** Full sidebar; 3 or 4 column card layouts.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows. 

1.  **Level 0 (Canvas):** Soft Background (#F8FAFC) - the base upon which all elements sit.
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px solid border (#E5E7EB).
3.  **Level 2 (Hover/Active):** A soft ambient shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`.
4.  **Level 3 (Modals/Popovers):** A more pronounced shadow to indicate focus: `0 20px 25px -5px rgb(0 0 0 / 0.1)`.

The sidebar sits at Level 1 but uses color (Navy) instead of elevation to denote its hierarchy.

## Shapes
The design system uses a consistent **10px (0.625rem)** corner radius for most UI components (buttons, input fields, cards). This "Rounded" approach softens the corporate edges, making the software feel approachable and modern without losing its professional structure.

- **Small elements (Checkboxes):** 4px radius.
- **Large containers (Cards/Modals):** 10px radius.
- **Status Chips:** Full pill-shape (999px) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Navy background, white text. 10px radius. 
- **Success/Action:** Emerald background, white text. Used for "Check In" or "Confirm Appointment."
- **Ghost:** Transparent background with Navy border. Used for secondary actions.

### Input Fields
- White background with a 1px #E5E7EB border. On focus, the border changes to Emerald with a 2px soft Emerald glow.
- Labels are positioned above the field in Label-MD (Navy).

### Cards
- White background, 10px radius, 1px border (#E5E7EB).
- Header sections within cards should have a subtle bottom border to separate title from content.

### Chips & Badges
- Used for visitor status (e.g., "Expected," "Checked In," "Overdue").
- Small text, uppercase, bold, housed in a pill-shaped container with a 10% opacity background of the status color.

### Sidebar
- Background: #0A2540.
- Active state: A 4px Emerald vertical bar on the left edge of the menu item, with a slight white opacity (10%) highlight on the background.

### Data Tables
- Header row: Light Gray (#F1F5F9) with Navy bold text.
- Row hover state: Soft Background (#F8FAFC).
- High density; vertical borders are omitted in favor of clean horizontal separators.