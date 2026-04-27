import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  ArrowRight, 
  Target, 
  Calculator, 
  ListChecks, 
  GitBranch, 
  Brain, 
  BarChart3, 
  CheckCircle2,
  Plus,
  FolderOpen,
  Trash2,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { SavedProjectData } from '../App';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface HomePageProps {
  onCreateNew: () => void;
  onLoadProject: (project: SavedProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  savedProjects: SavedProjectData[];
  isLoading: boolean;
}

export default function HomePage({ onCreateNew, onLoadProject, onDeleteProject, savedProjects, isLoading }: HomePageProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
          <p className="text-purple-300">Software Engineering Economics</p>
        </div>
        <h1 className="text-5xl md:text-6xl text-white mb-6">
          Project Management &<br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Decision Analysis Suite
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          A comprehensive platform for project planning, estimation, prioritization, and decision-making under risk and uncertainty.
          Built on proven software engineering economics principles.
        </p>
      </div>

      {/* Project Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl text-white mb-2">Your Projects</h2>
            <p className="text-slate-400">Create a new project or continue with an existing one</p>
          </div>
          <Button 
            onClick={onCreateNew} 
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="mr-2 w-5 h-5" />
            Create New Project
          </Button>
        </div>

        {isLoading ? (
          <Card className="glass-card border-white/10">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl text-white mb-2">Loading projects...</h3>
              <p className="text-slate-400">Please wait while we fetch your projects</p>
            </CardContent>
          </Card>
        ) : savedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProjects.map((savedProject) => (
              <Card key={savedProject.id} className="glass-card border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderOpen className="w-8 h-8 text-purple-400 mb-3" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-300">
                            Are you sure you want to delete "{savedProject.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await onDeleteProject(savedProject.id);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardTitle className="text-white line-clamp-1">{savedProject.name}</CardTitle>
                  <CardDescription className="text-slate-400 line-clamp-2">
                    {savedProject.project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(savedProject.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Modified: {formatDate(savedProject.lastModified)}</span>
                  </div>
                  <div className="pt-2 flex gap-2 text-xs text-slate-500">
                    <span>{savedProject.project.modules.length} modules</span>
                    <span>•</span>
                    <span>{savedProject.project.goals.length} goals</span>
                    {savedProject.estimations.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{savedProject.estimations.length} estimates</span>
                      </>
                    )}
                  </div>
                  <Button 
                    onClick={() => onLoadProject(savedProject)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <ArrowRight className="mr-2 w-4 h-4" />
                    Open Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card border-purple-500/20">
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first project to start managing your software engineering decisions
              </p>
              <Button 
                onClick={onCreateNew} 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="mr-2 w-5 h-5" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Features Grid */}
      <div className="space-y-4">
        <h2 className="text-3xl text-white">Features & Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <CardHeader>
              <Target className="w-10 h-10 text-purple-400 mb-4" />
              <CardTitle className="text-white">SMART Goals</CardTitle>
              <CardDescription className="text-slate-300">
                Define Specific, Measurable, Achievable, Relevant, and Time-bound goals aligned with business objectives
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <CardHeader>
              <Calculator className="w-10 h-10 text-blue-400 mb-4" />
              <CardTitle className="text-white">Multi-Method Estimation</CardTitle>
              <CardDescription className="text-slate-300">
                Expert judgment, analogy-based, bottom-up, scaling, and aggregate estimation techniques
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <CardHeader>
              <ListChecks className="w-10 h-10 text-green-400 mb-4" />
              <CardTitle className="text-white">MoSCoW Prioritization</CardTitle>
              <CardDescription className="text-slate-300">
                Categorize requirements and rank by value-to-cost ratio for optimal resource allocation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
            <CardHeader>
              <GitBranch className="w-10 h-10 text-orange-400 mb-4" />
              <CardTitle className="text-white">Decision Tree Analysis</CardTitle>
              <CardDescription className="text-slate-300">
                EMV calculation and folded-back analysis for decisions under risk with probabilistic outcomes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-pink-500/20 hover:border-pink-500/40 transition-all duration-300">
            <CardHeader>
              <Brain className="w-10 h-10 text-pink-400 mb-4" />
              <CardTitle className="text-white">Uncertainty Analysis</CardTitle>
              <CardDescription className="text-slate-300">
                Maximin, Maximax, Hurwicz, Laplace, and Minimax Regret criteria for unknown probabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Visual Analytics</CardTitle>
              <CardDescription className="text-slate-300">
                Gantt timelines, estimation comparisons, and interactive charts for data-driven insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Methodology Section */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Based on Software Engineering Economics</CardTitle>
          <CardDescription className="text-slate-300">
            This application implements proven methodologies from software project management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Goals-Estimates-Plans Framework</h4>
                  <p className="text-slate-400">Iterative alignment of business goals with realistic estimates and actionable plans</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Multiple Estimation Techniques</h4>
                  <p className="text-slate-400">Combines expert judgment, analogy, bottom-up, and scaling methods for accuracy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Risk-Based Decision Making</h4>
                  <p className="text-slate-400">Expected Monetary Value (EMV) and decision tree analysis for quantitative risk assessment</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Bayesian Decision Criteria</h4>
                  <p className="text-slate-400">Use subjective probabilities and expected payoffs for informed decision-making</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Uncertainty Management</h4>
                  <p className="text-slate-400">Five criteria (Maximin, Maximax, Hurwicz, Laplace, Minimax Regret) for decisions without probabilities</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white mb-1">Value-Based Prioritization</h4>
                  <p className="text-slate-400">MoSCoW method and value-cost ratio analysis for optimal feature selection</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Project Planning</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <p>• Define project scope with components</p>
            <p>• Set budget and deadline constraints</p>
            <p>• Create SMART business goals</p>
            <p>• Generate timeline and milestones</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Cost Estimation</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <p>• Compare multiple estimation methods</p>
            <p>• Validate against historical data</p>
            <p>• Calculate aggregate estimates</p>
            <p>• Track budget vs. actual cost</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white">Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <p>• Build decision trees with outcomes</p>
            <p>• Calculate expected monetary value</p>
            <p>• Handle uncertain scenarios</p>
            <p>• Make data-driven choices</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
