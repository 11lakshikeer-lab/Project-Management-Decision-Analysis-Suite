import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Plus, Trash2, AlertCircle, Package, Layers, ChevronDown, ChevronRight, Edit, Calendar } from 'lucide-react';
import { Project, Goal, Component, Module } from '../App';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface ProjectSetupProps {
  project: Project;
  setProject: (project: Project) => void;
}

interface ProjectErrors {
  name?: string;
  deadline?: string;
  description?: string;
  budget?: string;
}

interface GoalErrors {
  specific?: string;
  measurable?: string;
}

interface ModuleInput {
  name: string;
  description: string;
  estimatedHours: number;
  estimatedCost: number;
  value: number;
  startDate: string;
  endDate: string;
  numComponents: number;
  components: ComponentInput[];
}

interface ComponentInput {
  name: string;
  description: string;
  estimatedHours: number;
  estimatedCost: number;
  value: number;
}

interface ModuleErrors {
  [moduleIndex: number]: {
    name?: string;
    estimatedHours?: string;
    estimatedCost?: string;
    value?: string;
    startDate?: string;
    endDate?: string;
    numComponents?: string;
    budgetExceeded?: string;
    components?: {
      [componentIndex: number]: {
        name?: string;
        estimatedHours?: string;
        estimatedCost?: string;
        value?: string;
        budgetExceeded?: string;
      };
    };
  };
}

export default function ProjectSetup({ project, setProject }: ProjectSetupProps) {
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: ''
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Modules state
  const [numModules, setNumModules] = useState<number>(1);
  const [numModulesError, setNumModulesError] = useState<string>('');
  const [editingModules, setEditingModules] = useState<ModuleInput[]>([]);
  const [moduleErrors, setModuleErrors] = useState<ModuleErrors>({});
  const [totalBudgetError, setTotalBudgetError] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [isEditingExistingModules, setIsEditingExistingModules] = useState(false);

  const [projectErrors, setProjectErrors] = useState<ProjectErrors>({});
  const [goalErrors, setGoalErrors] = useState<GoalErrors>({});

  // Validation functions
  const validateProjectName = (name: string): string => {
    if (!name || name.trim() === '') return 'Project name is required';
    if (name.trim().length < 3) return 'Project name must be at least 3 characters';
    return '';
  };

  const validateDeadline = (deadline: string): string => {
    if (!deadline) return 'Deadline is required';
    const selectedDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return 'Deadline must be today or in the future';
    return '';
  };

  const validateBudget = (budget: number): string => {
    if (budget < 0) return 'Budget cannot be negative';
    if (budget === 0) return 'Budget should be greater than 0';
    return '';
  };

  const validateDescription = (description: string): string => {
    if (description && description.trim().length > 0 && description.trim().length < 10) {
      return 'Description should be at least 10 characters if provided';
    }
    return '';
  };

  const validateNumModules = (num: number): boolean => {
    if (num < 1) {
      setNumModulesError('Minimum 1 module required');
      return false;
    }
    setNumModulesError('');
    return true;
  };

  const validateGoalSpecific = (specific: string): string => {
    if (!specific || specific.trim() === '') return 'Specific goal is required';
    if (specific.trim().length < 10) return 'Please provide more details (at least 10 characters)';
    return '';
  };

  const validateGoalMeasurable = (measurable: string): string => {
    if (!measurable || measurable.trim() === '') return 'Measurable criteria is required';
    if (measurable.trim().length < 10) return 'Please provide more details (at least 10 characters)';
    return '';
  };

  const validateItemName = (name: string): string => {
    if (!name || name.trim() === '') return 'Name is required';
    if (name.trim().length < 3) return 'Name must be at least 3 characters';
    return '';
  };

  const validateEstimatedHours = (hours: number): string => {
    if (hours < 0) return 'Estimated hours cannot be negative';
    if (hours === 0) return 'Estimated hours should be greater than 0';
    if (hours > 10000) return 'Estimated hours seems unreasonably high (max 10,000)';
    return '';
  };

  const validateEstimatedCost = (cost: number, budget: number): string => {
    if (cost < 0) return 'Estimated cost cannot be negative';
    if (budget > 0 && cost > budget) return `Cost exceeds budget ($${budget.toLocaleString()})`;
    return '';
  };

  const validateValueScore = (value: number): string => {
    if (value < 1) return 'Value score must be at least 1';
    if (value > 10) return 'Value score cannot exceed 10';
    return '';
  };

  const validateModuleStartDate = (startDate: string): string => {
    if (!startDate) return 'Start date is required';
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) return 'Start date cannot be in the past';
    return '';
  };

  const validateModuleEndDate = (endDate: string, startDate: string): string => {
    if (!endDate) return 'End date is required';
    if (!startDate) return 'Please set start date first';
    
    const end = new Date(endDate);
    const start = new Date(startDate);
    const projectDeadline = new Date(project.deadline);
    
    if (end <= start) return 'End date must be after start date';
    if (project.deadline && end > projectDeadline) {
      return `End date cannot exceed project deadline (${project.deadline})`;
    }
    return '';
  };

  const validateNumComponents = (num: number): string => {
    if (num < 1) return 'Minimum 1 component required';
    return '';
  };

  const validateComponentHours = (componentHours: number, moduleHours: number): string => {
    if (componentHours > moduleHours) {
      return `Component hours (${componentHours}) cannot exceed module hours (${moduleHours})`;
    }
    return '';
  };

  const validateComponentCost = (componentCost: number, moduleBudget: number): string => {
    if (componentCost < 0) return 'Component cost cannot be negative';
    if (moduleBudget > 0 && componentCost > moduleBudget) {
      return `Component cost ($${componentCost.toLocaleString()}) exceeds module budget ($${moduleBudget.toLocaleString()})`;
    }
    return '';
  };

  const validateModuleTotalHours = (moduleIndex: number): string => {
    const module = editingModules[moduleIndex];
    if (module.components.length === 0) return '';
    
    const totalComponentHours = module.components.reduce((sum, comp) => sum + (comp.estimatedHours || 0), 0);
    const moduleHours = module.estimatedHours || 0;
    
    if (totalComponentHours !== moduleHours) {
      return `Total component hours (${totalComponentHours}) must equal module hours (${moduleHours})`;
    }
    return '';
  };

  const validateModuleTotalCost = (moduleIndex: number): string => {
    const module = editingModules[moduleIndex];
    if (module.components.length === 0) return '';
    
    const totalComponentCost = module.components.reduce((sum, comp) => sum + (comp.estimatedCost || 0), 0);
    const moduleBudget = module.estimatedCost || 0;
    
    if (totalComponentCost > moduleBudget) {
      return `Total component costs ($${totalComponentCost.toLocaleString()}) exceed module budget ($${moduleBudget.toLocaleString()})`;
    }
    return '';
  };

  const calculateTotalCost = (): number => {
    // Only sum module costs (components are subset of modules)
    return editingModules.reduce((total, module) => {
      return total + (module.estimatedCost || 0);
    }, 0);
  };

  const validateTotalBudget = (): string => {
    const totalModuleCost = calculateTotalCost();
    if (project.budget > 0 && totalModuleCost > project.budget) {
      return `Total module costs ($${totalModuleCost.toLocaleString()}) exceed project budget ($${project.budget.toLocaleString()}) by $${(totalModuleCost - project.budget).toLocaleString()}`;
    }
    return '';
  };

  // Update handlers
  const handleProjectNameChange = (name: string) => {
    setProject({ ...project, name });
    const error = validateProjectName(name);
    setProjectErrors(prev => ({ ...prev, name: error || undefined }));
  };

  const handleDeadlineChange = (deadline: string) => {
    setProject({ ...project, deadline });
    const error = validateDeadline(deadline);
    setProjectErrors(prev => ({ ...prev, deadline: error || undefined }));
  };

  const handleDescriptionChange = (description: string) => {
    setProject({ ...project, description });
    const error = validateDescription(description);
    setProjectErrors(prev => ({ ...prev, description: error || undefined }));
  };

  const handleBudgetChange = (budget: number) => {
    setProject({ ...project, budget });
    const error = validateBudget(budget);
    setProjectErrors(prev => ({ ...prev, budget: error || undefined }));
    
    if (editingModules.length > 0) {
      const totalError = validateTotalBudget();
      setTotalBudgetError(totalError);
    }
  };

  // Goal handlers
  const handleGoalSpecificChange = (specific: string) => {
    setNewGoal({ ...newGoal, specific });
    const error = validateGoalSpecific(specific);
    setGoalErrors(prev => ({ ...prev, specific: error || undefined }));
  };

  const handleGoalMeasurableChange = (measurable: string) => {
    setNewGoal({ ...newGoal, measurable });
    const error = validateGoalMeasurable(measurable);
    setGoalErrors(prev => ({ ...prev, measurable: error || undefined }));
  };

  const addGoal = () => {
    const specificError = validateGoalSpecific(newGoal.specific || '');
    const measurableError = validateGoalMeasurable(newGoal.measurable || '');
    
    if (specificError || measurableError) {
      setGoalErrors({
        specific: specificError || undefined,
        measurable: measurableError || undefined
      });
      return;
    }

    if (editingGoalId) {
      // Update existing goal
      setProject({
        ...project,
        goals: project.goals.map(g => 
          g.id === editingGoalId
            ? {
                ...g,
                specific: newGoal.specific || '',
                measurable: newGoal.measurable || '',
                achievable: newGoal.achievable || '',
                relevant: newGoal.relevant || '',
                timeBound: newGoal.timeBound || ''
              }
            : g
        )
      });
      setEditingGoalId(null);
    } else {
      // Add new goal
      const goal: Goal = {
        id: Date.now().toString(),
        specific: newGoal.specific || '',
        measurable: newGoal.measurable || '',
        achievable: newGoal.achievable || '',
        relevant: newGoal.relevant || '',
        timeBound: newGoal.timeBound || ''
      };
      setProject({ ...project, goals: [...project.goals, goal] });
    }
    
    setNewGoal({ specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' });
    setGoalErrors({});
  };

  const editGoal = (id: string) => {
    const goal = project.goals.find(g => g.id === id);
    if (goal) {
      setNewGoal({
        specific: goal.specific,
        measurable: goal.measurable,
        achievable: goal.achievable,
        relevant: goal.relevant,
        timeBound: goal.timeBound
      });
      setEditingGoalId(id);
    }
  };

  const cancelEditGoal = () => {
    setEditingGoalId(null);
    setNewGoal({ specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' });
    setGoalErrors({});
  };

  const removeGoal = (id: string) => {
    setProject({ ...project, goals: project.goals.filter(g => g.id !== id) });
    if (editingGoalId === id) {
      cancelEditGoal();
    }
  };

  // Initialize modules
  const handleNumModulesChange = (num: number) => {
    if (!validateNumModules(num)) return;
    
    setNumModules(num);
    const newModules: ModuleInput[] = Array(num).fill(null).map(() => ({
      name: '',
      description: '',
      estimatedHours: 0,
      estimatedCost: 0,
      value: 0,
      startDate: '',
      endDate: '',
      numComponents: 1,
      components: []
    }));
    setEditingModules(newModules);
    setModuleErrors({});
    setTotalBudgetError('');
    setExpandedModules(new Set());
  };

  // Update module field
  const updateModuleField = (moduleIndex: number, field: keyof ModuleInput, value: any) => {
    const updated = [...editingModules];
    updated[moduleIndex] = { ...updated[moduleIndex], [field]: value };
    setEditingModules(updated);

    // Validate the field
    const errors = { ...moduleErrors };
    if (!errors[moduleIndex]) errors[moduleIndex] = {};

    let fieldError = '';
    switch (field) {
      case 'name':
        fieldError = validateItemName(value);
        if (fieldError) errors[moduleIndex].name = fieldError;
        else delete errors[moduleIndex].name;
        break;
      case 'estimatedHours':
        fieldError = validateEstimatedHours(value);
        if (fieldError) errors[moduleIndex].estimatedHours = fieldError;
        else delete errors[moduleIndex].estimatedHours;
        break;
      case 'estimatedCost':
        fieldError = validateEstimatedCost(value, project.budget);
        if (fieldError) errors[moduleIndex].budgetExceeded = fieldError;
        else delete errors[moduleIndex].budgetExceeded;
        break;
      case 'startDate':
        fieldError = validateModuleStartDate(value);
        if (fieldError) errors[moduleIndex].startDate = fieldError;
        else delete errors[moduleIndex].startDate;
        // Re-validate end date if it exists
        if (updated[moduleIndex].endDate) {
          const endError = validateModuleEndDate(updated[moduleIndex].endDate, value);
          if (endError) errors[moduleIndex].endDate = endError;
          else delete errors[moduleIndex].endDate;
        }
        break;
      case 'endDate':
        fieldError = validateModuleEndDate(value, updated[moduleIndex].startDate);
        if (fieldError) errors[moduleIndex].endDate = fieldError;
        else delete errors[moduleIndex].budgetExceeded;
        break;
      case 'value':
        fieldError = validateValueScore(value);
        if (fieldError) errors[moduleIndex].value = fieldError;
        else delete errors[moduleIndex].value;
        break;
      case 'numComponents':
        fieldError = validateNumComponents(value);
        if (fieldError) errors[moduleIndex].numComponents = fieldError;
        else delete errors[moduleIndex].numComponents;
        break;
    }

    if (Object.keys(errors[moduleIndex]).length === 0) delete errors[moduleIndex];
    setModuleErrors(errors);

    const totalError = validateTotalBudget();
    setTotalBudgetError(totalError);
  };

  // Initialize components for a module
  const initializeModuleComponents = (moduleIndex: number) => {
    const module = editingModules[moduleIndex];
    const numComps = module.numComponents;

    if (numComps < 1) {
      const errors = { ...moduleErrors };
      if (!errors[moduleIndex]) errors[moduleIndex] = {};
      errors[moduleIndex].numComponents = 'Minimum 1 component required';
      setModuleErrors(errors);
      return;
    }

    const newComponents: ComponentInput[] = Array(numComps).fill(null).map(() => ({
      name: '',
      description: '',
      estimatedHours: 0,
      estimatedCost: 0,
      value: 0
    }));

    const updated = [...editingModules];
    updated[moduleIndex].components = newComponents;
    setEditingModules(updated);

    // Expand this module
    setExpandedModules(prev => new Set(prev).add(moduleIndex));
  };

  // Update component field
  const updateComponentField = (
    moduleIndex: number,
    componentIndex: number,
    field: keyof ComponentInput,
    value: any
  ) => {
    const updated = [...editingModules];
    updated[moduleIndex].components[componentIndex] = {
      ...updated[moduleIndex].components[componentIndex],
      [field]: value
    };
    setEditingModules(updated);

    // Validate the field
    const errors = { ...moduleErrors };
    if (!errors[moduleIndex]) errors[moduleIndex] = {};
    if (!errors[moduleIndex].components) errors[moduleIndex].components = {};

    let fieldError = '';
    switch (field) {
      case 'name':
        fieldError = validateItemName(value);
        break;
      case 'estimatedHours':
        fieldError = validateEstimatedHours(value);
        if (!fieldError) {
          // Also check if component hours exceed module hours
          const moduleHours = updated[moduleIndex].estimatedHours;
          const hoursExceedError = validateComponentHours(value, moduleHours);
          if (hoursExceedError) {
            fieldError = hoursExceedError;
          }
        }
        break;
      case 'estimatedCost':
        // Validate against module budget (not project budget)
        const moduleBudget = updated[moduleIndex].estimatedCost;
        fieldError = validateComponentCost(value, moduleBudget);
        if (fieldError) {
          if (!errors[moduleIndex].components![componentIndex]) {
            errors[moduleIndex].components![componentIndex] = {};
          }
          errors[moduleIndex].components![componentIndex].budgetExceeded = fieldError;
        } else if (errors[moduleIndex].components![componentIndex]) {
          delete errors[moduleIndex].components![componentIndex].budgetExceeded;
          if (Object.keys(errors[moduleIndex].components![componentIndex]).length === 0) {
            delete errors[moduleIndex].components![componentIndex];
          }
        }
        break;
      case 'value':
        fieldError = validateValueScore(value);
        break;
    }

    if (fieldError && field !== 'estimatedCost') {
      if (!errors[moduleIndex].components![componentIndex]) {
        errors[moduleIndex].components![componentIndex] = {};
      }
      errors[moduleIndex].components![componentIndex][field] = fieldError;
    } else if (field !== 'estimatedCost' && errors[moduleIndex].components![componentIndex]) {
      delete errors[moduleIndex].components![componentIndex][field];
      if (Object.keys(errors[moduleIndex].components![componentIndex]).length === 0) {
        delete errors[moduleIndex].components![componentIndex];
      }
    }

    if (errors[moduleIndex].components && Object.keys(errors[moduleIndex].components).length === 0) {
      delete errors[moduleIndex].components;
    }
    if (Object.keys(errors[moduleIndex]).length === 0) {
      delete errors[moduleIndex];
    }

    setModuleErrors(errors);

    const totalError = validateTotalBudget();
    setTotalBudgetError(totalError);
  };

  // Validate all modules and components
  const validateAllModules = (): boolean => {
    const errors: ModuleErrors = {};
    let hasErrors = false;

    editingModules.forEach((module, moduleIndex) => {
      const modErrors: any = {};

      // Validate module fields
      const nameError = validateItemName(module.name);
      if (nameError) {
        modErrors.name = nameError;
        hasErrors = true;
      }

      const hoursError = validateEstimatedHours(module.estimatedHours);
      if (hoursError) {
        modErrors.estimatedHours = hoursError;
        hasErrors = true;
      }

      const costError = validateEstimatedCost(module.estimatedCost, project.budget);
      if (costError) {
        modErrors.budgetExceeded = costError;
        hasErrors = true;
      }

      const valueError = validateValueScore(module.value);
      if (valueError) {
        modErrors.value = valueError;
        hasErrors = true;
      }

      // Validate dates
      const startDateError = validateModuleStartDate(module.startDate);
      if (startDateError) {
        modErrors.startDate = startDateError;
        hasErrors = true;
      }

      const endDateError = validateModuleEndDate(module.endDate, module.startDate);
      if (endDateError) {
        modErrors.endDate = endDateError;
        hasErrors = true;
      }

      // Check if components are initialized
      if (module.components.length === 0) {
        modErrors.numComponents = 'Please initialize components for this module';
        hasErrors = true;
      }

      // Validate components
      const compErrors: any = {};
      module.components.forEach((comp, compIndex) => {
        const compErrObj: any = {};

        const compNameError = validateItemName(comp.name);
        if (compNameError) {
          compErrObj.name = compNameError;
          hasErrors = true;
        }

        const compHoursError = validateEstimatedHours(comp.estimatedHours);
        if (compHoursError) {
          compErrObj.estimatedHours = compHoursError;
          hasErrors = true;
        }

        // Check if component hours exceed module hours
        if (!compHoursError) {
          const hoursExceedError = validateComponentHours(comp.estimatedHours, module.estimatedHours);
          if (hoursExceedError) {
            compErrObj.estimatedHours = hoursExceedError;
            hasErrors = true;
          }
        }

        // Validate component cost against module budget (not project budget)
        const compCostError = validateComponentCost(comp.estimatedCost, module.estimatedCost);
        if (compCostError) {
          compErrObj.budgetExceeded = compCostError;
          hasErrors = true;
        }

        const compValueError = validateValueScore(comp.value);
        if (compValueError) {
          compErrObj.value = compValueError;
          hasErrors = true;
        }

        if (Object.keys(compErrObj).length > 0) {
          compErrors[compIndex] = compErrObj;
        }
      });

      if (Object.keys(compErrors).length > 0) {
        modErrors.components = compErrors;
      }

      // Validate total component hours equals module hours
      if (module.components.length > 0) {
        const totalHoursError = validateModuleTotalHours(moduleIndex);
        if (totalHoursError) {
          modErrors.estimatedHours = totalHoursError;
          hasErrors = true;
        }

        // Validate total component costs don't exceed module budget
        const totalCostError = validateModuleTotalCost(moduleIndex);
        if (totalCostError) {
          modErrors.budgetExceeded = totalCostError;
          hasErrors = true;
        }
      }

      if (Object.keys(modErrors).length > 0) {
        errors[moduleIndex] = modErrors;
      }
    });

    setModuleErrors(errors);

    const totalError = validateTotalBudget();
    setTotalBudgetError(totalError);
    if (totalError) hasErrors = true;

    return !hasErrors;
  };

  // Save all modules with components
  const saveAllModules = () => {
    if (!validateAllModules()) return;

    if (isEditingExistingModules) {
      // Update existing modules
      const newModules: Module[] = editingModules.map((mod, modIndex) => ({
        id: mod.name + Date.now().toString() + 'mod' + modIndex,
        name: mod.name,
        description: mod.description,
        estimatedHours: mod.estimatedHours,
        estimatedCost: mod.estimatedCost,
        priority: '',
        value: mod.value,
        startDate: mod.startDate,
        endDate: mod.endDate,
        components: mod.components.map((comp, compIndex) => ({
          id: mod.name + Date.now().toString() + 'mod' + modIndex + 'comp' + compIndex,
          name: comp.name,
          description: comp.description,
          estimatedHours: comp.estimatedHours,
          estimatedCost: comp.estimatedCost,
          priority: '',
          value: comp.value
        }))
      }));
      
      // Update flat components array
      const allComponents = newModules.flatMap(m => m.components);
      
      setProject({ ...project, modules: newModules, components: allComponents });
      setIsEditingExistingModules(false);
    } else {
      // Add new modules
      const newModules: Module[] = editingModules.map((mod, modIndex) => ({
        id: Date.now().toString() + 'mod' + modIndex,
        name: mod.name,
        description: mod.description,
        estimatedHours: mod.estimatedHours,
        estimatedCost: mod.estimatedCost,
        priority: '',
        value: mod.value,
        startDate: mod.startDate,
        endDate: mod.endDate,
        components: mod.components.map((comp, compIndex) => ({
          id: Date.now().toString() + 'mod' + modIndex + 'comp' + compIndex,
          name: comp.name,
          description: comp.description,
          estimatedHours: comp.estimatedHours,
          estimatedCost: comp.estimatedCost,
          priority: '',
          value: comp.value
        }))
      }));

      // Update flat components array
      const newComponents = newModules.flatMap(m => m.components);
      
      setProject({ 
        ...project, 
        modules: [...project.modules, ...newModules],
        components: [...project.components, ...newComponents]
      });
    }
    
    setEditingModules([]);
    setNumModules(1);
    setModuleErrors({});
    setTotalBudgetError('');
    setExpandedModules(new Set());
  };

  const editExistingModules = () => {
    if (project.modules.length === 0) return;
    
    const moduleInputs: ModuleInput[] = project.modules.map(module => ({
      name: module.name,
      description: module.description,
      estimatedHours: module.estimatedHours,
      estimatedCost: module.estimatedCost,
      value: module.value,
      startDate: module.startDate || '',
      endDate: module.endDate || '',
      numComponents: module.components.length,
      components: module.components.map(comp => ({
        name: comp.name,
        description: comp.description,
        estimatedHours: comp.estimatedHours,
        estimatedCost: comp.estimatedCost,
        value: comp.value
      }))
    }));
    
    setEditingModules(moduleInputs);
    setNumModules(project.modules.length);
    setIsEditingExistingModules(true);
    setExpandedModules(new Set(Array.from({ length: project.modules.length }, (_, i) => i)));
  };

  const removeModule = (id: string) => {
    setProject({ ...project, modules: project.modules.filter(m => m.id !== id) });
  };

  const clearModuleForm = () => {
    setEditingModules([]);
    setNumModules(1);
    setModuleErrors({});
    setTotalBudgetError('');
    setNumModulesError('');
    setExpandedModules(new Set());
    setIsEditingExistingModules(false);
  };

  const toggleModuleExpand = (index: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const hasProjectErrors = Object.values(projectErrors).some(error => error);
  const hasGoalErrors = Object.values(goalErrors).some(error => error);
  const hasModuleErrors = Object.keys(moduleErrors).length > 0 || !!totalBudgetError;

  const totalCost = calculateTotalCost();
  const remainingBudget = project.budget - totalCost;

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Project Overview</CardTitle>
          <CardDescription className="text-slate-300">Define your project's basic information and constraints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasProjectErrors && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Please fix the validation errors below.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-white">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={project.name}
                onChange={(e) => handleProjectNameChange(e.target.value)}
                className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                  projectErrors.name ? 'border-red-500' : ''
                }`}
              />
              {projectErrors.name && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {projectErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-white">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={project.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className={`bg-white/5 border-white/10 text-white [color-scheme:dark] ${
                  projectErrors.deadline ? 'border-red-500' : ''
                }`}
              />
              {projectErrors.deadline && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {projectErrors.deadline}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              value={project.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={3}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                projectErrors.description ? 'border-red-500' : ''
              }`}
            />
            {projectErrors.description && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {projectErrors.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget" className="text-white">Budget ($) *</Label>
            <Input
              id="budget"
              type="number"
              placeholder="0"
              min="0"
              step="1000"
              value={project.budget === 0 ? '' : project.budget}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === '-') {
                  handleBudgetChange(0);
                } else {
                  const parsed = parseFloat(value);
                  if (!isNaN(parsed)) {
                    handleBudgetChange(parsed);
                  }
                }
              }}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                projectErrors.budget ? 'border-red-500' : ''
              }`}
            />
            {projectErrors.budget && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {projectErrors.budget}
              </p>
            )}
            {project.budget > 0 && !projectErrors.budget && (
              <p className="text-slate-400 text-xs">
                Available budget: ${project.budget.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SMART Goals */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">SMART Goals</CardTitle>
          <CardDescription className="text-slate-300">Specific, Measurable, Achievable, Relevant, Time-bound</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasGoalErrors && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Please fix the validation errors in the goal fields.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-white">Specific *</Label>
              <Input
                placeholder="What exactly do you want to achieve?"
                value={newGoal.specific}
                onChange={(e) => handleGoalSpecificChange(e.target.value)}
                className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                  goalErrors.specific ? 'border-red-500' : ''
                }`}
              />
              {goalErrors.specific && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {goalErrors.specific}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-white">Measurable *</Label>
              <Input
                placeholder="How will you measure success?"
                value={newGoal.measurable}
                onChange={(e) => handleGoalMeasurableChange(e.target.value)}
                className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                  goalErrors.measurable ? 'border-red-500' : ''
                }`}
              />
              {goalErrors.measurable && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {goalErrors.measurable}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-white">Achievable</Label>
              <Input
                placeholder="Is this goal realistic?"
                value={newGoal.achievable}
                onChange={(e) => setNewGoal({ ...newGoal, achievable: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Relevant</Label>
              <Input
                placeholder="Why is this goal important?"
                value={newGoal.relevant}
                onChange={(e) => setNewGoal({ ...newGoal, relevant: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Time-bound</Label>
              <Input
                placeholder="When will you achieve this?"
                value={newGoal.timeBound}
                onChange={(e) => setNewGoal({ ...newGoal, timeBound: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={addGoal} 
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
              disabled={hasGoalErrors || !newGoal.specific || !newGoal.measurable}
            >
              <Plus className="w-4 h-4 mr-2" />
              {editingGoalId ? 'Update Goal' : 'Add SMART Goal'}
            </Button>
            {editingGoalId && (
              <Button 
                onClick={cancelEditGoal} 
                variant="outline"
                className="border-white/20"
              >
                Cancel
              </Button>
            )}
          </div>

          {project.goals.length > 0 && (
            <div className="space-y-3 mt-4">
              <Separator className="bg-white/10" />
              <h4 className="text-white">Current Goals ({project.goals.length})</h4>
              {project.goals.map((goal) => (
                <Card key={goal.id} className={`bg-white/5 border-white/10 ${editingGoalId === goal.id ? 'ring-2 ring-purple-500/50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 space-y-1 text-slate-300">
                        <p><span className="text-slate-500">S:</span> {goal.specific}</p>
                        <p><span className="text-slate-500">M:</span> {goal.measurable}</p>
                        {goal.achievable && <p><span className="text-slate-500">A:</span> {goal.achievable}</p>}
                        {goal.relevant && <p><span className="text-slate-500">R:</span> {goal.relevant}</p>}
                        {goal.timeBound && <p><span className="text-slate-500">T:</span> {goal.timeBound}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editGoal(goal.id)}
                          className="hover:bg-purple-500/20"
                          disabled={editingGoalId !== null && editingGoalId !== goal.id}
                        >
                          <Edit className="w-4 h-4 text-purple-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(goal.id)}
                          className="hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Modules with Components */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Project Modules & Components
          </CardTitle>
          <CardDescription className="text-slate-300">
            Define modules and their components. Each module must have at least 1 component. Total cost must not exceed project budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Number of Modules */}
          <div className="space-y-2">
            <Label className="text-white">Number of Modules (&gt; 0) *</Label>
            <div className="flex gap-3">
              <div className="flex-1 max-w-xs space-y-2">
                <Input
                  type="number"
                  min="1"
                  value={numModules}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setNumModules(val);
                    validateNumModules(val);
                  }}
                  className={`bg-white/5 border-white/10 text-white ${numModulesError ? 'border-red-500' : ''}`}
                />
                {numModulesError && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {numModulesError}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handleNumModulesChange(numModules)} 
                variant="outline" 
                className="border-white/20"
                disabled={!!numModulesError || !project.budget}
              >
                <Plus className="w-4 h-4 mr-2" />
                Initialize Modules
              </Button>
            </div>
            {!project.budget && (
              <p className="text-yellow-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please set project budget first before adding modules
              </p>
            )}
          </div>

          {/* Step 2: Module and Component Input Forms */}
          {editingModules.length > 0 && (
            <div className="space-y-4">
              {hasModuleErrors && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    Please fix all validation errors before saving modules.
                  </AlertDescription>
                </Alert>
              )}

              {totalBudgetError && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {totalBudgetError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Summary */}
              <Card className={`${
                totalCost > project.budget 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : remainingBudget < project.budget * 0.1 
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-slate-400 text-xs">Project Budget</p>
                      <p className="text-white text-lg">${project.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Module Budgets</p>
                      <p className={`text-lg ${totalCost > project.budget ? 'text-red-400' : 'text-white'}`}>
                        ${totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Remaining Budget</p>
                      <p className={`text-lg ${
                        remainingBudget < 0 
                          ? 'text-red-400' 
                          : remainingBudget < project.budget * 0.1 
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}>
                        ${remainingBudget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Module Forms */}
              {editingModules.map((module, moduleIndex) => (
                <Card key={moduleIndex} className="bg-white/5 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Module {moduleIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Module Details */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Module Name *</Label>
                        <Input
                          placeholder="e.g., User Management System"
                          value={module.name}
                          onChange={(e) => updateModuleField(moduleIndex, 'name', e.target.value)}
                          className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                            moduleErrors[moduleIndex]?.name ? 'border-red-500' : ''
                          }`}
                        />
                        {moduleErrors[moduleIndex]?.name && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {moduleErrors[moduleIndex].name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Description</Label>
                        <Textarea
                          placeholder="Module description..."
                          value={module.description}
                          onChange={(e) => updateModuleField(moduleIndex, 'description', e.target.value)}
                          rows={2}
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Estimated Hours *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={module.estimatedHours === 0 ? '' : module.estimatedHours}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateModuleField(moduleIndex, 'estimatedHours', 0);
                              } else {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                  updateModuleField(moduleIndex, 'estimatedHours', parsed);
                                }
                              }
                            }}
                            className={`bg-white/5 border-white/10 text-white ${
                              moduleErrors[moduleIndex]?.estimatedHours ? 'border-red-500' : ''
                            }`}
                          />
                          {moduleErrors[moduleIndex]?.estimatedHours && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {moduleErrors[moduleIndex].estimatedHours}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Estimated Cost ($) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="0"
                            value={module.estimatedCost === 0 ? '' : module.estimatedCost}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateModuleField(moduleIndex, 'estimatedCost', 0);
                              } else {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                  updateModuleField(moduleIndex, 'estimatedCost', parsed);
                                }
                              }
                            }}
                            className={`bg-white/5 border-white/10 text-white ${
                              moduleErrors[moduleIndex]?.budgetExceeded ? 'border-red-500' : ''
                            }`}
                          />
                          {moduleErrors[moduleIndex]?.budgetExceeded && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {moduleErrors[moduleIndex].budgetExceeded}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Value Score (1-10) *</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            placeholder="0"
                            value={module.value === 0 ? '' : module.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateModuleField(moduleIndex, 'value', 0);
                              } else {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                  updateModuleField(moduleIndex, 'value', parsed);
                                }
                              }
                            }}
                            className={`bg-white/5 border-white/10 text-white ${
                              moduleErrors[moduleIndex]?.value ? 'border-red-500' : ''
                            }`}
                          />
                          {moduleErrors[moduleIndex]?.value && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {moduleErrors[moduleIndex].value}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Module Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Start Date *</Label>
                          <Input
                            type="date"
                            value={module.startDate}
                            onChange={(e) => updateModuleField(moduleIndex, 'startDate', e.target.value)}
                            className={`bg-white/5 border-white/10 text-white ${
                              moduleErrors[moduleIndex]?.startDate ? 'border-red-500' : ''
                            }`}
                          />
                          {moduleErrors[moduleIndex]?.startDate && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {moduleErrors[moduleIndex].startDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">End Date *</Label>
                          <Input
                            type="date"
                            value={module.endDate}
                            onChange={(e) => updateModuleField(moduleIndex, 'endDate', e.target.value)}
                            className={`bg-white/5 border-white/10 text-white ${
                              moduleErrors[moduleIndex]?.endDate ? 'border-red-500' : ''
                            }`}
                          />
                          {moduleErrors[moduleIndex]?.endDate && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {moduleErrors[moduleIndex].endDate}
                            </p>
                          )}
                          {project.deadline && (
                            <p className="text-slate-400 text-xs">
                              Project deadline: {project.deadline}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Components Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Components for this Module
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Number of Components (&gt; 0) *</Label>
                        <div className="flex gap-3">
                          <div className="flex-1 max-w-xs space-y-2">
                            <Input
                              type="number"
                              min="1"
                              value={module.numComponents}
                              onChange={(e) => updateModuleField(moduleIndex, 'numComponents', parseInt(e.target.value) || 1)}
                              className={`bg-white/5 border-white/10 text-white ${
                                moduleErrors[moduleIndex]?.numComponents ? 'border-red-500' : ''
                              }`}
                            />
                            {moduleErrors[moduleIndex]?.numComponents && (
                              <p className="text-red-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {moduleErrors[moduleIndex].numComponents}
                              </p>
                            )}
                          </div>
                          <Button 
                            onClick={() => initializeModuleComponents(moduleIndex)} 
                            variant="outline" 
                            size="sm"
                            className="border-white/20"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Initialize Components
                          </Button>
                        </div>
                      </div>

                      {/* Component Forms */}
                      {module.components.length > 0 && (
                        <Collapsible
                          open={expandedModules.has(moduleIndex)}
                          onOpenChange={() => toggleModuleExpand(moduleIndex)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between hover:bg-white/5">
                              <span className="text-slate-300">
                                {module.components.length} Component(s) - Click to {expandedModules.has(moduleIndex) ? 'collapse' : 'expand'}
                              </span>
                              {expandedModules.has(moduleIndex) ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 mt-3">
                            {module.components.map((component, compIndex) => (
                              <Card key={compIndex} className="bg-white/10 border-pink-500/20">
                                <CardHeader>
                                  <CardTitle className="text-white text-sm">
                                    Component {compIndex + 1}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-white text-sm">Component Name *</Label>
                                    <Input
                                      placeholder="e.g., Login Form"
                                      value={component.name}
                                      onChange={(e) => updateComponentField(moduleIndex, compIndex, 'name', e.target.value)}
                                      className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                                        moduleErrors[moduleIndex]?.components?.[compIndex]?.name ? 'border-red-500' : ''
                                      }`}
                                    />
                                    {moduleErrors[moduleIndex]?.components?.[compIndex]?.name && (
                                      <p className="text-red-400 text-xs flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {moduleErrors[moduleIndex].components![compIndex].name}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-white text-sm">Description</Label>
                                    <Textarea
                                      placeholder="Component description..."
                                      value={component.description}
                                      onChange={(e) => updateComponentField(moduleIndex, compIndex, 'description', e.target.value)}
                                      rows={2}
                                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-white text-sm">Hours *</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        value={component.estimatedHours === 0 ? '' : component.estimatedHours}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === '-') {
                                            updateComponentField(moduleIndex, compIndex, 'estimatedHours', 0);
                                          } else {
                                            const parsed = parseFloat(value);
                                            if (!isNaN(parsed)) {
                                              updateComponentField(moduleIndex, compIndex, 'estimatedHours', parsed);
                                            }
                                          }
                                        }}
                                        className={`bg-white/5 border-white/10 text-white ${
                                          moduleErrors[moduleIndex]?.components?.[compIndex]?.estimatedHours ? 'border-red-500' : ''
                                        }`}
                                      />
                                      {moduleErrors[moduleIndex]?.components?.[compIndex]?.estimatedHours && (
                                        <p className="text-red-400 text-xs flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          {moduleErrors[moduleIndex].components![compIndex].estimatedHours}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-white text-sm">Cost ($) *</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="100"
                                        placeholder="0"
                                        value={component.estimatedCost === 0 ? '' : component.estimatedCost}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === '-') {
                                            updateComponentField(moduleIndex, compIndex, 'estimatedCost', 0);
                                          } else {
                                            const parsed = parseFloat(value);
                                            if (!isNaN(parsed)) {
                                              updateComponentField(moduleIndex, compIndex, 'estimatedCost', parsed);
                                            }
                                          }
                                        }}
                                        className={`bg-white/5 border-white/10 text-white ${
                                          moduleErrors[moduleIndex]?.components?.[compIndex]?.budgetExceeded ? 'border-red-500' : ''
                                        }`}
                                      />
                                      {moduleErrors[moduleIndex]?.components?.[compIndex]?.budgetExceeded && (
                                        <p className="text-red-400 text-xs flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          {moduleErrors[moduleIndex].components![compIndex].budgetExceeded}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-white text-sm">Value (1-10) *</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="1"
                                        placeholder="0"
                                        value={component.value === 0 ? '' : component.value}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === '-') {
                                            updateComponentField(moduleIndex, compIndex, 'value', 0);
                                          } else {
                                            const parsed = parseFloat(value);
                                            if (!isNaN(parsed)) {
                                              updateComponentField(moduleIndex, compIndex, 'value', parsed);
                                            }
                                          }
                                        }}
                                        className={`bg-white/5 border-white/10 text-white ${
                                          moduleErrors[moduleIndex]?.components?.[compIndex]?.value ? 'border-red-500' : ''
                                        }`}
                                      />
                                      {moduleErrors[moduleIndex]?.components?.[compIndex]?.value && (
                                        <p className="text-red-400 text-xs flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          {moduleErrors[moduleIndex].components![compIndex].value}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>

                    {/* Module Summary */}
                    {module.components.length > 0 && (
                      <div className={`p-3 rounded-lg border ${
                        validateModuleTotalHours(moduleIndex) || validateModuleTotalCost(moduleIndex)
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-blue-500/10 border-blue-500/20'
                      }`}>
                        <div className="space-y-1">
                          <p className={`text-sm ${validateModuleTotalCost(moduleIndex) ? 'text-red-300' : 'text-blue-300'}`}>
                            Budget: Module ${(module.estimatedCost || 0).toLocaleString()} | Components ${module.components.reduce((sum, c) => sum + (c.estimatedCost || 0), 0).toLocaleString()}
                          </p>
                          <p className={`text-sm ${validateModuleTotalHours(moduleIndex) ? 'text-red-300' : 'text-blue-300'}`}>
                            Hours: Module {module.estimatedHours}h | Components {module.components.reduce((sum, c) => sum + (c.estimatedHours || 0), 0)}h
                          </p>
                          {validateModuleTotalCost(moduleIndex) && (
                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {validateModuleTotalCost(moduleIndex)}
                            </p>
                          )}
                          {validateModuleTotalHours(moduleIndex) && (
                            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {validateModuleTotalHours(moduleIndex)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={saveAllModules} 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={hasModuleErrors || editingModules.length === 0}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {isEditingExistingModules ? 'Update All Modules & Components' : 'Save All Modules & Components'}
                </Button>
                <Button 
                  onClick={clearModuleForm} 
                  variant="outline" 
                  className="border-white/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isEditingExistingModules ? 'Cancel Edit' : 'Clear Form'}
                </Button>
              </div>
            </div>
          )}

          {/* Saved Modules List */}
          {project.modules.length > 0 && (
            <div className="space-y-3 mt-6">
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center">
                <h4 className="text-white">Saved Modules ({project.modules.length})</h4>
                <div className="flex items-center gap-3">
                  <p className="text-slate-400 text-sm">
                    Total Module Budget: ${project.modules.reduce((sum, m) => 
                      sum + m.estimatedCost
                    , 0).toLocaleString()} / ${project.budget.toLocaleString()}
                  </p>
                  <Button
                    onClick={editExistingModules}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600"
                    disabled={editingModules.length > 0}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit All Modules
                  </Button>
                </div>
              </div>
              {project.modules.map((module) => (
                <Card key={module.id} className="bg-white/5 border-white/10">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-white mb-1 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          {module.name}
                        </h5>
                        <p className="text-slate-400 mb-2">{module.description}</p>
                        <div className="flex gap-4 text-slate-300 mb-2">
                          <span>{module.estimatedHours}h</span>
                          <span>${module.estimatedCost.toLocaleString()}</span>
                          <span>Value: {module.value}/10</span>
                        </div>
                        {module.startDate && module.endDate && (
                          <div className="flex gap-2 text-slate-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{module.startDate} → {module.endDate}</span>
                          </div>
                        )}
                        {module.components.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2">
                            <p className="text-slate-500 text-sm">
                              Components ({module.components.length}) - Total: ${module.components.reduce((sum, c) => sum + c.estimatedCost, 0).toLocaleString()} of ${module.estimatedCost.toLocaleString()} module budget
                            </p>
                            {module.components.map((comp) => (
                              <div key={comp.id} className="bg-white/5 p-2 rounded text-sm">
                                <p className="text-slate-300 flex items-center gap-2">
                                  <Package className="w-3 h-3" />
                                  {comp.name}
                                </p>
                                <p className="text-slate-400 text-xs ml-5">
                                  {comp.estimatedHours}h • ${comp.estimatedCost.toLocaleString()} • Value: {comp.value}/10
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(module.id)}
                        className="hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <p><strong className="text-white">Project Overview:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
            <li>Project name must be at least 3 characters</li>
            <li>Deadline must be today or in the future</li>
            <li>Budget must be greater than 0</li>
            <li>Description is optional but recommended (10+ characters)</li>
          </ul>
          <p><strong className="text-white">SMART Goals:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
            <li>Specific and Measurable fields are required (10+ characters)</li>
            <li>Achievable, Relevant, and Time-bound are optional but recommended</li>
            <li>Add multiple goals to define your project objectives</li>
          </ul>
          <p><strong className="text-white">Modules & Components:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
            <li>Set project budget first before adding modules</li>
            <li>Each module represents a larger phase/system (e.g., User Management)</li>
            <li>Each module must contain at least 1 component</li>
            <li>Components are smaller features within modules (e.g., Login Form)</li>
            <li>Specify number of modules (&gt; 0)</li>
            <li>For each module, specify number of components (&gt; 0)</li>
            <li><strong>BUDGET HIERARCHY:</strong></li>
            <li className="ml-4">• Total module budgets ≤ Project budget</li>
            <li className="ml-4">• Total component costs ≤ Module budget</li>
            <li className="ml-4">• Each component cost ≤ Module budget</li>
            <li><strong>HOURS REQUIREMENTS:</strong></li>
            <li className="ml-4">• Each component hours ≤ Module hours</li>
            <li className="ml-4">• Total component hours = Module hours (must match exactly)</li>
            <li>All names must be at least 3 characters</li>
            <li>Estimated hours must be &gt; 0 (max 10,000)</li>
            <li>Value scores must be between 1-10</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
