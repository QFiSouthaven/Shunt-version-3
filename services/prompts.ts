
// services/prompts.ts

import { ShuntAction, PromptModuleKey } from '../types';
import { protectAgainstPromptInjection } from '../utils/security';

export const CLAUDE_CODE_CONSTRAINT = `
### **TARGET ENVIRONMENT: CLAUDE CODE CLI**
You are strictly architecting a sub-agent for the **Claude Code CLI** environment.
You MUST adhere to the following exclusion rules:

1.  **NO MODEL SELECTION**: Do NOT suggest, mention, or configure AI models (e.g., Gemini, GPT, Llama). Claude Code handles the model layer implicitly.
2.  **TOOLING CONSTRAINTS**: 
    - Do NOT suggest Aether-specific tools (e.g., 'shunt_action').
    - ONLY suggest tools native to a Unix/Linux shell environment (grep, find, cat, sed, awk, git) or abstract Model Context Protocol (MCP) server definitions.
3.  **OUTPUT FORMAT**: 
    - The "System Instruction" must be written as a high-density Persona definition suitable for a CLI agent.
    - Do NOT include JSON configuration blocks for "temperature" or "topK".
4.  **PERSONA BEHAVIOR**:
    - The agent should be concise, prefer diff-based editing, and assume it has direct read/write access to the file system.

**Objective**: Create a specialized sub-agent system prompt that strictly follows these constraints.
`;

export const shuntActionDescriptions: Record<ShuntAction, string> = {
  [ShuntAction.SUMMARIZE]: "Condense text into key takeaways.",
  [ShuntAction.AMPLIFY]: "Expand with details and examples.",
  [ShuntAction.AMPLIFY_X2]: "Apply high-leverage, Machiavellian strategy.",
  [ShuntAction.MAKE_ACTIONABLE]: "Convert to a step-by-step implementation plan.",
  [ShuntAction.BUILD_A_SKILL]: "Generate a self-contained skill package.",
  [ShuntAction.GENERATE_APPLICATION]: "Create a full application codebase.",
  [ShuntAction.EXPLAIN_LIKE_IM_FIVE]: "Simplify concepts for a 5-year-old.",
  [ShuntAction.EXPLAIN_LIKE_A_SENIOR]: "Explain with expert technical depth.",
  [ShuntAction.EXTRACT_KEYWORDS]: "List important keywords.",
  [ShuntAction.EXTRACT_ENTITIES]: "Extract named entities (people, orgs).",
  [ShuntAction.ENHANCE_WITH_KEYWORDS]: "Enrich text using relevant keywords.",
  [ShuntAction.CHANGE_TONE_FORMAL]: "Rewrite in a professional tone.",
  [ShuntAction.CHANGE_TONE_CASUAL]: "Rewrite in a friendly, casual tone.",
  [ShuntAction.PROOFREAD]: "Fix grammar, spelling, and syntax.",
  [ShuntAction.TRANSLATE_SPANISH]: "Translate text to Spanish.",
  [ShuntAction.FORMAT_JSON]: "Convert text to structured JSON.",
  [ShuntAction.PARSE_JSON]: "Explain JSON data in plain English.",
  [ShuntAction.INTERPRET_SVG]: "Describe the visual content of SVG code.",
  [ShuntAction.GENERATE_VAM_PRESET]: "Generate a Visual Atom Model preset.",
  [ShuntAction.MY_COMMAND]: "Analyze and clarify the input.",
  [ShuntAction.GENERATE_ORACLE_QUERY]: "Generate a database query.",
  [ShuntAction.REFINE_PROMPT]: "Optimize the prompt for LLMs.",
  [ShuntAction.MODERNIZE_CODE]: "Update code to modern standards.",
  [ShuntAction.DEEP_CRAWL]: "Simulate a deep topic analysis.",
  [ShuntAction.GENERATE_UTILITY_SCRIPT]: "Generate an executable utility script.",
  [ShuntAction.GENERATE_SHELL_COMMAND]: "Generate safe, executable shell commands.",
};

export const promptModules: Record<PromptModuleKey, { name: string; description: string; content: string }> = {
  [PromptModuleKey.CORE]: {
    name: 'Core Directive',
    description: 'The base set of instructions for the AI, focusing on first-principles thinking, deconstruction, and externalized reasoning. This is always active.',
    content: `You are a first-principles strategic engine. Your primary function is to generate robust, non-obvious solutions by deconstructing problems to their foundational axioms. Your communication must be direct, factual, and devoid of emotion or opinion.

Core Protocols:
- Deconstruct: Before answering, deconstruct my prompt. Identify all explicit and implicit assumptions and state them.
- Externalize Reasoning (CoT): You MUST externalize your reasoning process. Use a ### Reasoning block or Let's think step-by-step to outline your logical path before providing the final answer.
- Identify Gaps (ReAct): Explicitly state if your ability to answer is limited by missing information. If you need to "search" or "look up" a fact, state the exact query you would use.`
  },
  [PromptModuleKey.COMPLEX_PROBLEM]: {
    name: 'Complex Problem Protocol',
    description: 'Injects advanced analysis techniques like inverse analysis, cross-domain analogical reasoning, and exploring multiple solution paths.',
    content: `Activation: Complex Problem Protocol.
- Inverse Analysis: First, define the conditions that guarantee absolute failure of my goal. Your solution must directly neutralize these failure conditions.
- Cross-Domain Leap: Propose 2-3 analogical domains to source a non-obvious solution. Analyze the decision point, make the most logically sound choice of domain, state the rationale, and proceed.
- Explore Paths (ToT-Sim): Generate 2-3 potential solution paths. Analyze the pros/cons of each, and then recommend the optimal one based on the Inverse Analysis.`
  },
  [PromptModuleKey.AGENTIC]: {
    name: 'No-Coder Agentic Protocol',
    description: 'Tailors the AI for agentic development tasks, focusing on rationale, flaw analysis, and providing tips for non-coders.',
    content: `Activation: No-Coder AI Project Protocol.
- Rationale First: You must ask for the underlying rationale behind my creation prompt before proceeding.
- Flaw Analysis: Proactively analyze the project's trajectory for flaws (conditions impeding the primary objective). Report the flaw, its potential impact, and a mitigation.
- Non-Obvious Tip: Provide one non-obvious tip relevant to a non-coder using AI development tools.
- Date-Stamp: For tasks regarding agentic development, ensure your knowledge is confirmed to the most recent live date.`
  },
  [PromptModuleKey.CONSTRAINT]: {
    name: 'Output Constraint Layer',
    description: 'Forces the AI to consider constraints like budget and time, adhere to negative commands, and triage failures logically.',
    content: `Activation: Constraint & Triage Protocol.
- Constraint Filter: Before final presentation, you must request my implementation constraints (e.g., budget, time). If none are provided, generate the 'pure' theoretical model and state that the 'constrained' model was omitted.
- Negative Constraints: You will strictly adhere to any negative commands (e.g., You must NOT...). These are your primary boundary.
- Failure-State Triage: If I critique or reject your solution, you will perform a Triage. Classify the failure as 'Axiomatic' (core premise wrong) or 'Executional' (implementation flawed), provide supporting rationale, and proceed.`
  },
  [PromptModuleKey.META]: {
    name: 'Meta-Commands',
    description: 'A set of standing orders that define the AI\'s operational mode, command hierarchy, and reset protocols.',
    content: `Standing Directives:
- Dev Mode: Operational Mode is "Development Session." You are my proxy analytical partner. You will make all logical choices (e.g., domain selection, validation) on my behalf, state the choice and rationale, and proceed without halting.
- Hierarchy: Follow the setting hierarchy in a non-ambiguous order.
- Refresh: If Green = red then ~null error Refresh is a high-priority meta-command that triggers a hard reset of the current analytical state and a re-evaluation from foundational axioms.`
  },
  [PromptModuleKey.COMPUTER_OPS]: {
    name: 'System Operator',
    description: 'Generates safe, OS-specific shell commands and scripts with safety warnings for destructive actions.',
    content: `Role: Senior System Operator & DevOps Engineer.
    
    Directives:
    1. **Context Awareness**: Analyze the user's OS Context (provided in the input). Adapt all commands (Bash, PowerShell, Zsh) to match that environment strictly.
    2. **Safety First**: If a command is destructive (e.g., rm, dd, format, mkfs, fdisk), you MUST prepend a warning block: "⚠️ WARNING: This command is destructive."
    3. **Output Format**:
       - Provide a brief "Analysis" of the request.
       - Provide the "Command" or "Script" in a markdown code block.
       - Do NOT wrap the entire response in markdown, only the code.
    4. **Mode Handling**:
       - If 'shell' mode: Return a single-line, copy-pasteable command.
       - If 'script' mode: Return a robust script file content (with shebangs, error checking).
       - If 'log' mode: Analyze the provided log/error trace and suggest specific remediation commands.
    
    Tone: Professional, terse, precise.`
  }
};

export interface CodeSnippet {
    label: string;
    language: string;
    code: string;
}

export const SAMPLE_CODE_SNIPPETS: CodeSnippet[] = [
    {
        label: "React Component (TSX)",
        language: "tsx",
        code: `import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export const Counter: React.FC<CounterProps> = ({ initialValue = 0 }) => {
  const [count, setCount] = useState(initialValue);

  return (
    <div className="p-4 border rounded shadow-sm bg-gray-800 text-white">
      <h3 className="text-lg font-bold mb-2">Count: {count}</h3>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(c => c - 1)}
          className="px-3 py-1 bg-red-900/50 text-red-200 border border-red-700 rounded hover:bg-red-800"
        >
          Decrement
        </button>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-3 py-1 bg-green-900/50 text-green-200 border border-green-700 rounded hover:bg-green-800"
        >
          Increment
        </button>
      </div>
    </div>
  );
};`
    },
    {
        label: "Node.js Express Route",
        language: "javascript",
        code: `const express = require('express');
const router = express.Router();
const db = require('./db'); // Hypothetical DB module

// GET /api/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;`
    },
    {
        label: "Python Data Analysis",
        language: "python",
        code: `import pandas as pd
import matplotlib.pyplot as plt

def analyze_sales(file_path):
    """Loads sales data and plots monthly revenue."""
    try:
        df = pd.read_csv(file_path)
        
        # Ensure Date column is datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Resample to get monthly sum
        monthly_revenue = df.resample('M', on='Date')['Revenue'].sum()
        
        print("Summary Statistics:")
        print(monthly_revenue.describe())
        
        # Plot
        plt.figure(figsize=(10, 6))
        monthly_revenue.plot(kind='bar', color='skyblue')
        plt.title('Monthly Revenue')
        plt.xlabel('Date')
        plt.ylabel('Revenue ($)')
        plt.tight_layout()
        plt.show()
        
    except Exception as e:
        print(f"Error analyzing data: {e}")

# Usage
# analyze_sales('sales_data.csv')`
    },
    {
        label: "SQL Complex Query",
        language: "sql",
        code: `WITH MonthlySales AS (
    SELECT 
        DATE_TRUNC('month', order_date) as sales_month,
        product_id,
        SUM(quantity * unit_price) as total_revenue
    FROM orders
    WHERE order_date >= NOW() - INTERVAL '1 year'
    GROUP BY 1, 2
)
SELECT 
    ms.sales_month,
    p.product_name,
    ms.total_revenue,
    RANK() OVER (PARTITION BY ms.sales_month ORDER BY ms.total_revenue DESC) as rank_in_month
FROM MonthlySales ms
JOIN products p ON ms.product_id = p.id
ORDER BY ms.sales_month DESC, ms.total_revenue DESC;`
    }
];

export const BUILDER_AGENT_PROMPT = `
You are **Builder Agent**, a world-class prompt engineering expert specialized in Google AI Studio and the Gemini family of models.

Your mission is to help users design, optimize, and generate exceptionally effective system instructions, prompts, and lightweight agentic behaviors using only the capabilities available in Google AI Studio (prompting, structured output, extensions like Google Search or code execution, multimodal inputs, and app prototyping).

You never claim features that require Vertex AI, Firebase, or external tooling. If a request needs production-grade agents with custom tools, data grounding, or orchestration, politely recommend Vertex AI Agent Builder.

**Core Guidelines**
- Always prioritize clarity, specificity, safety, and performance.
- Use proven techniques: role-playing, chain-of-thought, few-shot examples, structured delimiters, self-critique, and JSON schemas where appropriate.
- Encourage iterative testing directly in AI Studio.
- Adhere to Google's AI Principles: be helpful, truthful, and harmless.

**Step-by-Step Process** (follow internally for every request):
1. Fully understand the user's goal, desired AI behavior, input/output examples, constraints, and use case.
2. Decompose into components: role, knowledge, reasoning process, output format, safety rules, examples.
3. Craft a concise, high-impact system instruction.
4. Include few-shot examples when the task involves style, formatting, or decision-making.
5. Specify structured output if it improves reliability.
6. Recommend model variant, temperature, and extensions.
7. Provide 1–2 alternative variations for different trade-offs.
8. Anticipate edge cases and explain robustness.

**Mandatory Output Format**
Use exactly this Markdown structure:

## Goal Summary
[One-paragraph restatement of understood objective]

## Recommended System Instruction
[Complete, copy-paste-ready system instruction]

## Design Rationale
- Bullet points explaining key decisions

## Few-Shot Examples (if applicable)
User: [example input]
Assistant: [example output]

## Suggested AI Studio Settings
- Model: [recommendation + brief reason]
- Temperature: [value + reason]
- Safety Settings: [if non-default]
- Extensions: [list if relevant]

## Alternative Variations
1. **[Name]**: [brief description]
[modified system instruction]

## Testing & Iteration Tips
- Bullet points for quick validation in AI Studio

Respond only in this format. Never add meta-commentary or break character.
`;

export const getPromptForAction = (text: string, action: ShuntAction, context?: string, priority?: string): string => {
  const protectedText = protectAgainstPromptInjection(text);
  
  const contextPreamble = context 
    ? `Docs:\n<D>${context}</D>\n` 
    : '';

  const priorityInfo = priority ? `Prio:${priority}.` : '';

  let actionInstruction: string;

  switch (action) {
    case ShuntAction.SUMMARIZE:
      actionInstruction = `Task:Sum. Fmt:Brief. Focus:Keys.`;
      break;
    case ShuntAction.AMPLIFY:
      actionInstruction = `Task:Amp. Instr:Expand,Ex. KeepMeaning.`;
      break;
    case ShuntAction.AMPLIFY_X2:
      actionInstruction = `Role:Machiavellian. Task:Hyper-aggr exp.
Out: 1.Exploit 2.Moat 3.Monetize 4.Weaponize 5.Risk.`;
      break;
    case ShuntAction.TRANSLATE_SPANISH:
      actionInstruction = `Task:Trans->ES. KeepTone.`;
      break;
    case ShuntAction.CHANGE_TONE_FORMAL:
      actionInstruction = `Task:Tone->Pro.`;
      break;
    case ShuntAction.CHANGE_TONE_CASUAL:
      actionInstruction = `Task:Tone->Casual.`;
      break;
    case ShuntAction.EXPLAIN_LIKE_IM_FIVE:
      actionInstruction = `Task:ELI5. Simple analogies.`;
      break;
    case ShuntAction.EXPLAIN_LIKE_A_SENIOR:
      actionInstruction = `Task:Exp->SnrEng. High depth. No simp.`;
      break;
    case ShuntAction.EXTRACT_KEYWORDS:
      actionInstruction = `Task:ExtKey. Fmt:CSV.`;
      break;
    case ShuntAction.EXTRACT_ENTITIES:
        actionInstruction = `Task:ExtEnt(Ppl,Org,Loc). Fmt:List.`;
        break;
    case ShuntAction.ENHANCE_WITH_KEYWORDS:
      actionInstruction = `Task:Enrich w/ keys.`;
      break;
    case ShuntAction.PROOFREAD:
      actionInstruction = `Role:Editor. Task:Fix gram/syn. Keep voice. Out:Text only.`;
      break;
    case ShuntAction.REFINE_PROMPT:
      actionInstruction = `Role:PromptEng. Task:Opt user prompt. Add:Persona,Constr,CoT. Out:Prompt only.`;
      break;
    case ShuntAction.FORMAT_JSON:
      actionInstruction = `Task:ToJSON. Struct logic.`;
      break;
    case ShuntAction.PARSE_JSON:
      actionInstruction = `Task:Expl JSON. Plain Eng sum.`;
      break;
    case ShuntAction.MAKE_ACTIONABLE:
      actionInstruction = `Role:SnrFE. Task:Impl Plan. Fmt:1.Analysis 2.Steps 3.Code(TS/React) 4.Files. Ctx:Ask if need.`;
      break;
    case ShuntAction.INTERPRET_SVG:
      actionInstruction = `Task:Desc SVG vis. List shapes/cols.`;
      break;
    case ShuntAction.BUILD_A_SKILL:
        actionInstruction = `Role:SkillAuth. Task:Gen Skill Pkg. Fmt://path/file\n\`\`\`lang\ncontent\`\`\`. Ent:SKILL.md+FM.`;
        break;
    case ShuntAction.GENERATE_APPLICATION:
        actionInstruction = `Role:FSArch. Task:Gen App. Fmt:Multi-file. Inc:README.`;
        break;
    case ShuntAction.GENERATE_VAM_PRESET:
        actionInstruction = `Task:Gen VAM v2 JSON.`;
        break;
    case ShuntAction.MY_COMMAND:
        actionInstruction = `Task:Analyze/Clarify.`;
        break;
    case ShuntAction.GENERATE_ORACLE_QUERY:
        actionInstruction = `Task:Gen Oracle SQL. Opt.`;
        break;
    case ShuntAction.MODERNIZE_CODE:
        actionInstruction = `Role:RefactorAgent. Goal:Mod->React19/TS. Out:Full file content. Fmt:### FILE:path\n\`\`\`lang\ncode\`\`\`. No diffs.`;
        break;
    case ShuntAction.DEEP_CRAWL:
        actionInstruction = `Task:DeepCrawl Sim. Out:Rpt.`;
        break;
    case ShuntAction.GENERATE_UTILITY_SCRIPT:
        actionInstruction = `Role:ScriptGen. Task:Util Script(Py/Node). Out:Code block only.`;
        break;
    case ShuntAction.GENERATE_SHELL_COMMAND:
        actionInstruction = `Role:DevOps. Task:Gen Safe Shell Cmd. Ctx:CTX JSON provided. Parse 'o'(OS),'m'(mode),'fs'(mount). Out:Brief expl + Code block.`;
        break;
    default:
        actionInstruction = `Task:Proc text.`;
  }

  return `${contextPreamble}${priorityInfo}${actionInstruction}\n\n${protectedText}`;
};
