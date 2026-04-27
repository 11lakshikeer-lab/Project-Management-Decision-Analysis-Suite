import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GitBranch, Plus, Trash2, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface DecisionAlternative {
  id: string;
  name: string;
  bidValue: number;
  lateDays: number;
  penaltyPerDay: number;
  probabilityOnTime: number;
  probabilityLate: number;
  emv: number;
}

interface ValidationErrors {
  [key: number]: {
    name?: string;
    bidValue?: string;
    lateDays?: string;
    penaltyPerDay?: string;
    probabilityOnTime?: string;
    probabilityLate?: string;
    probabilitySum?: string;
  };
}

interface DecisionTreeProps {
  decisionTreeData: any;
  setDecisionTreeData: (data: any) => void;
}

export default function DecisionTree({ decisionTreeData, setDecisionTreeData }: DecisionTreeProps) {
  const [numDecisions, setNumDecisions] = useState<number>(2);
  const [numDecisionsError, setNumDecisionsError] = useState<string>('');
  const [decisions, setDecisions] = useState<DecisionAlternative[]>([]);
  const [editingDecisions, setEditingDecisions] = useState<Partial<DecisionAlternative>[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Load saved decision tree data only on mount
  useEffect(() => {
    if (decisionTreeData && !isInitializedRef.current) {
      isLoadingRef.current = true;
      setNumDecisions(decisionTreeData.numDecisions || 2);
      setDecisions(decisionTreeData.decisions || []);
      setEditingDecisions(decisionTreeData.editingDecisions || []);
      isInitializedRef.current = true;
      // Allow save effect to run after a short delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, []);

  // Save decision tree data whenever it changes (debounced and avoid during loading)
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    const timeoutId = setTimeout(() => {
      const dataToSave = {
        numDecisions,
        decisions,
        editingDecisions,
      };
      setDecisionTreeData(dataToSave);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [numDecisions, decisions, editingDecisions, setDecisionTreeData]);

  // Validate number of decisions
  const validateNumDecisions = (num: number): boolean => {
    if (num < 2) {
      setNumDecisionsError('Minimum 2 decision alternatives required');
      return false;
    }
    if (num > 6) {
      setNumDecisionsError('Maximum 6 decision alternatives allowed');
      return false;
    }
    setNumDecisionsError('');
    return true;
  };

  // Validate individual decision field
  const validateField = (index: number, field: keyof DecisionAlternative, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || value.trim() === '') {
          return 'Decision name is required';
        }
        return '';
      
      case 'bidValue':
        if (value < 0) {
          return 'Bid value must be 0 or greater';
        }
        if (value === 0) {
          return 'Bid value should be greater than 0';
        }
        return '';
      
      case 'lateDays':
        if (value < 0) {
          return 'Late days cannot be negative';
        }
        return '';
      
      case 'penaltyPerDay':
        if (value < 0) {
          return 'Penalty per day cannot be negative';
        }
        return '';
      
      case 'probabilityOnTime':
      case 'probabilityLate':
        if (value < 0) {
          return 'Probability cannot be negative';
        }
        if (value > 1) {
          return 'Probability cannot exceed 1.0';
        }
        return '';
      
      default:
        return '';
    }
  };

  // Validate probability sum
  const validateProbabilitySum = (index: number, probOnTime: number, probLate: number): string => {
    const sum = probOnTime + probLate;
    const tolerance = 0.001; // Allow small floating-point errors
    
    if (Math.abs(sum - 1.0) > tolerance) {
      return `Probabilities must sum to 1.0 (current sum: ${sum.toFixed(3)})`;
    }
    return '';
  };

  // Initialize editing array when numDecisions changes
  const handleNumDecisionsChange = (num: number) => {
    if (!validateNumDecisions(num)) {
      return;
    }
    
    setNumDecisions(num);
    const newEditing: Partial<DecisionAlternative>[] = Array(num).fill(null).map((_, index) => ({
      name: '',
      bidValue: 0,
      lateDays: 0,
      penaltyPerDay: 0,
      probabilityLate: 0,
      probabilityOnTime: 0,
    }));
    setEditingDecisions(newEditing);
    setValidationErrors({});
  };

  const updateDecision = (index: number, field: keyof DecisionAlternative, value: any) => {
    const updated = [...editingDecisions];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate complementary probability
    if (field === 'probabilityLate') {
      updated[index].probabilityOnTime = Math.max(0, Math.min(1, 1 - value));
    } else if (field === 'probabilityOnTime') {
      updated[index].probabilityLate = Math.max(0, Math.min(1, 1 - value));
    }

    setEditingDecisions(updated);

    // Validate the field
    const errors = { ...validationErrors };
    if (!errors[index]) errors[index] = {};
    
    const fieldError = validateField(index, field, value);
    if (fieldError) {
      errors[index][field] = fieldError;
    } else {
      delete errors[index][field];
    }

    // Validate probability sum if updating probabilities
    if (field === 'probabilityOnTime' || field === 'probabilityLate') {
      const probSumError = validateProbabilitySum(
        index,
        updated[index].probabilityOnTime || 0,
        updated[index].probabilityLate || 0
      );
      if (probSumError) {
        errors[index].probabilitySum = probSumError;
      } else {
        delete errors[index].probabilitySum;
      }
    }

    // Clean up empty error objects
    if (Object.keys(errors[index]).length === 0) {
      delete errors[index];
    }

    setValidationErrors(errors);
  };

  const calculateEMV = (decision: Partial<DecisionAlternative>): number => {
    const bidValue = decision.bidValue || 0;
    const penalty = (decision.lateDays || 0) * (decision.penaltyPerDay || 0);
    const probOnTime = decision.probabilityOnTime || 0;
    const probLate = decision.probabilityLate || 0;

    // EMV = (Probability of on-time × Bid Value) + (Probability of late × (Bid Value + Penalty))
    const emv = (probOnTime * bidValue) + (probLate * (bidValue + penalty));
    return emv;
  };

  // Validate all decisions before generating tree
  const validateAllDecisions = (): boolean => {
    const errors: ValidationErrors = {};
    let hasErrors = false;

    editingDecisions.forEach((decision, index) => {
      const decisionErrors: any = {};

      // Validate each field
      const nameError = validateField(index, 'name', decision.name);
      if (nameError) {
        decisionErrors.name = nameError;
        hasErrors = true;
      }

      const bidValueError = validateField(index, 'bidValue', decision.bidValue);
      if (bidValueError) {
        decisionErrors.bidValue = bidValueError;
        hasErrors = true;
      }

      const lateDaysError = validateField(index, 'lateDays', decision.lateDays);
      if (lateDaysError) {
        decisionErrors.lateDays = lateDaysError;
        hasErrors = true;
      }

      const penaltyError = validateField(index, 'penaltyPerDay', decision.penaltyPerDay);
      if (penaltyError) {
        decisionErrors.penaltyPerDay = penaltyError;
        hasErrors = true;
      }

      const probOnTimeError = validateField(index, 'probabilityOnTime', decision.probabilityOnTime);
      if (probOnTimeError) {
        decisionErrors.probabilityOnTime = probOnTimeError;
        hasErrors = true;
      }

      const probLateError = validateField(index, 'probabilityLate', decision.probabilityLate);
      if (probLateError) {
        decisionErrors.probabilityLate = probLateError;
        hasErrors = true;
      }

      const probSumError = validateProbabilitySum(
        index,
        decision.probabilityOnTime || 0,
        decision.probabilityLate || 0
      );
      if (probSumError) {
        decisionErrors.probabilitySum = probSumError;
        hasErrors = true;
      }

      if (Object.keys(decisionErrors).length > 0) {
        errors[index] = decisionErrors;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const generateDecisionTree = () => {
    if (!validateAllDecisions()) {
      return;
    }

    const newDecisions: DecisionAlternative[] = editingDecisions.map((d, index) => ({
      id: Date.now().toString() + index,
      name: d.name || `Decision ${index + 1}`,
      bidValue: d.bidValue || 0,
      lateDays: d.lateDays || 0,
      penaltyPerDay: d.penaltyPerDay || 0,
      probabilityOnTime: d.probabilityOnTime || 0,
      probabilityLate: d.probabilityLate || 0,
      emv: calculateEMV(d)
    }));

    setDecisions(newDecisions);
  };

  const bestDecision = decisions.length > 0
    ? decisions.reduce((best, current) => current.emv < best.emv ? current : best)
    : null;

  const clearAll = () => {
    setDecisions([]);
    setEditingDecisions([]);
    setNumDecisions(2);
    setValidationErrors({});
    setNumDecisionsError('');
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <GitBranch className="w-5 h-5" />
            Decision Tree & EMV Analysis
          </CardTitle>
          <CardDescription className="text-slate-300">
            Analyze multiple decision alternatives with probabilistic outcomes. Each decision has two paths: on-time completion and late completion with penalty.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Setup */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Configure Decision Alternatives</CardTitle>
          <CardDescription className="text-slate-300">
            Example: Compare sub-contractors with different bid values and risk of delays
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Number of Decision Alternatives (2-6)</Label>
            <div className="flex gap-3">
              <div className="flex-1 max-w-xs space-y-2">
                <Input
                  type="number"
                  min="2"
                  max="6"
                  value={numDecisions}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2;
                    setNumDecisions(val);
                    validateNumDecisions(val);
                  }}
                  className={`bg-white/5 border-white/10 text-white ${numDecisionsError ? 'border-red-500' : ''}`}
                />
                {numDecisionsError && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {numDecisionsError}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handleNumDecisionsChange(numDecisions)} 
                variant="outline" 
                className="border-white/20"
                disabled={!!numDecisionsError}
              >
                <Plus className="w-4 h-4 mr-2" />
                Initialize
              </Button>
            </div>
          </div>

          {/* Decision Input Forms */}
          {editingDecisions.length > 0 && (
            <div className="space-y-4">
              {hasValidationErrors && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    Please fix all validation errors before generating the decision tree.
                  </AlertDescription>
                </Alert>
              )}

              {editingDecisions.map((decision, index) => (
                <Card key={index} className="bg-white/5 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Alternative {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Decision Name *</Label>
                      <Input
                        placeholder={`e.g., Sub-contractor ${index + 1}`}
                        value={decision.name || ''}
                        onChange={(e) => updateDecision(index, 'name', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                          validationErrors[index]?.name ? 'border-red-500' : ''
                        }`}
                      />
                      {validationErrors[index]?.name && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors[index].name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Bid Value ($) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="0"
                          value={decision.bidValue === 0 ? '' : decision.bidValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateDecision(index, 'bidValue', 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                updateDecision(index, 'bidValue', parsed);
                              }
                            }
                          }}
                          className={`bg-white/5 border-white/10 text-white ${
                            validationErrors[index]?.bidValue ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[index]?.bidValue && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[index].bidValue}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Late Days (≥0)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={decision.lateDays === 0 ? '' : decision.lateDays}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateDecision(index, 'lateDays', 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                updateDecision(index, 'lateDays', parsed);
                              }
                            }
                          }}
                          className={`bg-white/5 border-white/10 text-white ${
                            validationErrors[index]?.lateDays ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[index]?.lateDays && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[index].lateDays}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Penalty Per Day ($) (≥0)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="0"
                          value={decision.penaltyPerDay === 0 ? '' : decision.penaltyPerDay}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateDecision(index, 'penaltyPerDay', 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                updateDecision(index, 'penaltyPerDay', parsed);
                              }
                            }
                          }}
                          className={`bg-white/5 border-white/10 text-white ${
                            validationErrors[index]?.penaltyPerDay ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[index]?.penaltyPerDay && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[index].penaltyPerDay}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Probability of On-Time (0-1) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          placeholder="0"
                          value={decision.probabilityOnTime === 0 ? '' : decision.probabilityOnTime}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateDecision(index, 'probabilityOnTime', 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                updateDecision(index, 'probabilityOnTime', parsed);
                              }
                            }
                          }}
                          className={`bg-white/5 border-white/10 text-white ${
                            validationErrors[index]?.probabilityOnTime ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[index]?.probabilityOnTime && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[index].probabilityOnTime}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Probability of Late (0-1) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          placeholder="0"
                          value={decision.probabilityLate === 0 ? '' : decision.probabilityLate}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateDecision(index, 'probabilityLate', 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                updateDecision(index, 'probabilityLate', parsed);
                              }
                            }
                          }}
                          className={`bg-white/5 border-white/10 text-white ${
                            validationErrors[index]?.probabilityLate ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[index]?.probabilityLate && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[index].probabilityLate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Probability Sum Error */}
                    {validationErrors[index]?.probabilitySum && (
                      <Alert className="bg-yellow-500/10 border-yellow-500/30">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-300">
                          {validationErrors[index].probabilitySum}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Preview Calculation */}
                    {!validationErrors[index] && (
                      <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                        <p className="text-purple-300">
                          Preview EMV: ${calculateEMV(decision).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          ({decision.probabilityOnTime || 0} × ${decision.bidValue || 0}) + ({decision.probabilityLate || 0} × ${(decision.bidValue || 0) + ((decision.lateDays || 0) * (decision.penaltyPerDay || 0))})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-3">
                <Button 
                  onClick={generateDecisionTree} 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={hasValidationErrors || editingDecisions.length === 0}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Generate Decision Tree
                </Button>
                <Button onClick={clearAll} variant="outline" className="border-white/20">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Tree Visualization */}
      {decisions.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Decision Tree Analysis</CardTitle>
            <CardDescription className="text-slate-300">
              Folded-back EMV values for each decision path (lower EMV = better for costs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Tree */}
            <div className="space-y-6">
              {decisions.map((decision, index) => (
                <div key={decision.id} className="relative">
                  {/* Decision Node */}
                  <div className="flex items-start gap-4">
                    {/* Square Decision Node */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-blue-400">
                        <span className="text-white">D{index + 1}</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-slate-400">Decision</p>
                      </div>
                    </div>

                    {/* Decision Info */}
                    <div className="flex-1">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-white">{decision.name}</h4>
                            <p className="text-slate-400">Bid Value: ${decision.bidValue.toLocaleString()}</p>
                          </div>
                          {bestDecision && bestDecision.id === decision.id && (
                            <Badge className="bg-green-500">Recommended</Badge>
                          )}
                        </div>

                        {/* Two Branches */}
                        <div className="space-y-3">
                          {/* Branch 1: On-Time */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-slate-600"></div>
                            <div className="flex items-center gap-3 flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                                C
                              </div>
                              <div className="flex-1">
                                <p className="text-green-300">On-Time Completion</p>
                                <p className="text-xs text-slate-400">
                                  Probability: {(decision.probabilityOnTime * 100).toFixed(0)}% | Value: ${decision.bidValue.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white">${(decision.probabilityOnTime * decision.bidValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </div>

                          {/* Branch 2: Late */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-slate-600"></div>
                            <div className="flex items-center gap-3 flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                                C
                              </div>
                              <div className="flex-1">
                                <p className="text-red-300">Late ({decision.lateDays} days)</p>
                                <p className="text-xs text-slate-400">
                                  Probability: {(decision.probabilityLate * 100).toFixed(0)}% | Value: ${decision.bidValue.toLocaleString()} + ${(decision.lateDays * decision.penaltyPerDay).toLocaleString()} penalty
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white">${(decision.probabilityLate * (decision.bidValue + decision.lateDays * decision.penaltyPerDay)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Folded-back EMV */}
                        <div className="mt-4 bg-blue-500/20 border-2 border-blue-500/40 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-300">Folded-Back EMV (Expected Cost)</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {(decision.probabilityOnTime * 100).toFixed(0)}% × ${decision.bidValue.toLocaleString()} + {(decision.probabilityLate * 100).toFixed(0)}% × ${(decision.bidValue + decision.lateDays * decision.penaltyPerDay).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-2xl text-white">
                              ${decision.emv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Best Decision Card */}
            {bestDecision && (
              <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Recommended Decision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white mb-2">
                    Based on EMV analysis, select: <strong className="text-green-300">{bestDecision.name}</strong>
                  </p>
                  <p className="text-slate-300 mb-3">
                    Expected Monetary Value: ${bestDecision.emv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    This decision has the lowest expected cost considering both on-time and late scenarios.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comparison Table */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">EMV Comparison Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-slate-300">Alternative</th>
                        <th className="text-right p-3 text-slate-300">Bid Value</th>
                        <th className="text-right p-3 text-slate-300">Max Penalty</th>
                        <th className="text-right p-3 text-slate-300">P(On-Time)</th>
                        <th className="text-right p-3 text-slate-300">P(Late)</th>
                        <th className="text-right p-3 text-slate-300">EMV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decisions.map((decision) => (
                        <tr 
                          key={decision.id} 
                          className={`border-b border-white/5 ${bestDecision && bestDecision.id === decision.id ? 'bg-green-500/10' : ''}`}
                        >
                          <td className="p-3 text-white">{decision.name}</td>
                          <td className="text-right p-3 text-slate-300">${decision.bidValue.toLocaleString()}</td>
                          <td className="text-right p-3 text-slate-300">${(decision.lateDays * decision.penaltyPerDay).toLocaleString()}</td>
                          <td className="text-right p-3 text-slate-300">{(decision.probabilityOnTime * 100).toFixed(0)}%</td>
                          <td className="text-right p-3 text-slate-300">{(decision.probabilityLate * 100).toFixed(0)}%</td>
                          <td className="text-right p-3 text-white">
                            ${decision.emv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">How to Use Decision Tree Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-300">
          <p><strong className="text-white">Step 1:</strong> Set the number of decision alternatives (2-6)</p>
          <p><strong className="text-white">Step 2:</strong> For each alternative, enter:</p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
            <li>Decision name (required)</li>
            <li>Bid value (must be &gt; 0)</li>
            <li>Potential late days (&ge; 0)</li>
            <li>Penalty per day (&ge; 0)</li>
            <li>Probabilities (must be between 0-1 and sum to 1.0)</li>
          </ul>
          <p><strong className="text-white">Step 3:</strong> Fix any validation errors shown in red</p>
          <p><strong className="text-white">Step 4:</strong> Click "Generate Decision Tree" to calculate EMV for each path</p>
          <p><strong className="text-white">Step 5:</strong> Review the visualization showing the recommended decision (lowest expected cost)</p>
          <p className="text-xs text-slate-500 mt-4">
            <strong>Example:</strong> Sub-contractor 1 bids $250,000 with 30% chance of 60 days late @ $5,000/day penalty vs. Sub-contractor 2 bids $320,000 with 10% chance of 20 days late @ $5,000/day penalty
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
