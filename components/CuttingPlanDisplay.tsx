

import React from 'react';
import type { CuttingPlan } from '../types';

interface CuttingPlanDisplayProps {
  plan: CuttingPlan;
}

export const CuttingPlanDisplay: React.FC<CuttingPlanDisplayProps> = ({ plan }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-emerald-300 mb-2">Preparação</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          {plan.preparationSteps.map((step, index) => <li key={`prep-${index}`}>{step}</li>)}
        </ol>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-emerald-300 mb-2">Passo a Passo do Corte</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          {plan.steps.map((step, index) => <li key={`step-${index}`}>{step}</li>)}
        </ol>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-emerald-300 mb-2">Finalização</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          {plan.finishingSteps.map((step, index) => <li key={`finish-${index}`}>{step}</li>)}
        </ol>
      </div>
    </div>
  );
};