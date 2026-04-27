import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Project, Component } from '../App';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PrioritizationProps {
  project: Project;
  setProject: (project: Project) => void;
}

type Priority = 'Must' | 'Should' | 'Could' | 'Wont' | '';

export default function Prioritization({ project, setProject }: PrioritizationProps) {
  const [rankedComponents, setRankedComponents] = useState<Component[]>([]);

  // Flatten all components from all modules
  const getAllComponents = (): Component[] => {
    const allComponents: Component[] = [];
    project.modules.forEach(module => {
      module.components.forEach(component => {
        allComponents.push(component);
      });
    });
    return allComponents;
  };

  useEffect(() => {
    // Calculate value/cost ratio and rank
    // Using (value * 100) / cost to get a more meaningful ratio
    const allComponents = getAllComponents();
    const ranked = allComponents
      .map(c => ({
        ...c,
        ratio: c.estimatedCost > 0 ? (c.value * 100) / c.estimatedCost : c.value * 100
      }))
      .sort((a, b) => b.ratio - a.ratio);
    
    setRankedComponents(ranked);
  }, [project.modules]);

  const setPriority = (componentId: string, priority: Priority) => {
    const updatedModules = project.modules.map(module => ({
      ...module,
      components: module.components.map(c =>
        c.id === componentId ? { ...c, priority } : c
      )
    }));
    setProject({ ...project, modules: updatedModules });
  };

  const getMoSCoWColor = (priority: Priority) => {
    switch (priority) {
      case 'Must': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Should': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Could': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Wont': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const allComponents = getAllComponents();
  const moscowGroups = {
    Must: allComponents.filter(c => c.priority === 'Must'),
    Should: allComponents.filter(c => c.priority === 'Should'),
    Could: allComponents.filter(c => c.priority === 'Could'),
    Wont: allComponents.filter(c => c.priority === 'Wont')
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Prioritization Methods</CardTitle>
          <CardDescription>
            Use MoSCoW and Value-Cost analysis to prioritize project components
          </CardDescription>
        </CardHeader>
      </Card>

      {/* MoSCoW Method */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>MoSCoW Prioritization</CardTitle>
          <CardDescription>
            Must have, Should have, Could have, Won't have
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allComponents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No components defined. Add modules and components in the Setup tab.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-300">Component</TableHead>
                    <TableHead className="text-slate-300">Description</TableHead>
                    <TableHead className="text-slate-300">Hours</TableHead>
                    <TableHead className="text-slate-300">Cost</TableHead>
                    <TableHead className="text-slate-300">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="text-white">{component.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-300">{component.description}</TableCell>
                      <TableCell className="text-slate-300">{component.estimatedHours}h</TableCell>
                      <TableCell className="text-slate-300">${component.estimatedCost}</TableCell>
                      <TableCell>
                        <Select
                          value={component.priority}
                          onValueChange={(value: Priority) => setPriority(component.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Must">Must</SelectItem>
                            <SelectItem value="Should">Should</SelectItem>
                            <SelectItem value="Could">Could</SelectItem>
                            <SelectItem value="Wont">Won't</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* MoSCoW Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                {Object.entries(moscowGroups).map(([priority, components]) => (
                  <Card key={priority} className={getMoSCoWColor(priority as Priority)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{priority} Have</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl mb-2">{components.length}</p>
                      <p className="text-sm opacity-80">
                        {components.reduce((sum, c) => sum + c.estimatedHours, 0)}h / 
                        ${components.reduce((sum, c) => sum + c.estimatedCost, 0)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Value vs Cost Ranking */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Value vs Cost Ranking</CardTitle>
          <CardDescription>
            Components ranked by value-to-cost ratio: (Value × 100) / Cost (higher is better)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankedComponents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No components defined. Add modules and components in the Setup tab.
            </div>
          ) : (
            <div className="space-y-3">
              {rankedComponents.map((component, index) => {
                const ratio = component.estimatedCost > 0 
                  ? ((component.value * 100) / component.estimatedCost).toFixed(2)
                  : 'N/A';
                
                let rankIcon;
                if (index === 0) rankIcon = <ArrowUp className="w-4 h-4 text-green-600" />;
                else if (index === rankedComponents.length - 1) rankIcon = <ArrowDown className="w-4 h-4 text-red-600" />;
                else rankIcon = <Minus className="w-4 h-4 text-slate-400" />;

                return (
                  <div
                    key={component.id}
                    className="border border-white/10 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white">
                          {index + 1}
                        </div>
                        {rankIcon}
                        <div>
                          <h4 className="text-white">{component.name}</h4>
                          <p className="text-slate-400">{component.description}</p>
                        </div>
                      </div>
                      {component.priority && (
                        <Badge className={getMoSCoWColor(component.priority)}>
                          {component.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-slate-400">Value</p>
                        <p className="text-white">{component.value}/10</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Cost</p>
                        <p className="text-white">${component.estimatedCost}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Hours</p>
                        <p className="text-white">{component.estimatedHours}h</p>
                      </div>
                      <div>
                        <p className="text-slate-400">V/C Ratio</p>
                        <p className="text-white">{ratio}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {rankedComponents.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-slate-300">
              <strong className="text-white">High Priority:</strong> Focus on {rankedComponents[0]?.name} (highest value-to-cost ratio)
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Consider Deferring:</strong> {rankedComponents[rankedComponents.length - 1]?.name} (lowest ratio)
            </p>
            {moscowGroups.Must.length > 0 && (
              <p className="text-slate-300">
                <strong className="text-white">Critical Items:</strong> {moscowGroups.Must.length} "Must Have" components totaling{' '}
                {moscowGroups.Must.reduce((sum, c) => sum + c.estimatedHours, 0)}h and{' '}
                ${moscowGroups.Must.reduce((sum, c) => sum + c.estimatedCost, 0)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
