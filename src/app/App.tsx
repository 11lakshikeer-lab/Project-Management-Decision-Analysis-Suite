import { useState, useEffect } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { 
  Target, 
  Calculator, 
  ListChecks, 
  GitBranch, 
  Brain, 
  BarChart3, 
  Download,
  Home,
  Menu,
  X
} from 'lucide-react';
import HomePage from './components/HomePage';
import ProjectSetup from './components/ProjectSetup';
import EstimationMethods from './components/EstimationMethods';
import Prioritization from './components/Prioritization';
import DecisionTree from './components/DecisionTree';
import DecisionUnderUncertainty from './components/DecisionUnderUncertainty';
import Visualizations from './components/Visualizations';
import ExportPanel from './components/ExportPanel';
import { projectApi } from './utils/api';
import { Toaster } from './components/ui/sonner';
import { toast } from "sonner";

export interface Goal {
  id: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  estimatedCost: number;
  priority: 'Must' | 'Should' | 'Could' | 'Wont' | '';
  value: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  estimatedCost: number;
  priority: 'Must' | 'Should' | 'Could' | 'Wont' | '';
  value: number;
  startDate: string;
  endDate: string;
  components: Component[];
}

export interface Project {
  name: string;
  description: string;
  budget: number;
  deadline: string;
  goals: Goal[];
  modules: Module[];
  components: Component[];
}

export interface EstimationResult {
  method: string;
  totalHours: number;
  totalCost: number;
  breakdown: { name: string; hours: number; cost: number }[];
}

export interface SavedProjectData {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  project: Project;
  estimations: EstimationResult[];
  decisionTreeData?: any;
  uncertaintyData?: any;
}

type NavigationItem = 'home' | 'setup' | 'estimation' | 'prioritization' | 'decision-tree' | 'uncertainty' | 'visualizations' | 'export';

const CURRENT_PROJECT_KEY = 'pmdecision_current_project_id';

function App() {
  const [activeView, setActiveView] = useState<NavigationItem>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [project, setProject] = useState<Project>({
    name: '',
    description: '',
    budget: 0,
    deadline: '',
    goals: [],
    modules: [],
    components: []
  });

  const [estimations, setEstimations] = useState<EstimationResult[]>([]);
  const [decisionTreeData, setDecisionTreeData] = useState<any>(null);
  const [uncertaintyData, setUncertaintyData] = useState<any>(null);

  // Load saved projects from database
  const getSavedProjects = async () => {
    setIsLoadingProjects(true);
    const projects = await projectApi.getAllProjects();
    setSavedProjects(projects);
    setIsLoadingProjects(false);
    return projects;
  };

  // Create new project
  const createNewProject = () => {
    const newId = `project_${Date.now()}`;
    setCurrentProjectId(newId);
    setProject({
      name: '',
      description: '',
      budget: 0,
      deadline: '',
      goals: [],
      modules: [],
      components: []
    });
    setEstimations([]);
    setDecisionTreeData(null);
    setUncertaintyData(null);
    localStorage.setItem(CURRENT_PROJECT_KEY, newId);
    setActiveView('setup');
  };

  // Load existing project
  const loadProject = (projectData: SavedProjectData) => {
    setCurrentProjectId(projectData.id);
    setProject(projectData.project);
    setEstimations(projectData.estimations || []);
    setDecisionTreeData(projectData.decisionTreeData || null);
    setUncertaintyData(projectData.uncertaintyData || null);
    localStorage.setItem(CURRENT_PROJECT_KEY, projectData.id);
    setActiveView('setup');
  };

  // Delete project
  const deleteProject = async (projectId: string) => {
    const projectName = savedProjects.find(p => p.id === projectId)?.name || 'Project';
    
    try {
      const success = await projectApi.deleteProject(projectId);
      
      if (success) {
        toast.success(`${projectName} deleted successfully`);
        
        // Refresh the projects list
        await getSavedProjects();
        
        if (currentProjectId === projectId) {
          setCurrentProjectId(null);
          setProject({
            name: '',
            description: '',
            budget: 0,
            deadline: '',
            goals: [],
            modules: [],
            components: []
          });
          setEstimations([]);
          setDecisionTreeData(null);
          setUncertaintyData(null);
          localStorage.removeItem(CURRENT_PROJECT_KEY);
          setActiveView('home');
        }
      } else {
        toast.error('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project.');
    }
  };

  // Auto-save current project to database
  useEffect(() => {
    const saveProjectToDb = async () => {
      if (currentProjectId && project.name) {
        try {
          // Find existing project to get createdAt
          const existingProject = savedProjects.find(p => p.id === currentProjectId);
          
          const projectData: SavedProjectData = {
            id: currentProjectId,
            name: project.name || 'Untitled Project',
            createdAt: existingProject?.createdAt || new Date().toISOString(),
            lastModified: new Date().toISOString(),
            project,
            estimations,
            decisionTreeData,
            uncertaintyData,
          };

          const success = await projectApi.saveProject(projectData);
          
          if (success) {
            // Update local state
            setSavedProjects(prev => {
              const index = prev.findIndex(p => p.id === currentProjectId);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = projectData;
                return updated;
              } else {
                return [...prev, projectData];
              }
            });
          }
        } catch (error) {
          console.error('Error auto-saving project:', error);
        }
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveProjectToDb, 1000);
    return () => clearTimeout(timeoutId);
  }, [project, estimations, decisionTreeData, uncertaintyData, currentProjectId]);

  // Load projects and last opened project on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const projects = await getSavedProjects();
      
      const lastProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (lastProjectId) {
        const lastProject = projects.find(p => p.id === lastProjectId);
        if (lastProject) {
          loadProject(lastProject);
        }
      }
    };

    loadInitialData();
  }, []);

  const navigationItems = [
    { id: 'home' as NavigationItem, label: 'Home', icon: Home, description: 'Overview' },
    { id: 'setup' as NavigationItem, label: 'Project Setup', icon: Target, description: 'Goals & Components' },
    { id: 'estimation' as NavigationItem, label: 'Estimation', icon: Calculator, description: 'Multi-method Analysis' },
    { id: 'prioritization' as NavigationItem, label: 'Prioritization', icon: ListChecks, description: 'MoSCoW & Ranking' },
    { id: 'decision-tree' as NavigationItem, label: 'Decision Tree', icon: GitBranch, description: 'EMV Analysis' },
    { id: 'uncertainty' as NavigationItem, label: 'Uncertainty', icon: Brain, description: 'Decision Criteria' },
    { id: 'visualizations' as NavigationItem, label: 'Visualizations', icon: BarChart3, description: 'Charts & Timeline' },
    { id: 'export' as NavigationItem, label: 'Export', icon: Download, description: 'Download & Print' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomePage 
            onCreateNew={createNewProject}
            onLoadProject={loadProject}
            onDeleteProject={deleteProject}
            savedProjects={savedProjects}
            isLoading={isLoadingProjects}
          />
        );
      case 'setup':
        return <ProjectSetup project={project} setProject={setProject} />;
      case 'estimation':
        return <EstimationMethods project={project} estimations={estimations} setEstimations={setEstimations} />;
      case 'prioritization':
        return <Prioritization project={project} setProject={setProject} />;
      case 'decision-tree':
        return <DecisionTree decisionTreeData={decisionTreeData} setDecisionTreeData={setDecisionTreeData} />;
      case 'uncertainty':
        return <DecisionUnderUncertainty uncertaintyData={uncertaintyData} setUncertaintyData={setUncertaintyData} />;
      case 'visualizations':
        return <Visualizations project={project} estimations={estimations} />;
      case 'export':
        return <ExportPanel project={project} estimations={estimations} />;
      default:
        return <HomePage onGetStarted={() => setActiveView('setup')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark">
      <Toaster />
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="glass-card border-white/20"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 glass-card border-r border-white/10 z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo/Title */}
          <div className="mb-8">
            <h2 className="text-2xl text-white mb-1">PMDecision</h2>
            <p className="text-slate-400">Project Management Suite</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <div className="text-left">
                    <p className={`${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500">
              Software Engineering Economics
            </p>
            <p className="text-xs text-slate-600 mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          {activeView !== 'home' && (
            <div className="mb-8 animate-fade-in">
              <Card className="glass-card border-white/10">
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const currentItem = navigationItems.find(item => item.id === activeView);
                      if (currentItem) {
                        const Icon = currentItem.icon;
                        return (
                          <>
                            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                              <Icon className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <h1 className="text-2xl text-white">{currentItem.label}</h1>
                              <p className="text-slate-400">{currentItem.description}</p>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Content Area */}
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
