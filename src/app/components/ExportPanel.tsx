import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { Project, EstimationResult } from '../App';

interface ExportPanelProps {
  project: Project;
  estimations: EstimationResult[];
}

export default function ExportPanel({ project, estimations }: ExportPanelProps) {
  
  const exportToCSV = () => {
    // Calculate totals from modules
    const totalHours = project.modules.reduce((sum, m) => sum + m.estimatedHours, 0);
    const totalCost = project.modules.reduce((sum, m) => sum + m.estimatedCost, 0);
    const totalComponents = project.modules.reduce((sum, m) => sum + m.components.length, 0);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Project Overview
    csvContent += "PROJECT OVERVIEW\n";
    csvContent += `Name,${project.name}\n`;
    csvContent += `Description,${project.description}\n`;
    csvContent += `Budget,$${project.budget}\n`;
    csvContent += `Deadline,${project.deadline}\n\n`;
    
    // SMART Goals
    if (project.goals.length > 0) {
      csvContent += "SMART GOALS\n";
      csvContent += "Specific,Measurable,Achievable,Relevant,Time-bound\n";
      project.goals.forEach(goal => {
        csvContent += `"${goal.specific}","${goal.measurable}","${goal.achievable}","${goal.relevant}","${goal.timeBound}"\n`;
      });
      csvContent += "\n";
    }
    
    // Modules
    if (project.modules.length > 0) {
      csvContent += "PROJECT MODULES\n";
      csvContent += "Module,Description,Hours,Cost,Value,Components\n";
      project.modules.forEach(module => {
        csvContent += `"${module.name}","${module.description}",${module.estimatedHours},${module.estimatedCost},${module.value},${module.components.length}\n`;
      });
      csvContent += "\n";
    }
    
    // Estimations
    if (estimations.length > 0) {
      csvContent += "ESTIMATIONS\n";
      csvContent += "Method,Total Hours,Total Cost\n";
      estimations.forEach(est => {
        csvContent += `"${est.method}",${est.totalHours},${est.totalCost}\n`;
      });
      csvContent += "\n";
    }

    // Summary
    csvContent += "SUMMARY\n";
    csvContent += `Total Modules,${project.modules.length}\n`;
    csvContent += `Total Components,${totalComponents}\n`;
    csvContent += `Total Hours,${totalHours}\n`;
    csvContent += `Total Cost,$${totalCost}\n`;
    csvContent += `Budget Status,${project.budget > 0 ? (totalCost > project.budget ? 'Over Budget' : 'Within Budget') : 'No Budget Set'}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project.name || 'project'}_plan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printSummary = () => {
    window.print();
  };

  // Calculate totals from modules
  const totalHours = project.modules.reduce((sum, m) => sum + m.estimatedHours, 0);
  const totalCost = project.modules.reduce((sum, m) => sum + m.estimatedCost, 0);
  const totalComponents = project.modules.reduce((sum, m) => sum + m.components.length, 0);
  
  const moscowSummary = {
    Must: project.components.filter(c => c.priority === 'Must'),
    Should: project.components.filter(c => c.priority === 'Should'),
    Could: project.components.filter(c => c.priority === 'Could'),
    Wont: project.components.filter(c => c.priority === 'Wont')
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Export & Print</CardTitle>
          <CardDescription>
            Download project data or generate a printable summary
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export to CSV
            </CardTitle>
            <CardDescription>
              Download complete project data in CSV format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportToCSV} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print Summary
            </CardTitle>
            <CardDescription>
              Generate a printer-friendly project summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={printSummary} className="w-full bg-white text-slate-900 hover:bg-slate-100" size="lg">
              <Printer className="w-4 h-4 mr-2" />
              Print Page
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Printable Summary */}
      <Card className="glass-card border-white/10 print:shadow-none print:bg-white print:border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Summary
          </CardTitle>
          <CardDescription className="print:hidden">
            This summary will be included when printing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Info */}
          <div>
            <h3 className="text-white mb-3 print:text-slate-900">Project Information</h3>
            <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-lg print:bg-slate-50 print:border-slate-200">
              <div>
                <p className="text-slate-400 print:text-slate-600">Name</p>
                <p className="text-white print:text-slate-900">{project.name || 'Untitled Project'}</p>
              </div>
              <div>
                <p className="text-slate-400 print:text-slate-600">Deadline</p>
                <p className="text-white print:text-slate-900">{project.deadline || 'Not set'}</p>
              </div>
              <div>
                <p className="text-slate-400 print:text-slate-600">Budget</p>
                <p className="text-white print:text-slate-900">${project.budget || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 print:text-slate-600">Total Cost</p>
                <p className="text-white print:text-slate-900">${totalCost.toFixed(2)}</p>
              </div>
            </div>
            {project.description && (
              <div className="mt-3">
                <p className="text-slate-400 print:text-slate-600">Description</p>
                <p className="text-white print:text-slate-900">{project.description}</p>
              </div>
            )}
          </div>

          {/* SMART Goals */}
          {project.goals.length > 0 && (
            <div>
              <h3 className="text-white mb-3 print:text-slate-900">SMART Goals</h3>
              <div className="space-y-3">
                {project.goals.map((goal, idx) => (
                  <div key={goal.id} className="bg-white/5 border border-white/10 p-4 rounded-lg print:bg-slate-50 print:border-slate-200">
                    <h4 className="text-white mb-2 print:text-slate-900">Goal {idx + 1}</h4>
                    <div className="space-y-1 text-slate-300 print:text-slate-700">
                      <p><strong className="text-white print:text-slate-900">Specific:</strong> {goal.specific}</p>
                      <p><strong className="text-white print:text-slate-900">Measurable:</strong> {goal.measurable}</p>
                      <p><strong className="text-white print:text-slate-900">Achievable:</strong> {goal.achievable}</p>
                      <p><strong className="text-white print:text-slate-900">Relevant:</strong> {goal.relevant}</p>
                      <p><strong className="text-white print:text-slate-900">Time-bound:</strong> {goal.timeBound}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules Summary */}
          {project.modules.length > 0 && (
            <div>
              <h3 className="text-white mb-3 print:text-slate-900">Modules ({project.modules.length})</h3>
              <div className="space-y-2">
                {project.modules.map((module) => (
                  <div key={module.id} className="border border-white/10 p-3 rounded bg-white/5 print:bg-white print:border-slate-200">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-white print:text-slate-900">{module.name}</h4>
                    </div>
                    <p className="text-slate-400 mb-2 print:text-slate-600">{module.description}</p>
                    <div className="flex gap-4 text-slate-400 print:text-slate-600">
                      <span>{module.estimatedHours}h</span>
                      <span>${module.estimatedCost.toLocaleString()}</span>
                      <span>Value: {module.value}/10</span>
                      <span>{module.components.length} Components</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MoSCoW Summary */}
          {Object.values(moscowSummary).some(arr => arr.length > 0) && (
            <div>
              <h3 className="text-white mb-3 print:text-slate-900">MoSCoW Prioritization</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(moscowSummary).map(([priority, components]) => (
                  <div key={priority} className="bg-white/5 border border-white/10 p-3 rounded print:bg-slate-50 print:border-slate-200">
                    <h4 className="text-slate-300 mb-1 print:text-slate-700">{priority} Have</h4>
                    <p className="text-2xl text-white print:text-slate-900">{components.length}</p>
                    <p className="text-slate-400 print:text-slate-600">
                      {components.reduce((sum, c) => sum + c.estimatedHours, 0)}h
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimations Summary */}
          {estimations.length > 0 && (
            <div>
              <h3 className="text-white mb-3 print:text-slate-900">Estimation Summary</h3>
              <div className="space-y-2">
                {estimations.map((est, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded flex justify-between items-center print:bg-slate-50 print:border-slate-200">
                    <span className="text-white print:text-slate-900">{est.method}</span>
                    <div className="text-slate-300 print:text-slate-700">
                      <span className="mr-4">{est.totalHours.toFixed(1)}h</span>
                      <span>${est.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Summary */}
          <div className="border-t-2 border-white/10 pt-4 print:border-slate-300">
            <h3 className="text-white mb-3 print:text-slate-900">Overall Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg print:bg-blue-50 print:border-blue-200">
                <p className="text-blue-400 mb-1 print:text-blue-600">Total Hours</p>
                <p className="text-2xl text-blue-300 print:text-blue-900">{totalHours.toFixed(1)}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg print:bg-green-50 print:border-green-200">
                <p className="text-green-400 mb-1 print:text-green-600">Total Cost</p>
                <p className="text-2xl text-green-300 print:text-green-900">${totalCost.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${project.budget > 0 && totalCost > project.budget ? 'bg-red-500/10 border-red-500/20 print:bg-red-50 print:border-red-200' : 'bg-green-500/10 border-green-500/20 print:bg-green-50 print:border-green-200'}`}>
                <p className={`mb-1 ${project.budget > 0 && totalCost > project.budget ? 'text-red-400 print:text-red-600' : 'text-green-400 print:text-green-600'}`}>
                  Budget Status
                </p>
                <p className={`text-lg ${project.budget > 0 && totalCost > project.budget ? 'text-red-300 print:text-red-900' : 'text-green-300 print:text-green-900'}`}>
                  {project.budget > 0 
                    ? (totalCost > project.budget ? 'Over Budget' : 'Within Budget')
                    : 'No Budget Set'
                  }
                </p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg print:bg-purple-50 print:border-purple-200">
                <p className="text-purple-400 mb-1 print:text-purple-600">Total Components</p>
                <p className="text-2xl text-purple-300 print:text-purple-900">{totalComponents}</p>
              </div>
            </div>
          </div>

          <div className="text-slate-400 print:text-slate-500 text-center pt-4 border-t border-white/10 print:border-slate-200">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
