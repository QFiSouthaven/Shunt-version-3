
import React from 'react';
import { AgentConfig } from '../../types';
import { CodeIcon, CopyIcon, CheckIcon } from '../icons';
import { Button } from '../ui/Button';

interface JsonPreviewProps {
  config: AgentConfig;
}

export function JsonPreview({ config }: JsonPreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <CodeIcon className="w-4 h-4" />
          JSON Configuration
        </h3>
        <Button 
          variant="ghost" 
          onClick={handleCopy}
          className="text-xs h-7"
        >
          {copied ? (
            <><CheckIcon className="w-3 h-3 mr-1" /> Copied</>
          ) : (
            <><CopyIcon className="w-3 h-3 mr-1" /> Copy</>
          )}
        </Button>
      </div>
      <div className="p-4 overflow-auto flex-1 custom-scrollbar">
        <pre className="text-xs font-mono text-blue-300 leading-relaxed">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}
