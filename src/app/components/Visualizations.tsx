import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Project, EstimationResult } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface VisualizationsProps {
  project: Project;
  estimations: EstimationResult[];
}

export default function Visualizations({ project, estimations }: VisualizationsProps) {
  // Calculate totals from modules
  const totalModuleHours = project.modules.reduce((sum, m) => sum + m.estimatedHours, 0);
  const totalModuleCost = project.modules.reduce((sum, m) => sum + m.estimatedCost, 0);
  const totalComponents = project.modules.reduce((sum, m) => sum + m.components.length, 0);

  // Prepare data for estimation comparison chart
  const estimationChartData = estimations.map(est => ({
    name: est.method.split(' ')[0],
    hours: est.totalHours,
    cost: est.totalCost
  }));

  // Prepare data for module breakdown chart
  const moduleChartData = project.modules.map(m => ({
    name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    hours: m.estimatedHours,
    cost: m.estimatedCost,
    value: m.value,
    components: m.components.length
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const moscowColors = {
    'Must': '#dc2626',
    'Should': '#ea580c',
    'Could': '#ca8a04',
    'Wont': '#64748b',
    '': '#94a3b8'
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Project Visualizations</CardTitle>
          <CardDescription className="text-slate-300">
            Visual representations of estimates, timelines, and module breakdowns
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Estimation Comparison Chart */}
      {estimations.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Estimation Methods Comparison</CardTitle>
            <CardDescription className="text-slate-300">Hours and cost across different estimation approaches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estimationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8"
                    label={{ value: 'Estimation Method', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#3b82f6"
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#3b82f6' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981"
                    label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', fill: '#10b981' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Bar yAxisId="left" dataKey="hours" fill="#3b82f6" name="Hours">
                    {estimationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="cost" fill="#10b981" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Breakdown Chart */}
      {project.modules.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Module Hours Breakdown</CardTitle>
              <CardDescription className="text-slate-300">Estimated hours per module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8"
                      label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      stroke="#94a3b8"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" name="Hours">
                      {moduleChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Module Value vs Cost</CardTitle>
              <CardDescription className="text-slate-300">Value score and estimated cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8"
                      label={{ value: 'Module', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#8b5cf6"
                      label={{ value: 'Value (1-10)', angle: -90, position: 'insideLeft', fill: '#8b5cf6' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#f59e0b"
                      label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', fill: '#f59e0b' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                    <Bar yAxisId="left" dataKey="value" fill="#8b5cf6" name="Value (1-10)" />
                    <Bar yAxisId="right" dataKey="cost" fill="#f59e0b" name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Summary Stats */}
      {project.modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Total Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-blue-400">{project.modules.length}</p>
              <p className="text-slate-400 text-sm mt-1">{totalComponents} components</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-green-400">
                {totalModuleHours.toFixed(1)}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                ≈ {Math.ceil(totalModuleHours / 8)} working days
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-purple-400">
                ${totalModuleCost.toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                ${(totalModuleCost / totalModuleHours).toFixed(2)}/hour
              </p>
            </CardContent>
          </Card>
          
          <Card className={`glass-card border-white/10 ${project.budget > 0 && totalModuleCost > project.budget ? 'ring-2 ring-red-500/50' : 'ring-2 ring-green-500/50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Budget Status</CardTitle>
            </CardHeader>
            <CardContent>
              {project.budget > 0 ? (
                <div>
                  <p className={totalModuleCost > project.budget ? 'text-2xl text-red-400' : 'text-2xl text-green-400'}>
                    {totalModuleCost > project.budget ? 'Over Budget' : 'Within Budget'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    ${totalModuleCost.toLocaleString()} / ${project.budget.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400">No budget set</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
