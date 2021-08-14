# Simple todo app with ReactJS

This project just manipulate workflows in list style, in order and tree like bullet list.
## Implemented
- [x] Documentation of Components and API in code
- [x] Adding with add button
- [x] Adding with `Enter` under current item
- [x] Done with `Ctrl-Enter`
- [x] Delete item with `Backspace` on empty title and `Shift+Ctrl+Del` on any item.
- [x] Keyboard navigation
- [x] Store and restore to and from localStorage.

## Shortcuts

| Condition | Key | Action |
|---|---|---|
| normal | `Enter` | new Workflow. |
| normal | `Ctrl+Enter` | make focused Workflow done. |
| normal | `Tab` | Change indent of Workflow forward. |
| normal | `Shift+Tab` | change indent forward. |
| normal | `UpArrow`/`DownArrow` | navigate upward and downward between Workflow |
| normal | `Shift+Ctrl+Del` | Delete node (with children) |
| Empty title | `Backspace` | Delete node (with children) |
