import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calculator, Info, Save, Upload, Trash2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

type CriterionType = 'maximin' | 'maximax' | 'hurwicz' | 'laplace' | 'minimax-regret';

interface PayoffMatrix {
  numActions: number;
  numStates: number;
  actionNames: string[];
  stateNames: string[];
  payoffs: number[][];
  savedAt: string;
}

interface SavedMatrices {
  [criterion: string]: PayoffMatrix;
}

interface DecisionUnderUncertaintyProps {
  uncertaintyData: any;
  setUncertaintyData: (data: any) => void;
}

export default function DecisionUnderUncertainty({ uncertaintyData, setUncertaintyData }: DecisionUnderUncertaintyProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionType>('maximin');
  const [numActions, setNumActions] = useState<number>(0);
  const [numStates, setNumStates] = useState<number>(0);
  const [actionNames, setActionNames] = useState<string[]>([]);
  const [stateNames, setStateNames] = useState<string[]>([]);
  const [payoffs, setPayoffs] = useState<number[][]>([]);
  const [hurwiczAlpha, setHurwiczAlpha] = useState<number>(0.5);
  const [calculated, setCalculated] = useState<boolean>(false);
  const [savedMatrices, setSavedMatrices] = useState<SavedMatrices>({});
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Load saved uncertainty data only on mount
  useEffect(() => {
    if (uncertaintyData && !isInitializedRef.current) {
      isLoadingRef.current = true;
      setSelectedCriterion(uncertaintyData.selectedCriterion || 'maximin');
      setNumActions(uncertaintyData.numActions || 0);
      setNumStates(uncertaintyData.numStates || 0);
      setActionNames(uncertaintyData.actionNames || []);
      setStateNames(uncertaintyData.stateNames || []);
      setPayoffs(uncertaintyData.payoffs || []);
      setHurwiczAlpha(uncertaintyData.hurwiczAlpha || 0.5);
      setCalculated(uncertaintyData.calculated || false);
      setSavedMatrices(uncertaintyData.savedMatrices || {});
      isInitializedRef.current = true;
      // Allow save effect to run after a short delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, []);

  // Save uncertainty data whenever it changes (debounced and avoid during loading)
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    const timeoutId = setTimeout(() => {
      const dataToSave = {
        selectedCriterion,
        numActions,
        numStates,
        actionNames,
        stateNames,
        payoffs,
        hurwiczAlpha,
        calculated,
        savedMatrices,
      };
      setUncertaintyData(dataToSave);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedCriterion, numActions, numStates, actionNames, stateNames, payoffs, hurwiczAlpha, calculated, savedMatrices, setUncertaintyData]);

  const handleNumActionsChange = (value: number) => {
    if (value < 1 || value > 10) return;
    
    const newActionNames = Array.from({ length: value }, (_, i) => 
      actionNames[i] || `Action ${i + 1}`
    );
    const newPayoffs = Array.from({ length: value }, (_, i) => 
      payoffs[i] || Array(numStates).fill(0)
    );
    
    setNumActions(value);
    setActionNames(newActionNames);
    setPayoffs(newPayoffs);
    setCalculated(false);
  };

  const handleNumStatesChange = (value: number) => {
    if (value < 1 || value > 10) return;
    
    const newStateNames = Array.from({ length: value }, (_, i) => 
      stateNames[i] || `State ${i + 1}`
    );
    const newPayoffs = payoffs.map(row => 
      Array.from({ length: value }, (_, i) => row[i] || 0)
    );
    
    setNumStates(value);
    setStateNames(newStateNames);
    setPayoffs(newPayoffs);
    setCalculated(false);
  };

  const updateActionName = (index: number, value: string) => {
    const newNames = [...actionNames];
    newNames[index] = value;
    setActionNames(newNames);
  };

  const updateStateName = (index: number, value: string) => {
    const newNames = [...stateNames];
    newNames[index] = value;
    setStateNames(newNames);
  };

  const updatePayoff = (actionIdx: number, stateIdx: number, value: number) => {
    const newPayoffs = [...payoffs];
    newPayoffs[actionIdx] = [...newPayoffs[actionIdx]];
    newPayoffs[actionIdx][stateIdx] = value;
    setPayoffs(newPayoffs);
    setCalculated(false);
  };

  const saveCurrentMatrix = () => {
    if (numActions === 0 || numStates === 0) {
      toast.error('Please configure the decision matrix first');
      return;
    }

    const matrix: PayoffMatrix = {
      numActions,
      numStates,
      actionNames,
      stateNames,
      payoffs,
      savedAt: new Date().toISOString()
    };

    const updated = {
      ...savedMatrices,
      [selectedCriterion]: matrix
    };

    setSavedMatrices(updated);
    localStorage.setItem('decision-uncertainty-matrices', JSON.stringify(updated));
    toast.success(`Matrix saved for ${getCriterionLabel(selectedCriterion)}`);
  };

  const loadSavedMatrix = (criterion: CriterionType) => {
    const saved = savedMatrices[criterion];
    if (saved) {
      setNumActions(saved.numActions);
      setNumStates(saved.numStates);
      setActionNames(saved.actionNames);
      setStateNames(saved.stateNames);
      setPayoffs(saved.payoffs);
      setCalculated(false);
      toast.success(`Loaded saved matrix for ${getCriterionLabel(criterion)}`);
    }
  };

  const deleteSavedMatrix = (criterion: CriterionType) => {
    const updated = { ...savedMatrices };
    delete updated[criterion];
    setSavedMatrices(updated);
    localStorage.setItem('decision-uncertainty-matrices', JSON.stringify(updated));
    toast.success(`Deleted saved matrix for ${getCriterionLabel(criterion)}`);
  };

  const getCriterionLabel = (criterion: CriterionType) => {
    const labels: Record<CriterionType, string> = {
      'maximin': 'Maximin',
      'maximax': 'Maximax',
      'hurwicz': 'Hurwicz',
      'laplace': 'Laplace',
      'minimax-regret': 'Minimax Regret'
    };
    return labels[criterion];
  };

  // Calculation functions
  const calculateMaximin = () => {
    const minPayoffs = payoffs.map(row => Math.min(...row));
    const optimalValue = Math.max(...minPayoffs);
    const optimalIndex = minPayoffs.indexOf(optimalValue);
    const optimalAction = actionNames[optimalIndex];

    return { minPayoffs, optimalValue, optimalIndex, optimalAction };
  };

  const calculateMaximax = () => {
    const maxPayoffs = payoffs.map(row => Math.max(...row));
    const optimalValue = Math.max(...maxPayoffs);
    const optimalIndex = maxPayoffs.indexOf(optimalValue);
    const optimalAction = actionNames[optimalIndex];

    return { maxPayoffs, optimalValue, optimalIndex, optimalAction };
  };

  const calculateHurwicz = () => {
    const minPayoffs = payoffs.map(row => Math.min(...row));
    const maxPayoffs = payoffs.map(row => Math.max(...row));
    const hurwiczValues = minPayoffs.map((min, i) => 
      hurwiczAlpha * maxPayoffs[i] + (1 - hurwiczAlpha) * min
    );
    const optimalValue = Math.max(...hurwiczValues);
    const optimalIndex = hurwiczValues.indexOf(optimalValue);
    const optimalAction = actionNames[optimalIndex];

    return { minPayoffs, maxPayoffs, hurwiczValues, optimalValue, optimalIndex, optimalAction };
  };

  const calculateLaplace = () => {
    const averagePayoffs = payoffs.map(row => 
      row.reduce((sum, val) => sum + val, 0) / row.length
    );
    const optimalValue = Math.max(...averagePayoffs);
    const optimalIndex = averagePayoffs.indexOf(optimalValue);
    const optimalAction = actionNames[optimalIndex];

    return { averagePayoffs, optimalValue, optimalIndex, optimalAction };
  };

  const calculateMinimaxRegret = () => {
    // Calculate opportunity loss (regret) matrix
    const regretMatrix: number[][] = [];
    
    for (let stateIdx = 0; stateIdx < numStates; stateIdx++) {
      const statePayoffs = payoffs.map(row => row[stateIdx]);
      const maxPayoff = Math.max(...statePayoffs);
      
      for (let actionIdx = 0; actionIdx < numActions; actionIdx++) {
        if (!regretMatrix[actionIdx]) regretMatrix[actionIdx] = [];
        regretMatrix[actionIdx][stateIdx] = maxPayoff - payoffs[actionIdx][stateIdx];
      }
    }

    // Find maximum regret for each action
    const maxRegrets = regretMatrix.map(row => Math.max(...row));
    
    // Find action with minimum of maximum regrets
    const optimalValue = Math.min(...maxRegrets);
    const optimalIndex = maxRegrets.indexOf(optimalValue);
    const optimalAction = actionNames[optimalIndex];

    return { regretMatrix, maxRegrets, optimalValue, optimalIndex, optimalAction };
  };

  const renderMaximinResults = () => {
    const result = calculateMaximin();
    
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Payoff Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Action</TableHead>
                    {stateNames.map((state, idx) => (
                      <TableHead key={idx} className="text-white">{state}</TableHead>
                    ))}
                    <TableHead className="text-purple-400">Minimum Payoff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionNames.map((action, actionIdx) => (
                    <TableRow key={actionIdx} className={actionIdx === result.optimalIndex ? 'bg-green-500/10' : ''}>
                      <TableCell className="text-white">{action}</TableCell>
                      {payoffs[actionIdx].map((payoff, stateIdx) => (
                        <TableCell key={stateIdx} className="text-slate-300">{payoff}</TableCell>
                      ))}
                      <TableCell className="text-purple-400">
                        {result.minPayoffs[actionIdx]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400">Optimal Action (Maximin Criterion)</CardTitle>
            <CardDescription className="text-slate-300">
              Conservative approach: Maximize the minimum payoff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Recommended Action:</span>
                <Badge className="bg-green-600 text-white">{result.optimalAction}</Badge>
              </div>
              <div className="text-slate-300">
                Expected Value: <span className="text-green-400">{result.optimalValue}</span>
              </div>
              <div className="text-sm text-slate-400 mt-3 p-3 bg-white/5 rounded-lg">
                <Info className="w-4 h-4 inline mr-2" />
                This action provides the best worst-case scenario outcome.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMaximaxResults = () => {
    const result = calculateMaximax();
    
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Payoff Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Action</TableHead>
                    {stateNames.map((state, idx) => (
                      <TableHead key={idx} className="text-white">{state}</TableHead>
                    ))}
                    <TableHead className="text-blue-400">Maximum Payoff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionNames.map((action, actionIdx) => (
                    <TableRow key={actionIdx} className={actionIdx === result.optimalIndex ? 'bg-blue-500/10' : ''}>
                      <TableCell className="text-white">{action}</TableCell>
                      {payoffs[actionIdx].map((payoff, stateIdx) => (
                        <TableCell key={stateIdx} className="text-slate-300">{payoff}</TableCell>
                      ))}
                      <TableCell className="text-blue-400">
                        {result.maxPayoffs[actionIdx]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400">Optimal Action (Maximax Criterion)</CardTitle>
            <CardDescription className="text-slate-300">
              Optimistic approach: Maximize the maximum payoff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Recommended Action:</span>
                <Badge className="bg-blue-600 text-white">{result.optimalAction}</Badge>
              </div>
              <div className="text-slate-300">
                Expected Value: <span className="text-blue-400">{result.optimalValue}</span>
              </div>
              <div className="text-sm text-slate-400 mt-3 p-3 bg-white/5 rounded-lg">
                <Info className="w-4 h-4 inline mr-2" />
                This action provides the best possible outcome in the best-case scenario.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHurwiczResults = () => {
    const result = calculateHurwicz();
    
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Payoff Table with Hurwicz Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Action</TableHead>
                    {stateNames.map((state, idx) => (
                      <TableHead key={idx} className="text-white">{state}</TableHead>
                    ))}
                    <TableHead className="text-purple-400">Min</TableHead>
                    <TableHead className="text-blue-400">Max</TableHead>
                    <TableHead className="text-pink-400">Hurwicz Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionNames.map((action, actionIdx) => (
                    <TableRow key={actionIdx} className={actionIdx === result.optimalIndex ? 'bg-pink-500/10' : ''}>
                      <TableCell className="text-white">{action}</TableCell>
                      {payoffs[actionIdx].map((payoff, stateIdx) => (
                        <TableCell key={stateIdx} className="text-slate-300">{payoff}</TableCell>
                      ))}
                      <TableCell className="text-purple-400">{result.minPayoffs[actionIdx]}</TableCell>
                      <TableCell className="text-blue-400">{result.maxPayoffs[actionIdx]}</TableCell>
                      <TableCell className="text-pink-400">{result.hurwiczValues[actionIdx].toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-400">Optimal Action (Hurwicz Criterion)</CardTitle>
            <CardDescription className="text-slate-300">
              Balanced approach with α = {hurwiczAlpha.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Recommended Action:</span>
                <Badge className="bg-pink-600 text-white">{result.optimalAction}</Badge>
              </div>
              <div className="text-slate-300">
                Hurwicz Value: <span className="text-pink-400">{result.optimalValue.toFixed(2)}</span>
              </div>
              <div className="text-sm text-slate-400 mt-3 p-3 bg-white/5 rounded-lg">
                <Info className="w-4 h-4 inline mr-2" />
                Weighted average: α × (max) + (1-α) × (min). Higher α = more optimistic.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLaplaceResults = () => {
    const result = calculateLaplace();
    
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Payoff Table with Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Action</TableHead>
                    {stateNames.map((state, idx) => (
                      <TableHead key={idx} className="text-white">{state}</TableHead>
                    ))}
                    <TableHead className="text-cyan-400">Average Payoff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionNames.map((action, actionIdx) => (
                    <TableRow key={actionIdx} className={actionIdx === result.optimalIndex ? 'bg-cyan-500/10' : ''}>
                      <TableCell className="text-white">{action}</TableCell>
                      {payoffs[actionIdx].map((payoff, stateIdx) => (
                        <TableCell key={stateIdx} className="text-slate-300">{payoff}</TableCell>
                      ))}
                      <TableCell className="text-cyan-400">
                        {result.averagePayoffs[actionIdx].toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Optimal Action (Laplace Criterion)</CardTitle>
            <CardDescription className="text-slate-300">
              Assumes all states are equally likely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Recommended Action:</span>
                <Badge className="bg-cyan-600 text-white">{result.optimalAction}</Badge>
              </div>
              <div className="text-slate-300">
                Expected Value: <span className="text-cyan-400">{result.optimalValue.toFixed(2)}</span>
              </div>
              <div className="text-sm text-slate-400 mt-3 p-3 bg-white/5 rounded-lg">
                <Info className="w-4 h-4 inline mr-2" />
                Uses average payoff across all states (equal probability assumption).
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMinimaxRegretResults = () => {
    const result = calculateMinimaxRegret();
    
    return (
      <div className="space-y-4">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Regret (Opportunity Loss) Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Action</TableHead>
                    {stateNames.map((state, idx) => (
                      <TableHead key={idx} className="text-white">{state}</TableHead>
                    ))}
                    <TableHead className="text-amber-400">Max Regret</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionNames.map((action, actionIdx) => (
                    <TableRow key={actionIdx} className={actionIdx === result.optimalIndex ? 'bg-amber-500/10' : ''}>
                      <TableCell className="text-white">{action}</TableCell>
                      {result.regretMatrix[actionIdx].map((regret, stateIdx) => (
                        <TableCell key={stateIdx} className="text-slate-300">{regret}</TableCell>
                      ))}
                      <TableCell className="text-amber-400">
                        {result.maxRegrets[actionIdx]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400">Optimal Action (Minimax Regret)</CardTitle>
            <CardDescription className="text-slate-300">
              Minimizes the maximum opportunity loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Recommended Action:</span>
                <Badge className="bg-amber-600 text-white">{result.optimalAction}</Badge>
              </div>
              <div className="text-slate-300">
                Maximum Regret: <span className="text-amber-400">{result.optimalValue}</span>
              </div>
              <div className="text-sm text-slate-400 mt-3 p-3 bg-white/5 rounded-lg">
                <Info className="w-4 h-4 inline mr-2" />
                Minimizes the worst possible regret (opportunity loss).
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Criterion Selection */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Select Decision Criterion</CardTitle>
          <CardDescription className="text-slate-300">
            Choose the criterion you want to use for decision analysis under uncertainty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCriterion} onValueChange={(value) => {
            setSelectedCriterion(value as CriterionType);
            setCalculated(false);
          }}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              <SelectItem value="maximin" className="text-white focus:bg-white/10 focus:text-white">Maximin (Pessimistic)</SelectItem>
              <SelectItem value="maximax" className="text-white focus:bg-white/10 focus:text-white">Maximax (Optimistic)</SelectItem>
              <SelectItem value="hurwicz" className="text-white focus:bg-white/10 focus:text-white">Hurwicz (Realism)</SelectItem>
              <SelectItem value="laplace" className="text-white focus:bg-white/10 focus:text-white">Laplace (Equal Probability)</SelectItem>
              <SelectItem value="minimax-regret" className="text-white focus:bg-white/10 focus:text-white">Minimax Regret</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Matrix Configuration */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Configure Decision Matrix</CardTitle>
          <CardDescription className="text-slate-300">
            Define the number of actions and states of nature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Number of Actions</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="Enter number"
                value={numActions === 0 ? '' : numActions}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  if (val >= 0 && val <= 10) handleNumActionsChange(val);
                }}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Number of States</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="Enter number"
                value={numStates === 0 ? '' : numStates}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  if (val >= 0 && val <= 10) handleNumStatesChange(val);
                }}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          
          {/* Save/Load Matrix Buttons */}
          {numActions > 0 && numStates > 0 && (
            <div className="flex gap-3 justify-end">
              {savedMatrices[selectedCriterion] && (
                <Button
                  onClick={() => loadSavedMatrix(selectedCriterion)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Load Saved Matrix
                </Button>
              )}
              <Button
                onClick={saveCurrentMatrix}
                variant="outline"
                size="sm"
                className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Matrix
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {numActions > 0 && numStates > 0 && (
        <>
          {/* Action Names */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Action Names</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {actionNames.map((name, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-slate-400 text-xs">Action {idx + 1}</Label>
                    <Input
                      value={name}
                      onChange={(e) => updateActionName(idx, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* State Names */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">State Names</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stateNames.map((name, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-slate-400 text-xs">State {idx + 1}</Label>
                    <Input
                      value={name}
                      onChange={(e) => updateStateName(idx, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payoff Matrix Input */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Payoff Values</CardTitle>
              <CardDescription className="text-slate-300">
                Enter the payoff value for each (action, state) combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Action / State</TableHead>
                      {stateNames.map((state, idx) => (
                        <TableHead key={idx} className="text-white">{state}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionNames.map((action, actionIdx) => (
                      <TableRow key={actionIdx}>
                        <TableCell className="text-white">{action}</TableCell>
                        {stateNames.map((_, stateIdx) => (
                          <TableCell key={stateIdx}>
                            <Input
                              type="number"
                              value={payoffs[actionIdx][stateIdx]}
                              onChange={(e) => updatePayoff(actionIdx, stateIdx, parseFloat(e.target.value) || 0)}
                              className="w-24 bg-white/5 border-white/10 text-white"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Hurwicz Parameter (shown before calculate button when Hurwicz is selected) */}
          {selectedCriterion === 'hurwicz' && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Hurwicz Criterion Parameter</CardTitle>
                <CardDescription className="text-slate-300">
                  Set the optimism coefficient (α): 0 = complete pessimism, 1 = complete optimism
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-white">Optimism Coefficient (α)</Label>
                    <span className="text-purple-400">{hurwiczAlpha.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[hurwiczAlpha]}
                    onValueChange={(value) => {
                      setHurwiczAlpha(value[0]);
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-slate-500 text-sm">
                    <span>Pessimistic (0)</span>
                    <span>Neutral (0.5)</span>
                    <span>Optimistic (1)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculate Button */}
          <Button 
            onClick={() => setCalculated(true)} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            size="lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate {selectedCriterion.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Button>

          {/* Results */}
          {calculated && (
            <>
              {selectedCriterion === 'maximin' && renderMaximinResults()}
              {selectedCriterion === 'maximax' && renderMaximaxResults()}
              {selectedCriterion === 'hurwicz' && renderHurwiczResults()}
              {selectedCriterion === 'laplace' && renderLaplaceResults()}
              {selectedCriterion === 'minimax-regret' && renderMinimaxRegretResults()}
            </>
          )}
        </>
      )}

      {/* Saved Matrices Display */}
      {Object.keys(savedMatrices).length > 0 && (
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Saved Decision Matrices</CardTitle>
            <CardDescription className="text-slate-300">
              Your saved decision matrices for each criterion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(savedMatrices).map(([criterion, matrix]) => (
              <Card key={criterion} className="glass-card border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{getCriterionLabel(criterion as CriterionType)}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm">
                        Saved on {formatDate(matrix.savedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => loadSavedMatrix(criterion as CriterionType)}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Load
                      </Button>
                      <Button
                        onClick={() => deleteSavedMatrix(criterion as CriterionType)}
                        variant="outline"
                        size="sm"
                        className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white text-xs">Action / State</TableHead>
                          {matrix.stateNames.map((state, idx) => (
                            <TableHead key={idx} className="text-white text-xs">{state}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrix.actionNames.map((action, actionIdx) => (
                          <TableRow key={actionIdx}>
                            <TableCell className="text-white text-xs">{action}</TableCell>
                            {matrix.payoffs[actionIdx].map((payoff, stateIdx) => (
                              <TableCell key={stateIdx} className="text-slate-300 text-xs">{payoff}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Decision Criteria Explained</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <div>
            <strong className="text-white">Maximin (Pessimistic):</strong> Conservative approach - maximizes the minimum payoff. Choose the action with the best worst-case outcome.
          </div>
          <div>
            <strong className="text-white">Maximax (Optimistic):</strong> Optimistic approach - maximizes the maximum payoff. Choose the action with the best best-case outcome.
          </div>
          <div>
            <strong className="text-white">Hurwicz (Realism):</strong> Balanced approach using coefficient of optimism (α). Weighted average: α × (max) + (1-α) × (min).
          </div>
          <div>
            <strong className="text-white">Laplace (Equal Probability):</strong> Assumes all states are equally likely. Uses average payoff across all states.
          </div>
          <div>
            <strong className="text-white">Minimax Regret:</strong> Minimizes the maximum opportunity loss (regret). Regret = best possible payoff - actual payoff for each state.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
