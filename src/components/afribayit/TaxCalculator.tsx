'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, BarChart3, Building2, Calculator, Check, ChevronDown, ChevronRight, DollarSign, Download, FileText, Globe2, Home, MapPin, PieChart as PieChartIcon, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TaxCalculation, TaxLineItem } from '@/lib/tax/types';

const COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

const PROPERTY_TYPES = [
  { value: 'terrain', label: 'Terrain' },
  { value: 'villa', label: 'Villa' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
];

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

// Simple pie chart using CSS conic-gradient
function PieChart({ items }: { items: { name: string; amount: number; color: string }[] }) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return null;

  // Compute accumulated values without mutation
  const cumAmounts = items.reduce<number[]>((acc, item, i) => {
    acc.push((acc[i - 1] ?? 0) + item.amount);
    return acc;
  }, []);

  const gradientParts = items.map((item, i) => {
    const startDeg = ((cumAmounts[i] - item.amount) / total) * 360;
    const endDeg = (cumAmounts[i] / total) * 360;
    return `${item.color} ${startDeg}deg ${endDeg}deg`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-40 h-40 rounded-full shrink-0"
        style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
      />
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.name}</span>
            <span className="font-medium text-gray-900 ml-auto">
              {total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TaxCalculatorProps {
  onClose?: () => void;
}

export default function TaxCalculator({ onClose }: TaxCalculatorProps) {
  const [country, setCountry] = useState('BJ');
  const [propertyType, setPropertyType] = useState('villa');
  const [transactionType, setTransactionType] = useState<'achat' | 'location'>('achat');
  const [propertyValue, setPropertyValue] = useState('25000000');
  const [hasMortgage, setHasMortgage] = useState(false);
  const [isPrimaryResidence, setIsPrimaryResidence] = useState(true);
  const [result, setResult] = useState<TaxCalculation | null>(null);
  const [comparisons, setComparisons] = useState<TaxCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          propertyType,
          transactionType,
          propertyValue: Number(propertyValue),
          hasMortgage,
          isPrimaryResidence,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch {
      // Silently handle error
    } finally {
      setIsCalculating(false);
    }
  }, [country, propertyType, transactionType, propertyValue, hasMortgage, isPrimaryResidence]);

  const handleCompare = useCallback(async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          propertyType,
          transactionType,
          propertyValue: Number(propertyValue),
          hasMortgage,
          compareCountries: ['BJ', 'CI', 'BF', 'TG'],
        }),
      });
      const data = await res.json();
      if (res.ok && data.comparisons) {
        setComparisons(data.comparisons);
        setShowComparison(true);
      }
    } catch {
      // Silently handle error
    } finally {
      setIsCalculating(false);
    }
  }, [country, propertyType, transactionType, propertyValue, hasMortgage]);

  const selectedCountry = COUNTRIES.find(c => c.code === country);

  // Pie chart data
  const pieData = result ? [
    { name: "Droit d'enregistrement", amount: result.registrationDuty, color: '#003087' },
    { name: 'Honoraires notariaux', amount: result.notaryFees, color: '#D4AF37' },
    { name: 'Taxe de mutation', amount: result.transferTax, color: '#00A651' },
    { name: 'Droit de timbre', amount: result.stampDuty, color: '#6B7280' },
    { name: 'TVA', amount: result.vat, color: '#EF4444' },
    { name: 'Frais hypothécaires', amount: result.mortgageFees, color: '#8B5CF6' },
  ].filter(item => item.amount > 0) : [];

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Calculateur Fiscal Immobilier</CardTitle>
              <p className="text-xs text-gray-500">Estimez les frais et taxes de votre transaction</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="calculator">
          <TabsList className="w-full">
            <TabsTrigger value="calculator" className="flex-1">
              <Calculator className="w-4 h-4 mr-1.5" /> Calcul
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex-1" onClick={() => { if (comparisons.length === 0) handleCompare(); }}>
              <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Comparaison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4 mt-4">
            {/* Input Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Country */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  <Globe2 className="w-3.5 h-3.5 inline mr-1" /> Pays
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" /> Type de bien
                </Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(pt => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Transaction
                </Label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden h-10">
                  <button
                    className={cn(
                      'flex-1 text-sm font-medium transition-colors',
                      transactionType === 'achat'
                        ? 'bg-[#003087] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    )}
                    onClick={() => setTransactionType('achat')}
                  >
                    Achat
                  </button>
                  <button
                    className={cn(
                      'flex-1 text-sm font-medium transition-colors',
                      transactionType === 'location'
                        ? 'bg-[#003087] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    )}
                    onClick={() => setTransactionType('location')}
                  >
                    Location
                  </button>
                </div>
              </div>

              {/* Property Value */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Valeur du bien (XOF)
                </Label>
                <Input
                  type="text"
                  value={propertyValue}
                  onChange={e => setPropertyValue(e.target.value.replace(/\D/g, ''))}
                  className="h-10 text-right font-mono"
                  placeholder="25 000 000"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hasMortgage}
                  onCheckedChange={setHasMortgage}
                  className="data-[state=checked]:bg-[#003087]"
                />
                <Label className="text-sm text-gray-600">Hypothèque</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isPrimaryResidence}
                  onCheckedChange={setIsPrimaryResidence}
                  className="data-[state=checked]:bg-[#00A651]"
                />
                <Label className="text-sm text-gray-600">Résidence principale</Label>
              </div>
            </div>

            {/* Calculate Buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-[#003087] hover:bg-[#002a70] h-11"
                onClick={handleCalculate}
                disabled={isCalculating || !propertyValue}
              >
                {isCalculating ? 'Calcul...' : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" /> Calculer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                onClick={handleCompare}
                disabled={isCalculating || !propertyValue}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Comparer
              </Button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Separator />

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#003087]/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Total taxes</p>
                      <p className="text-base font-bold text-[#003087]">{formatXOF(result.totalTaxes)}</p>
                    </div>
                    <div className="bg-[#D4AF37]/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Hon. notariaux</p>
                      <p className="text-base font-bold text-[#D4AF37]">{formatXOF(result.totalNotaryFees)}</p>
                    </div>
                    <div className="bg-[#00A651]/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Coût total</p>
                      <p className="text-base font-bold text-[#00A651]">{formatXOF(result.grandTotal)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Taux effectif</p>
                      <p className="text-base font-bold text-gray-900">{result.effectiveRate}%</p>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Détail des frais — {selectedCountry?.flag} {selectedCountry?.name}
                      </h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Frais</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Taux</TableHead>
                          <TableHead className="text-xs text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.breakdown.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{item.name}</TableCell>
                            <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{item.description}</TableCell>
                            <TableCell className="text-sm text-right">
                              {item.isPercentage ? `${item.rate}%` : `${item.rate} XOF`}
                            </TableCell>
                            <TableCell className="text-sm text-right font-mono font-medium">
                              {formatXOF(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pie Chart */}
                  {pieData.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                        <PieChartIcon className="w-4 h-4" /> Répartition des coûts
                      </h4>
                      <PieChart items={pieData} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 mt-4">
            {comparisons.length > 0 ? (
              <>
                {/* Comparison Bar Chart */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" /> Comparaison des frais par pays
                  </h4>
                  <div className="space-y-3">
                    {comparisons.sort((a, b) => a.grandTotal - b.grandTotal).map(comp => {
                      const maxTotal = Math.max(...comparisons.map(c => c.grandTotal));
                      const widthPercent = maxTotal > 0 ? (comp.grandTotal / maxTotal) * 100 : 0;
                      const countryInfo = COUNTRIES.find(c => c.code === comp.country);
                      return (
                        <div key={comp.country} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{countryInfo?.flag} {countryInfo?.name}</span>
                            <span className="font-mono font-bold">{formatXOF(comp.grandTotal)}</span>
                          </div>
                          <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={cn(
                                'h-full rounded-full flex items-center justify-end pr-2',
                                comp.country === 'BJ' ? 'bg-[#003087]' :
                                comp.country === 'CI' ? 'bg-[#D4AF37]' :
                                comp.country === 'BF' ? 'bg-[#00A651]' : 'bg-[#8B5CF6]'
                              )}
                            >
                              <span className="text-[10px] text-white font-bold">{comp.effectiveRate}%</span>
                            </motion.div>
                          </div>
                          <div className="flex gap-3 text-[10px] text-gray-500">
                            <span>Taxes: {formatXOF(comp.totalTaxes)}</span>
                            <span>Notaire: {formatXOF(comp.totalNotaryFees)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Comparison Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Frais</TableHead>
                        {comparisons.map(comp => (
                          <TableHead key={comp.country} className="text-xs text-right">
                            {COUNTRIES.find(c => c.code === comp.country)?.flag} {comp.countryName}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-medium">
                        <TableCell className="text-sm">Valeur du bien</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono">{formatXOF(comp.propertyValue)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">Droit d&apos;enregistrement</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono">{formatXOF(comp.registrationDuty)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">Honoraires notariaux</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono">{formatXOF(comp.notaryFees)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">Taxe de mutation</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono">{formatXOF(comp.transferTax)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-[#003087]/5 font-bold">
                        <TableCell className="text-sm">Coût total</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono">{formatXOF(comp.grandTotal)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-[#00A651]/5">
                        <TableCell className="text-sm font-medium">Taux effectif</TableCell>
                        {comparisons.map(comp => (
                          <TableCell key={comp.country} className="text-sm text-right font-mono font-bold">{comp.effectiveRate}%</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Cliquez sur &quot;Comparer&quot; pour voir la comparaison</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
