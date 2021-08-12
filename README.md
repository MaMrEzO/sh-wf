# Simple todo app with ReactJS

This project just manipulate workflows in list style, in order and tree like bullet list.
## Implemented
- [x] Adding with add button
- [x] Adding with `Enter`
- [X] Done with `Ctrl-Enter`
- [x] Keyboard navigation


| Key | Action |
|---|---|
| `Enter` | new Workflow. |
| `Ctrl+Enter` | make focused Workflow done. |
| `Tab` | Change indent of Workflow forward. |
| `Shift+Tab` | change indent forward. |
| `UpArrow`/`DownArrow` | navigate upward and downward between Workflow |

## Todo
- [ ] Store on add or delete to localStorage
- [ ] Delete on empty title with `BackSpace` or `Ctrl+Shift+Delete`

## Known issuse
 - Navigation get confused on changeing indent backward items in middle of list! 
