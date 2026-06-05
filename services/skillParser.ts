// services/skillParser.ts

/**
 * Parses the markdown output from the "Build a Skill" AI to extract individual files.
 * The AI is prompted to return files in a specific format:
 * // path/to/file.ext
 * ```lang
 * file content...
 * ```
 * This function uses a regular expression to capture the path and the content of each block.
 *
 * @param markdown - The raw markdown string from the AI.
 * @returns An array of objects, each containing the `path` and `content` of a file.
 */
export const parseSkillPackagePlan = (markdown: string): { path: string; content: string }[] => {
  const files: { path: string; content: string }[] = [];
  
  // Regex to capture:
  // 1. A comment line with the file path, e.g., `// path/to/file.ext`
  // 2. The following code block's content.
  const fileBlockRegex = /\/\/\s*([\w\/-]+\.[\w\.-]+)\s*\n```[\w-]*\n([\s\S]*?)```/g;

  let match;
  while ((match = fileBlockRegex.exec(markdown)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    files.push({ path, content });
  }

  // Fallback for cases where the file path might be inside the code block,
  // which was the old, less reliable format.
  if (files.length === 0) {
    const fallbackRegex = /```[\w-]*\s*\/\/\s*([\w\/-]+\.[\w\.-]+)\n([\s\S]*?)```/g;
    while ((match = fallbackRegex.exec(markdown)) !== null) {
        const path = match[1].trim();
        const content = match[2].trim();
        files.push({ path, content });
    }
  }
  
  // A second fallback for a different common AI pattern.
  if (files.length === 0) {
    const fallbackRegex2 = /###\s*`?([\w\/-]+\.[\w\.-]+)`?\s*\n```[\w-]*\n([\s\S]*?)```/g;
    while ((match = fallbackRegex2.exec(markdown)) !== null) {
        const path = match[1].trim();
        const content = match[2].trim();
        files.push({ path, content });
    }
  }

  return files;
};

/**
 * A stricter, robust parser for the "Seamless Merge" operation.
 * It expects files to be delimited by "### FILE: path/to/file".
 * This prevents issues where the AI might include code blocks within the file content itself.
 */
export const parseMultiFileResponse = (text: string): { path: string; content: string }[] => {
    const files: { path: string; content: string }[] = [];
    const lines = text.split('\n');
    let currentPath: string | null = null;
    let currentContent: string[] = [];
    let inCodeBlock = false;

    // Regex to strictly match "### FILE: path/to/file.ext"
    // It handles optional bolding (**), code ticks (`), or extra spaces the LLM might add.
    const headerRegex = /^###\s+FILE:\s*(?:`|\*\*|\*)?([^\*\n`]+)(?:`|\*\*|\*)?\s*$/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(headerRegex);

        if (match) {
            // If we were building a file, save it now
            if (currentPath) {
                // Trim standard markdown code block fences if they wrap the entire content
                let contentStr = currentContent.join('\n').trim();
                if (contentStr.startsWith('```') && contentStr.endsWith('```')) {
                    const firstLineBreak = contentStr.indexOf('\n');
                    const lastLineBreak = contentStr.lastIndexOf('\n');
                    if (firstLineBreak !== -1 && lastLineBreak !== -1) {
                        contentStr = contentStr.substring(firstLineBreak + 1, lastLineBreak);
                    }
                }
                files.push({ path: currentPath, content: contentStr });
            }
            
            // Start new file
            currentPath = match[1].trim();
            currentContent = [];
            inCodeBlock = false;
        } else {
            if (currentPath) {
                currentContent.push(line);
            }
        }
    }

    // Push the last file
    if (currentPath) {
        let contentStr = currentContent.join('\n').trim();
        // Remove code fences if they act as a wrapper
        if (contentStr.startsWith('```') && contentStr.endsWith('```')) {
             // We generally want to remove the first ```lang and the last ```
             const lines = contentStr.split('\n');
             if (lines.length >= 2) {
                 lines.shift(); // Remove top ```
                 lines.pop();   // Remove bottom ```
                 contentStr = lines.join('\n');
             }
        }
        files.push({ path: currentPath, content: contentStr });
    }

    return files;
};