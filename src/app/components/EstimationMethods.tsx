import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Project, EstimationResult } from '../App';
import { Calculator, TrendingUp, Layers } from 'lucide-react';
import { Badge } from './ui/badge';

interface EstimationMethodsProps {
  project: Project;
  estimations: EstimationResult[];
  setEstimations: (estimations: EstimationResult[]) => void;
}

export default function EstimationMethods({ project, estimations, setEstimations }: EstimationMethodsProps) {
  const [expertEstimate, setExpertEstimate] = useState({ hours: 0, cost: 0 });
  const [analogyProject, setAnalogyProject] = useState({ name: '', hours: 0, cost: 0, scaleFactor: 1 });

  const calculateBottomUp = () => {
    // Collect all components from all modules
    const allComponents: any[] = [];
    project.modules.forEach(module => {
      module.components.forEach(component => {
        allComponents.push({
          name: `${module.name} > ${component.name}`,
          hours: component.estimatedHours,
          cost: component.estimatedCost
        });
      });
    });
    
    const totalHours = allComponents.reduce((sum, item) => sum + item.hours, 0);
    const totalCost = allComponents.reduce((sum, item) => sum + item.cost, 0);

    const result: EstimationResult = {
      method: 'Bottom-Up (Sum of Components)',
      totalHours,
      totalCost,
      breakdown: allComponents
    };

    setEstimations([...estimations.filter(e => e.method !== result.method), result]);
  };

  const addExpertEstimate = () => {
    const result: EstimationResult = {
      method: 'Expert/Analogy Estimate',
      totalHours: expertEstimate.hours,
      totalCost: expertEstimate.cost,
      breakdown: [{ name: 'Expert Estimate', hours: expertEstimate.hours, cost: expertEstimate.cost }]
    };

    setEstimations([...estimations.filter(e => e.method !== result.method), result]);
  };

  const calculateScalingEstimate = () => {
    const scaledHours = analogyProject.hours * analogyProject.scaleFactor;
    const scaledCost = analogyProject.cost * analogyProject.scaleFactor;

    const result: EstimationResult = {
      method: 'Scaling/Analogy (from similar project)',
      totalHours: scaledHours,
      totalCost: scaledCost,
      breakdown: [{
        name: `${analogyProject.name} × ${analogyProject.scaleFactor}`,
        hours: scaledHours,
        cost: scaledCost
      }]
    };

    setEstimations([...estimations.filter(e => e.method !== result.method), result]);
  };

  const calculateAggregate = () => {
    if (estimations.length === 0) return;

    const totalHours = estimations.reduce((sum, est) => sum + est.totalHours, 0) / estimations.length;
    const totalCost = estimations.reduce((sum, est) => sum + est.totalCost, 0) / estimations.length;

    const breakdown = estimations.map(est => ({
      name: est.method,
      hours: est.totalHours,
      cost: est.totalCost
    }));

    const result: EstimationResult = {
      method: 'Aggregate (Average of All Methods)',
      totalHours,
      totalCost,
      breakdown
    };

    setEstimations([...estimations.filter(e => e.method !== result.method), result]);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Estimation Methods</CardTitle>
          <CardDescription>
            Use multiple estimation approaches to get a comprehensive view of project effort and cost
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottom-Up Estimation */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Bottom-Up Estimation
            </CardTitle>
            <CardDescription>Sum of all component estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-slate-300 mb-2">
                Modules: {project.modules.length} | Components: {project.modules.reduce((sum, m) => sum + m.components.length, 0)}
              </p>
              <p className="text-slate-400">
                This method sums all component estimates from all modules defined in the Setup tab.
              </p>
            </div>
            <Button onClick={calculateBottomUp} className="w-full" disabled={project.modules.length === 0 || project.modules.every(m => m.components.length === 0)}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Bottom-Up
            </Button>
          </CardContent>
        </Card>

        {/* Expert/Analogy Estimation */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Expert/Analogy Estimate
            </CardTitle>
            <CardDescription>Based on expert judgment or similar project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                placeholder="0"
                value={expertEstimate.hours || ''}
                onChange={(e) => setExpertEstimate({ ...expertEstimate, hours: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={expertEstimate.cost || ''}
                onChange={(e) => setExpertEstimate({ ...expertEstimate, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={addExpertEstimate} className="w-full">
              Add Expert Estimate
            </Button>
          </CardContent>
        </Card>

        {/* Scaling/Analogy Estimation */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Scaling/Analogy Method
            </CardTitle>
            <CardDescription>Scale from a similar past project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reference Project Name</Label>
              <Input
                placeholder="e.g., Previous CRM System"
                value={analogyProject.name}
                onChange={(e) => setAnalogyProject({ ...analogyProject, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reference Hours</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={analogyProject.hours || ''}
                  onChange={(e) => setAnalogyProject({ ...analogyProject, hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reference Cost ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={analogyProject.cost || ''}
                  onChange={(e) => setAnalogyProject({ ...analogyProject, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scale Factor (e.g., 1.5 for 50% larger)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={analogyProject.scaleFactor || ''}
                onChange={(e) => setAnalogyProject({ ...analogyProject, scaleFactor: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <Button onClick={calculateScalingEstimate} className="w-full">
              Calculate Scaled Estimate
            </Button>
          </CardContent>
        </Card>

        {/* Aggregate Results */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>Aggregate Estimation</CardTitle>
            <CardDescription>Average of all estimation methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-slate-300">
                Active Estimates: {estimations.filter(e => e.method !== 'Aggregate (Average of All Methods)').length}
              </p>
            </div>
            <Button 
              onClick={calculateAggregate} 
              className="w-full"
              disabled={estimations.filter(e => e.method !== 'Aggregate (Average of All Methods)').length < 2}
            >
              Calculate Aggregate
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {estimations.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>Estimation Results</CardTitle>
            <CardDescription>Comparison of all estimation methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estimations.map((estimation, index) => (
                <div key={index} className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white">{estimation.method}</h4>
                    {estimation.method.includes('Aggregate') && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Recommended</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                      <p className="text-blue-300 mb-1">Total Hours</p>
                      <p className="text-white">{estimation.totalHours.toFixed(1)} hrs</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                      <p className="text-green-300 mb-1">Total Cost</p>
                      <p className="text-white">${estimation.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  {estimation.breakdown.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-slate-400 mb-2">Breakdown:</p>
                      <div className="space-y-1">
                        {estimation.breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>{item.name}</span>
                            <span>{item.hours.toFixed(1)}h / ${item.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
