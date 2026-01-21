# AI Landscape Tool - Project TODO

Updated: 2025-01-20

## Bugs - Fixed
| Bug | Status | Fixed |
|-----|--------|-------|
| Click-to-edit - clicking note triggered drag instead of modal | Fixed | 2025-12-24 |
| Centre title text - title/header not centred | Fixed | 2025-12-24 |
| Flow view labels - text not visible in Eisenhower Matrix | Fixed | 2025-12-24 |
| Settings > Add column not working | Fixed | 2025-01-20 |

## Urgent - Completed
| Task | Status | Notes |
|------|--------|-------|
| Toast notifications | Done | User feedback system |
| Keyboard shortcuts | Done | N=new, 1/2/3=views, ?=help, /=search |

## Not Urgent
| Task | Status | Notes |
|------|--------|-------|
| Export to PowerPoint | Done | HTML-based .ppt export |
| Import from JSON | Done | File upload to restore notes |
| @mentions in comments | Done | Highlight mentions, picker UI |
| Embed mode | Done | iFrame embedding at /embed/[id] |
| Note templates | Done | Pre-filled note types (Opportunity, Risk, Action, Question, Insight) |
| Bulk note operations | Done | Multi-select and delete |
| Deletable arrows in Flow view | Done | Right-click or select+Delete to remove connections |
| Enhanced PDF export | Done | Board matrix view, top voted section, landscape layout |

## Pending
| Task | Status | Notes |
|------|--------|-------|
| Enrich roadmap with topic embedding | Pending | Scientometrics analysis |

## Priority Features (User Voted)
| Task | Priority | Notes |
|------|----------|-------|
| Executive summary + actions generator | Done | "Full Report" analysis type with summary, decisions, actions |
| Auto-cluster similar ideas | Done | "Auto-Cluster" analysis type with semantic grouping and connection suggestions |
| Visual cluster heatmaps | Done | Heatmap toggle in board view showing note density |
| Auto-generated PDF reports | Done | "AI Report" button generates comprehensive PDF with AI analysis |
| Slack integration | Medium | Post updates, notifications to Slack channels |

## Future Direction (Premium)
| Category | Features |
|----------|----------|
| Branding | Custom domain, per-user themes, per-board themes, global themes |
| Analytics | Live session insights, GitHub-style heatmap, ideas rate chart |
| Permissions | Admin/participant roles, view permissions, admin settings, audit logs |
| Integrations | Notion/Confluence, Zapier webhooks |
| Enterprise | SSO/company login |

## Completed Features
- New user onboarding tutorial with element highlighting and step-by-step guide
- Flow view with SVG connections and deletable arrows
- Drag-and-drop between cells
- Export (JSON, CSV, PDF with board matrix view, PowerPoint)
- Import from JSON
- Quick vote buttons
- Sort and filter options
- Collapse/expand rows
- Fullscreen mode
- Comments on notes with @mentions support
- User identification with colours
- Authorship tracking
- Multi-board support
- Board templates (AI Landscape, SWOT, Kanban, Retrospective, User Story Map, Eisenhower Matrix, Blank)
- Note templates (Opportunity, Risk, Action Item, Question, Insight)
- Shareable links with permissions
- Embed mode for iframes (/embed/[id])
- Real-time presence indicators
- Mobile responsive layout
- Activity feed
- Version history with diffs
- Board settings editor (with dynamic row/column/layer management)
- Dark mode toggle
- Column colour options
- Board archive system with timestamps
- Polished UI design (minimalist, professional)
- AI Analysis with Claude API (8 types: Full Report, Executive Summary, Auto-Cluster, Sentiment, Themes, Stakeholder, Actions, Gaps)
- AI-generated PDF reports with comprehensive analysis
- Toast notifications for user feedback
- Keyboard shortcuts (N=new, 1/2/3=views, ?=help, /=search, A=AI, E=export)
- Bulk note operations (multi-select and delete)
- Network analysis panel (centralities, paths, graph export, visualization modes)
- Heatmap visualization for board view (note density)

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
