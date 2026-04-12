[**din-studio**](../../../README.md)

***

[din-studio](../../../README.md) / [shell/useEditorLayout](../README.md) / useEditorLayout

# Function: useEditorLayout()

> **useEditorLayout**(): `object`

Defined in: [ui/shell/useEditorLayout.ts:90](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/shell/useEditorLayout.ts#L90)

## Returns

`object`

### bottomDrawerHeight

> **bottomDrawerHeight**: `number`

### bottomDrawerOpen

> **bottomDrawerOpen**: `boolean`

### bottomDrawerTab

> **bottomDrawerTab**: [`BottomDrawerTab`](../../editor-shell.types/type-aliases/BottomDrawerTab.md)

### commandPaletteOpen

> **commandPaletteOpen**: `boolean`

### inspectorTab

> **inspectorTab**: [`InspectorTab`](../../editor-shell.types/type-aliases/InspectorTab.md)

### isDark

> **isDark**: `boolean`

### leftPanelCollapsed

> **leftPanelCollapsed**: `boolean`

### leftPanelView

> **leftPanelView**: [`LeftPanelView`](../../editor-shell.types/type-aliases/LeftPanelView.md)

### leftPanelWidth

> **leftPanelWidth**: `number`

### openBottomDrawerTab

> **openBottomDrawerTab**: (`tab`) => `void`

#### Parameters

##### tab

[`BottomDrawerTab`](../../editor-shell.types/type-aliases/BottomDrawerTab.md)

#### Returns

`void`

### openInspectorTab

> **openInspectorTab**: (`tab`) => `void`

#### Parameters

##### tab

[`InspectorTab`](../../editor-shell.types/type-aliases/InspectorTab.md)

#### Returns

`void`

### openLeftPanelView

> **openLeftPanelView**: (`view`) => `void`

#### Parameters

##### view

[`LeftPanelView`](../../editor-shell.types/type-aliases/LeftPanelView.md)

#### Returns

`void`

### rightPanelCollapsed

> **rightPanelCollapsed**: `boolean`

### rightPanelWidth

> **rightPanelWidth**: `number`

### setCommandPaletteOpen

> **setCommandPaletteOpen**: `Dispatch`\<`SetStateAction`\<`boolean`\>\>

### setTheme

> **setTheme**: `Dispatch`\<`SetStateAction`\<`"light"` \| `"dark"`\>\>

### theme

> **theme**: `"light"` \| `"dark"`

### toggleBottomDrawer

> **toggleBottomDrawer**: () => `void`

#### Returns

`void`

### toggleLeftPanel

> **toggleLeftPanel**: () => `void`

#### Returns

`void`

### toggleRightPanel

> **toggleRightPanel**: () => `void`

#### Returns

`void`

### updateBottomDrawerHeight

> **updateBottomDrawerHeight**: (`value`) => `void`

#### Parameters

##### value

`number`

#### Returns

`void`

### updateLeftPanelWidth

> **updateLeftPanelWidth**: (`value`) => `void`

#### Parameters

##### value

`number`

#### Returns

`void`

### updateRightPanelWidth

> **updateRightPanelWidth**: (`value`) => `void`

#### Parameters

##### value

`number`

#### Returns

`void`

### viewportWidth

> **viewportWidth**: `number` = `currentViewportWidth`
