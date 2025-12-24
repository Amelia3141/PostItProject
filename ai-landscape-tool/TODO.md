# AI Landscape Tool - Project TODO

Updated: 2025-12-24

## Bugs - Fixed
| Bug | Status | Fixed |
|-----|--------|-------|
| Click-to-edit - clicking note triggered drag instead of modal | Fixed | 2025-12-24 |
| Centre title text - title/header not centred | Fixed | 2025-12-24 |
| Flow view labels - text not visible in Eisenhower Matrix | Fixed | 2025-12-24 |

## Urgent
| Task | Status | Notes |
|------|--------|-------|
| Toast notifications | Pending | User feedback for actions |
| Keyboard shortcuts | Pending | Quick add, navigation |

## Not Urgent
| Task | Status | Notes |
|------|--------|-------|
| Export to PowerPoint | Pending | PPTX export |
| Import from JSON | Pending | Restore from backup |
| @mentions in comments | Pending | Notify users |
| Embed mode | Pending | iFrame embedding |
| Note templates | Pending | Pre-filled note types |
| Bulk note operations | Pending | Multi-select, bulk delete/move |

## Future Direction (Premium)
| Category | Features |
|----------|----------|
| Branding | Custom domain, per-user themes, per-board themes, global themes |
| Analytics | Live session insights, GitHub-style heatmap, ideas rate chart, cluster heatmaps |
| AI Enhanced | Auto-cluster, "what's missing" suggestions, sentiment visualisation, auto-generated reports |
| Export | AI PDF reports, AI PowerPoint, per-stakeholder exports |
| Permissions | Admin/participant roles, view permissions, admin settings, audit logs |
| Integrations | Slack, Notion/Confluence, Zapier webhooks |
| Enterprise | SSO/company login |

## Completed Features
- Flow view with SVG connections
- Drag-and-drop between cells
- Export (JSON, CSV, PDF)
- Quick vote buttons
- Sort and filter options
- Collapse/expand rows
- Fullscreen mode
- Comments on notes
- User identification with colours
- Authorship tracking
- Multi-board support
- Board templates (AI Landscape, SWOT, Kanban, Retrospective, User Story Map, Eisenhower Matrix, Blank)
- Shareable links with permissions
- Real-time presence indicators
- Mobile responsive layout
- Activity feed
- Version history with diffs
- Board settings editor
- Dark mode toggle
- Column colour options
- Board archive system with timestamps
- Polished UI design (minimalist, professional)
- AI Analysis with Claude API (6 types: Executive Summary, Sentiment, Themes, Stakeholder, Actions, Gaps)

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Add Firebase and Anthropic API keys to `.env.local`
4. Run `npm install`
5. Run `npm run dev:clean` (starts on port 3001)

## Links
- Live: https://post-it-project.vercel.app
- GitHub: https://github.com/Amelia3141/PostItProject
- Firebase Console: https://console.firebase.google.com/project/postitproject-bebd1
