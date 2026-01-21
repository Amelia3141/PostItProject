import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { notes, boardName, rows, columns, type = 'summary' } = await req.json();

    if (!notes || notes.length === 0) {
      return Response.json({ error: 'No notes provided' }, { status: 400 });
    }

    const notesText = notes
      .map((n: any) => {
        const row = rows.find((r: any) => r.id === n.category)?.label || n.category;
        const col = columns.find((c: any) => c.id === n.timeframe)?.label || n.timeframe;
        return `[${row} / ${col}] "${n.text}" (${n.votes || 0} votes)`;
      })
      .join('\n');

    const structureText = `Rows: ${rows.map((r: any) => r.label).join(', ')}\nColumns: ${columns.map((c: any) => c.label).join(', ')}`;

    let prompt = '';

    switch (type) {
      case 'comprehensive':
        prompt = `You are creating a comprehensive strategic report for a workshop board called "${boardName}".

Board structure:
${structureText}

All notes from the workshop:
${notesText}

Create a complete executive report with the following sections:

# Executive Summary
Provide a compelling 4-5 sentence summary capturing the workshop's key outcomes, major themes, and strategic direction.

# Key Findings
**Top Themes** (4-6 major themes that emerged)
- Theme name: Brief explanation and supporting evidence

**Priority Areas** (based on vote counts and strategic importance)
- List the highest priority items with rationale

**Sentiment Overview**
- Overall mood and tone of the workshop
- Key concerns raised
- Opportunities identified

# Strategic Recommendations

**Decisions Required**
List 3-5 key decisions that need to be made based on the workshop outcomes, including:
- The decision needed
- Options to consider
- Recommended course of action

**Action Items**

*Immediate (within 1 month)*
- [ ] Specific action - Suggested owner

*Short-term (1-3 months)*
- [ ] Specific action - Suggested owner

*Long-term (3-12 months)*
- [ ] Specific action - Suggested owner

# Gaps & Risks
- What important perspectives or topics were missing?
- What risks should be monitored?

# Next Steps
Provide 3-5 concrete next steps to move forward from this workshop.

Format the report professionally. Use British English spelling.`;
        break;

      case 'summary':
        prompt = `You are analysing a strategic workshop board called "${boardName}".

Board structure:
${structureText}

All notes from the workshop:
${notesText}

Provide a comprehensive analysis with:

1. **Executive Summary** (3-4 sentences capturing the key takeaways)

2. **Key Themes** (identify 4-6 major themes that emerged, with brief explanations)

3. **Top Priorities** (based on vote counts and strategic importance)

4. **Gaps & Missing Perspectives** (what important areas weren't addressed?)

5. **Recommended Next Steps** (3-5 actionable recommendations)

Be concise but insightful. Use British English spelling.`;
        break;

      case 'sentiment':
        prompt = `Analyse the sentiment and tone of these workshop notes from "${boardName}":

${notesText}

Provide:

1. **Overall Sentiment**: Is the group generally optimistic, cautious, concerned, or mixed about the topic?

2. **Sentiment by Category**:
${rows.map((r: any) => `- ${r.label}: [analyse sentiment]`).join('\n')}

3. **Key Concerns**: List specific worries or risks mentioned

4. **Opportunities Identified**: List positive possibilities mentioned

5. **Emotional Undertones**: Any frustrations, excitement, uncertainty detected?

Be specific and quote relevant notes where helpful. Use British English.`;
        break;

      case 'themes':
        prompt = `Extract and cluster themes from this workshop board "${boardName}":

${notesText}

Provide:

1. **Primary Themes** (3-5 major themes with the notes that belong to each)

2. **Emerging Patterns** (connections between different areas of the board)

3. **Contradictions or Tensions** (conflicting ideas that emerged)

4. **Consensus Areas** (where there seems to be strong agreement)

5. **Outlier Ideas** (unique perspectives that don't fit the main themes but are worth noting)

Group related notes together and explain the connections. Use British English.`;
        break;

      case 'clusters':
        prompt = `Analyse this workshop board "${boardName}" and cluster the notes into semantic groups based on similarity.

All notes (with their IDs):
${notes.map((n: any, i: number) => `[${i + 1}] "${n.text}"`).join('\n')}

Your task is to:

1. **Identify Clusters**: Group the notes into 3-7 distinct clusters based on semantic similarity (related concepts, themes, or topics).

2. **For each cluster, provide**:
   - **Cluster Name**: A short descriptive name (2-4 words)
   - **Description**: One sentence explaining what unites these notes
   - **Notes**: List the note numbers that belong to this cluster

3. **Suggested Connections**: Identify pairs of notes that should be connected because:
   - One leads to or causes the other
   - They are complementary or dependent
   - They represent a sequence or workflow

   Format: Note X → Note Y (reason)

4. **Outliers**: Any notes that don't fit well into the clusters

Example output format:
**Cluster: Data Infrastructure**
Notes 1, 4, 7 - These notes all relate to data storage and processing capabilities.

**Cluster: User Experience**
Notes 2, 5, 8 - These notes focus on how end users interact with the system.

**Suggested Connections:**
- Note 1 → Note 4 (data storage enables processing)
- Note 2 → Note 5 (user feedback drives UX improvements)

Be specific and analytical. Use British English.`;
        break;

      case 'stakeholder':
        prompt = `Generate stakeholder-specific summaries from this workshop board "${boardName}":

Board structure:
${structureText}

Notes:
${notesText}

Create tailored summaries for each stakeholder type (adjust based on what's relevant to the board content):

1. **For Government/Policy Makers**:
   - Key policy implications
   - Regulatory considerations
   - Public interest concerns

2. **For Academia/Researchers**:
   - Research opportunities
   - Knowledge gaps identified
   - Collaboration possibilities

3. **For Industry/Business**:
   - Commercial opportunities
   - Implementation challenges
   - Competitive considerations

4. **For Civil Society/Public**:
   - Societal impacts
   - Ethical considerations
   - Public engagement needs

Each summary should be 3-4 sentences, actionable, and relevant to that stakeholder's priorities. Use British English.`;
        break;

      case 'actions':
        prompt = `Extract actionable items from this workshop board "${boardName}":

${notesText}

Provide:

1. **Immediate Actions** (can be done within 1 month)
   - List specific, concrete actions
   - Suggest who should own each action

2. **Short-term Actions** (1-3 months)
   - Strategic initiatives to launch
   - Resources needed

3. **Long-term Actions** (3-12 months)
   - Major projects or programmes
   - Dependencies and prerequisites

4. **Quick Wins** (high impact, low effort items)

5. **Parking Lot** (good ideas that need more exploration)

Be specific and actionable. Each item should be clear enough to assign to someone. Use British English.`;
        break;

      case 'gaps':
        prompt = `Analyse what's missing from this workshop board "${boardName}":

Board structure:
${structureText}

Current notes:
${notesText}

Identify:

1. **Empty or Sparse Areas**: Which cells/categories have few or no notes? What might belong there?

2. **Missing Perspectives**: What viewpoints or stakeholders aren't represented?

3. **Unasked Questions**: What important questions weren't addressed?

4. **Blind Spots**: What assumptions might the group be making? What are they not seeing?

5. **Suggested Additions**: Provide 5-10 specific ideas that could fill the gaps

Be constructive and specific. Use British English.`;
        break;

      default:
        return Response.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: type === 'comprehensive' ? 4096 : 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return Response.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    return Response.json({
      analysis: content.text,
      type,
      notesAnalysed: notes.length,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return Response.json(
      { error: error.message || 'AI analysis failed' },
      { status: 500 }
    );
  }
}
