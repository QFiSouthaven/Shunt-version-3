
import React from 'react';
import TabFooter from '../common/TabFooter';
import WorkflowCanvas from '../agent_builder/WorkflowCanvas';
import { ReactFlowProvider } from 'reactflow';

const Orchestrator: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#050505] text-white">
            <div className="flex-grow relative overflow-hidden">
                <ReactFlowProvider>
                    <WorkflowCanvas />
                </ReactFlowProvider>
            </div>
            <TabFooter />
        </div>
    );
};

export default Orchestrator;
