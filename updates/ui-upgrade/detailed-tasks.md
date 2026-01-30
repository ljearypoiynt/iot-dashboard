# UI Upgrade - Detailed Step-by-Step Tasks

## Step 1: Create Sidebar Component (Foundation)
**Time: 30 minutes**
**Priority: HIGH**

### Task 1.1 - Create Sidebar.tsx
- **File**: `frontend/src/components/Sidebar.tsx` (NEW)
- Create basic sidebar component with:
  - Static width (250px)
  - Fixed position on left side
  - Logo section at top: "IoT Management"
  - Two navigation items:
    - Device Provisioning (with icon)
    - Dashboard (with icon)
  - Current page highlighting
  - Simple styling

### Task 1.2 - Create Sidebar.css
- **File**: `frontend/src/components/Sidebar.css` (NEW)
- Style the sidebar:
  - Dark background (#1a1a1a)
  - Fixed position, 250px width, full height
  - Navigation items with hover/active states
  - Green accent for active items

---

## Step 2: Update App Layout (Restructure)
**Time: 20 minutes**
**Priority: HIGH**

### Task 2.1 - Update App.tsx
- **File**: `frontend/src/App.tsx`
- Change layout from horizontal nav to sidebar layout:
  - Remove old `.app-nav` structure
  - Add new grid layout: sidebar + main content
  - Pass `currentPage` to Sidebar component
  - Keep DeviceProvider wrapper

### Task 2.2 - Update App.css
- **File**: `frontend/src/App.css`
- Add new CSS:
  - `.app-layout` - Grid with sidebar
  - `.main-content` - Takes remaining space
  - Adjust padding/margins
  - Remove old `.app-nav` styles

---

## Step 3: Create Global Color Variables
**Time: 15 minutes**
**Priority: MEDIUM**

### Task 3.1 - Update index.css
- **File**: `frontend/src/index.css`
- Add CSS custom properties at `:root`:
  ```css
  --color-bg-primary: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #2a2a2a;
  --color-accent-green: #4ade80;
  --color-accent-green-hover: #22c55e;
  --color-accent-green-dark: #16a34a;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-border: #3a3a3a;
  ```

---

## Step 4: Create PageHeader Component
**Time: 20 minutes**
**Priority: MEDIUM**

### Task 4.1 - Create PageHeader.tsx
- **File**: `frontend/src/components/PageHeader.tsx` (NEW)
- Component structure:
  - Props: `title`, `subtitle`, `children` (for buttons)
  - Return flexbox with title on left, buttons on right
  - Title in green (#4ade80)
  - Subtitle in gray

### Task 4.2 - Create PageHeader.css
- **File**: `frontend/src/components/PageHeader.css` (NEW)
- Style:
  - Flex container
  - Title: large, green, bold
  - Subtitle: smaller, gray
  - Button area: right-aligned

---

## Step 5: Create Devices Table Component
**Time: 45 minutes**
**Priority: HIGH**

### Task 5.1 - Create DevicesTable.tsx
- **File**: `frontend/src/components/DevicesTable.tsx` (NEW)
- Component structure:
  - Props: `devices: IoTDevice[]`, `onRefresh: () => void`
  - Display as HTML table with columns:
    - NAME
    - TYPE
    - MAC ADDRESS
    - STATUS (green dot for online)
    - CLOUD NODE
    - ACTIONS (three dots menu or buttons)

### Task 5.2 - Create Table.css
- **File**: `frontend/src/components/Table.css` (NEW)
- Style table:
  - Dark background (#2a2a2a)
  - Light text
  - Hover row highlighting
  - Alternating row colors (subtle)
  - Status indicator styling (green dot)

---

## Step 6: Create Bluetooth Scanner Component
**Time: 45 minutes**
**Priority: HIGH**

### Task 6.1 - Create BluetoothScanner.tsx
- **File**: `frontend/src/components/BluetoothScanner.tsx` (NEW)
- Component structure:
  - Props: `isScanning`, `devices`, `onConnect`, `onStartScan`
  - Show header: "Bluetooth Scanner"
  - List discovered devices
  - Each device shows:
    - Device icon (🔵)
    - Name
    - Signal strength (e.g., "-45 dBm")
    - Green "Connect" button

### Task 6.2 - Create Scanner.css
- **File**: `frontend/src/components/Scanner.css` (NEW)
- Style:
  - Card container
  - Device list items
  - Signal strength display
  - Connect button styling

---

## Step 7: Refactor DeviceManagement Component
**Time: 60 minutes**
**Priority: HIGH**

### Task 7.1 - Update DeviceManagement.tsx Structure
- **File**: `frontend/src/components/DeviceManagement.tsx`
- New layout:
  1. **PageHeader** section at top
     - Title: "ESP32 Configuration"
     - Subtitle: "Manage and configure your paired IoT devices"
     - Buttons: Refresh, Create Device, Quick Create
  2. **Two-column grid** below:
     - **Left column**: Paired Devices Table (uses DevicesTable component)
     - **Right column**: Bluetooth Scanner (uses BluetoothScanner component)
  3. **WiFi Provisioning section** below (collapsible or modal)
  4. **Device Configuration section** below (when device selected)

### Task 7.2 - Update DeviceManagement.css
- **File**: `frontend/src/components/DeviceProvisioning.css`
- Add new styles:
  - Grid layout for columns
  - Card sections with proper spacing
  - Update form styling
  - Update button groups

---

## Step 8: Refactor Button Styles
**Time: 30 minutes**
**Priority: MEDIUM**

### Task 8.1 - Create Button.css
- **File**: `frontend/src/components/Button.css` (NEW)
- Define button classes:
  - `.btn-primary` - Green background, black text
  - `.btn-secondary` - Dark background, light text
  - `.btn-icon` - Small icon buttons
  - Hover/active/disabled states

### Task 8.2 - Update All Button References
- Update HTML `<button>` elements to use new classes
- Ensure consistent styling across components

---

## Step 9: Create Status Indicator Component
**Time: 20 minutes**
**Priority: LOW**

### Task 9.1 - Create StatusIndicator.tsx
- **File**: `frontend/src/components/StatusIndicator.tsx` (NEW)
- Simple component:
  - Props: `status: 'online' | 'offline'`
  - Returns colored circle with appropriate styling
  - Green for online with subtle pulse animation
  - Gray for offline

### Task 9.2 - Update Table to Use StatusIndicator
- Use in DevicesTable for status column

---

## Step 10: Update Dashboard Component (Optional Phase)
**Time: 30 minutes**
**Priority: LOW**

### Task 10.1 - Update Dashboard.tsx
- Apply same layout patterns
- Use PageHeader component
- Ensure consistency with Device Management page

---

## Step 11: Mobile Responsiveness
**Time: 45 minutes**
**Priority: MEDIUM**

### Task 11.1 - Update Layout for Mobile
- Add media queries (@media max-width: 768px)
- Sidebar collapses to hamburger menu
- Main content takes full width
- Two-column grid becomes single column

### Task 11.2 - Create Hamburger Menu
- Simple toggle button in header
- Show/hide sidebar with animation

---

## Step 12: Testing & Refinement
**Time: 30 minutes**
**Priority: HIGH**

### Task 12.1 - Visual Comparison
- Compare each section with target image
- Adjust colors if needed
- Verify spacing and alignment

### Task 12.2 - Functionality Testing
- Test navigation between pages
- Test device scanning
- Test form submissions

### Task 12.3 - Cross-browser Check
- Test in Chrome, Firefox, Edge
- Verify no console errors

---

## Recommended Execution Order

**CRITICAL PATH (Must do first):**
1. Step 1 - Sidebar Component ✓
2. Step 2 - Update App Layout ✓
3. Step 3 - Global Colors ✓
4. Step 4 - PageHeader Component ✓

**MAIN FEATURES (Do these next):**
5. Step 5 - Devices Table Component ✓
6. Step 6 - Bluetooth Scanner Component ✓
7. Step 7 - Refactor DeviceManagement ✓

**POLISH (Then these):**
8. Step 8 - Button Styles ✓
9. Step 9 - Status Indicators ✓

**FINISHING (Last):**
10. Step 10 - Dashboard Update
11. Step 11 - Mobile Responsiveness
12. Step 12 - Testing & Refinement

---

## Time Estimates

- **Critical Path**: ~85 minutes (1.5 hours)
- **Main Features**: ~150 minutes (2.5 hours)
- **Polish**: ~50 minutes (0.8 hours)
- **Finishing**: ~75 minutes (1.25 hours)
- **Total**: ~360 minutes (6 hours)

---

## How to Use This Plan

1. **Pick the next task** from the recommended order
2. **Follow the steps** under that task
3. **Test as you go** to catch issues early
4. **Mark as complete** once done
5. **Move to next task**

This approach allows for incremental progress with working features at each stage!
