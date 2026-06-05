
import { useEffect, useState } from 'react';
import { cortexService } from '../services/CortexService';
import { KnowledgeNode } from '../types/cortex';

export const useCortex = () => {
  const [pipeline, setPipeline] = useState<KnowledgeNode[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const unsubscribe = cortexService.subscribe((updatedQueue) => {
      setPipeline(updatedQueue);
    });
    return unsubscribe;
  }, []);

  const toggleSystem = () => {
    if (isActive) {
      cortexService.stop();
    } else {
      cortexService.start();
    }
    setIsActive(!isActive);
  };

  return {
    pipeline,
    isActive,
    toggleSystem,
    stats: {
      activeNodes: pipeline.filter(n => n.stage !== 'IDLE').length,
      completedNodes: pipeline.filter(n => n.stage === 'IDLE' && !n.error).length,
      errors: pipeline.filter(n => !!n.error).length
    }
  };
};
