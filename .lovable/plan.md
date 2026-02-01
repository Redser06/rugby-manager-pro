
# Player Editor Implementation Plan

## Overview
Add the ability for users to edit player names, age, nationality, and other details directly from the Squad page. This will transform the current read-only player detail dialog into an editable form.

## What You'll Get
- Click on any player row to open their details
- Edit first name, last name, age, and nationality with inline form fields
- Changes save automatically to your game state
- All edits persist between sessions

## Implementation Steps

### 1. Add Update Player Function to Game Context
Extend the GameContext to include a new `updatePlayer` function that modifies a specific player's data within the selected team.

**Changes to `src/contexts/GameContext.tsx`:**
- Add `updatePlayer(playerId: string, updates: Partial<Player>)` to the context interface
- Implement the function to update the player in both `selectedTeam.players` and the corresponding league team

### 2. Create Editable Player Detail Dialog
Replace the read-only display with editable form fields in the PlayerDetailDialog component.

**Changes to `src/pages/Squad.tsx`:**
- Add edit mode state to the dialog
- Add form fields for:
  - First Name (text input)
  - Last Name (text input)
  - Age (number input with min/max validation: 17-45)
  - Nationality (text input)
- Add Save and Cancel buttons
- Include input validation to ensure names aren't empty and age is within valid range

### 3. Data Flow

```text
User clicks player row
        |
        v
PlayerDetailDialog opens in view mode
        |
        v
User clicks "Edit" button
        |
        v
Form fields become editable
        |
        v
User modifies values
        |
        v
User clicks "Save"
        |
        v
updatePlayer() called in GameContext
        |
        v
State updates + localStorage saves
        |
        v
UI reflects changes immediately
```

## Technical Details

### Validation Rules
- First Name: Required, max 50 characters
- Last Name: Required, max 50 characters  
- Age: Required, number between 17 and 45
- Nationality: Required, max 50 characters

### Files to Modify
1. **`src/contexts/GameContext.tsx`** - Add `updatePlayer` function
2. **`src/pages/Squad.tsx`** - Update PlayerDetailDialog with edit form

### New UI Elements
- Edit button (pencil icon) in dialog header
- Save/Cancel buttons when in edit mode
- Form inputs with proper styling matching the glass UI design
