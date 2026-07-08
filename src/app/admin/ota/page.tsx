'use client';

import React, { useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Cable, Check, CheckCircle2, ExternalLink, Hotel, RefreshCw, Settings, Star, Upload, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAdminOta, type AdminOtaProvidersResponse, type AdminOtaSyncLogsResponse, type AdminOtaMappingsResponse, type AdminOtaParityResponse } from '@/hooks/useAdmin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api-client';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Connecté', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  connected: { label: 'Connecté', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  partial: { label: 'Partiel', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  disconnected: { label: 'Déconnecté', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  inactive: { label: 'Inactif', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: XCircle },
};

const OTA_LABELS: Record<string, string> = {
  booking_com: 'OTA Partner',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  hotelscom: 'Hotels.com',
  jumia: 'Jumia Travel',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

// ============ Skeleton Components ============

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

function ProviderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ cols = 6, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: cols }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-3 w-16" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============ Sync Mutation ============

function useOtaSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { hotelId: string; channel?: string }) =>
      apiPost('/api/ota/sync', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ota'] });
    },
  });
}

// ============ Main Page ============

export default function AdminOtaPage() {
  const [activeTab, setActiveTab] = useState('providers');
  const [autoSync, setAutoSync] = useState(true);

  // Map tab to API tab param
  const apiTabMap: Record<string, string> = {
    providers: 'providers',
    sync: 'sync-logs',
    mapping: 'mappings',
    parity: 'parity',
  };

  const { data, isLoading, error } = useAdminOta({ tab: apiTabMap[activeTab] || 'providers' });
  const syncMutation = useOtaSync();
  const queryClient = useQueryClient();

  const handleSyncAll = useCallback(() => {
    // Sync all connected providers — we trigger syncs sequentially
    const providersData = data as AdminOtaProvidersResponse | undefined;
    if (providersData?.providers) {
      for (const p of providersData.providers) {
        syncMutation.mutate({ hotelId: p.id, channel: undefined });
      }
    }
  }, [data, syncMutation]);

  const handleSyncProvider = useCallback((providerId: string) => {
    // For provider-level sync, we use a generic call
    syncMutation.mutate({ hotelId: providerId });
  }, [syncMutation]);

  // Parse data based on active tab
  const providersData = activeTab === 'providers' ? (data as AdminOtaProvidersResponse | undefined) : undefined;
  const syncLogsData = activeTab === 'sync' ? (data as AdminOtaSyncLogsResponse | undefined) : undefined;
  const mappingsData = activeTab === 'mapping' ? (data as AdminOtaMappingsResponse | undefined) : undefined;
  const parityData = activeTab === 'parity' ? (data as AdminOtaParityResponse | undefined) : undefined;

  // Summary stats from any tab that returns it
  const summary = providersData?.summary || syncLogsData?.summary || mappingsData?.summary || parityData?.summary;

  // Compute overbooking / parity alert counts for banners
  const parityViolationCount = summary?.parityViolations ?? 0;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuration OTA</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-red-600">Erreur lors du chargement des données OTA</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration OTA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des canaux de distribution hôtelière</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={autoSync} onCheckedChange={setAutoSync} className="data-[state=checked]:bg-[#003087]" />
            <span className="text-sm text-gray-600">Sync auto</span>
          </div>
          <Button
            size="sm"
            className="h-9 bg-[#003087] hover:bg-[#002a70]"
            onClick={handleSyncAll}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', syncMutation.isPending && 'animate-spin')} /> Synchroniser tout
          </Button>
        </div>
      </div>

      {/* Alert banners */}
      {parityViolationCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{parityViolationCount} violation(s) de parité tarifaire</p>
              <p className="text-xs text-amber-600">Certains tarifs diffèrent entre les canaux de distribution</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                <Cable className="w-5 h-5 text-[#003087]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fournisseurs connectés</p>
                <p className="text-lg font-bold text-gray-900">{providersData?.providers?.length ?? summary?.totalProviders ?? 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Hôtels mappés</p>
                <p className="text-lg font-bold text-gray-900">{mappingsData?.pagination?.total ?? providersData?.providers?.reduce((s, p) => s + p.hotelsConnected, 0) ?? 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Violations parité</p>
                <p className="text-lg font-bold text-amber-600">{parityViolationCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Dernière sync</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(summary?.lastSyncAt ?? null)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="sync">Journaux de sync</TabsTrigger>
          <TabsTrigger value="mapping">Mapping hôtels</TabsTrigger>
          <TabsTrigger value="parity">Parité tarifaire</TabsTrigger>
        </TabsList>

        {/* ========== Providers Tab ========== */}
        <TabsContent value="providers" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProviderCardSkeleton />
              <ProviderCardSkeleton />
              <ProviderCardSkeleton />
            </div>
          ) : !providersData?.providers?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Cable className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucun fournisseur OTA</p>
                <p className="text-xs text-gray-500 mt-1">Configurez vos canaux de distribution</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providersData.providers.map((provider) => {
                const statusKey = provider.status || 'inactive';
                const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.inactive;
                const StatusIcon = statusConfig.icon;
                return (
                  <Card key={provider.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-[#003087]">
                            {OTA_LABELS[provider.id]?.charAt(0) || provider.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{OTA_LABELS[provider.id] || provider.name}</p>
                            <Badge variant="outline" className={cn('text-[10px] mt-1', statusConfig.color)}>
                              <StatusIcon className="w-3 h-3 mr-0.5" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Settings className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Hôtels connectés</span>
                          <span className="font-medium">{provider.hotelsConnected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dernière sync</span>
                          <span className="text-xs">{formatDate(provider.lastSync)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          disabled={statusKey === 'disconnected' || statusKey === 'inactive' || syncMutation.isPending}
                          onClick={() => handleSyncProvider(provider.id)}
                        >
                          <RefreshCw className={cn('w-3 h-3 mr-1', syncMutation.isPending && 'animate-spin')} /> Sync
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" disabled={statusKey === 'disconnected' || statusKey === 'inactive'}>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========== Sync Logs Tab ========== */}
        <TabsContent value="sync" className="space-y-4 mt-4">
          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : !syncLogsData?.syncLogs?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucun journal de synchronisation</p>
                <p className="text-xs text-gray-500 mt-1">Les journaux apparaîtront après la première synchronisation</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Journaux de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Hôtel</TableHead>
                      <TableHead className="text-xs">Fournisseur</TableHead>
                      <TableHead className="text-xs">Opération</TableHead>
                      <TableHead className="text-xs">Statut</TableHead>
                      <TableHead className="text-xs text-right">Chambres</TableHead>
                      <TableHead className="text-xs">Date/Heure</TableHead>
                      <TableHead className="text-xs">Détail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogsData.syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-medium">{log.hotel?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{OTA_LABELS[log.ota] || log.ota}</TableCell>
                        <TableCell className="text-sm">{log.operation}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px]', log.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                            {log.status === 'success' ? <><Check className="w-3 h-3" /> Succès</> : <><X className="w-3 h-3" /> Erreur</>}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right">{log.roomsUpdated ?? '—'}</TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(log.executedAt)}</TableCell>
                        <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                          {log.errorMessage || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== Hotel Mappings Tab ========== */}
        <TabsContent value="mapping" className="space-y-4 mt-4">
          {isLoading ? (
            <TableSkeleton cols={7} />
          ) : !mappingsData?.hotels?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Hotel className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucun hôtel mappé</p>
                <p className="text-xs text-gray-500 mt-1">Ajoutez des hôtels pour configurer les mappings OTA</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Mapping Hôtels OTA</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Upload className="w-3 h-3 mr-1" /> Import CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Hôtel</TableHead>
                      <TableHead className="text-xs">Ville</TableHead>
                      <TableHead className="text-xs">Pays</TableHead>
                      <TableHead className="text-xs">Références OTA</TableHead>
                      <TableHead className="text-xs">Canaux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappingsData.hotels.map((hotel) => {
                      let otaRefs: Record<string, string> = {};
                      if (hotel.otaRefs) {
                        try {
                          otaRefs = JSON.parse(hotel.otaRefs);
                        } catch {
                          otaRefs = {};
                        }
                      }
                      const channels = Object.entries(otaRefs).filter(([, v]) => v);
                      const hasChannelInventory = Array.isArray(hotel.channelInventory) && hotel.channelInventory.length > 0;
                      return (
                        <TableRow key={hotel.id}>
                          <TableCell className="text-sm font-medium">{hotel.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{hotel.city || '—'}</TableCell>
                          <TableCell className="text-sm">{hotel.country || '—'}</TableCell>
                          <TableCell className="text-xs font-mono max-w-[200px] truncate">{hotel.otaRefs || '—'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {channels.length > 0 ? channels.map(([key]) => (
                                <Badge key={key} variant="outline" className="text-[10px] bg-[#003087]/5 text-[#003087] border-[#003087]/20">
                                  {OTA_LABELS[key] || key}
                                </Badge>
                              )) : (
                                <span className="text-xs text-gray-400">Aucun</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== Parity Tab ========== */}
        <TabsContent value="parity" className="space-y-4 mt-4">
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : !parityData?.violations?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucune violation de parité</p>
                <p className="text-xs text-gray-500 mt-1">Tous les tarifs sont alignés entre les canaux</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Violations de parité tarifaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Hôtel</TableHead>
                        <TableHead className="text-xs">Chambre</TableHead>
                        <TableHead className="text-xs">Tarifs par canal</TableHead>
                        <TableHead className="text-xs text-right">Écart max</TableHead>
                        <TableHead className="text-xs">Sévérité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parityData.violations.map((v, i) => {
                        const validRates = v.rates.filter(r => r.rateXof !== null);
                        const prices = validRates.map(r => r.rateXof!);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        const diff = max - min;
                        const severity = diff > min * 0.15 ? 'high' : 'medium';
                        return (
                          <TableRow key={v.roomId || i}>
                            <TableCell className="text-sm font-medium">{v.hotelName}</TableCell>
                            <TableCell className="text-sm">{v.roomType}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {v.rates.map((r, j) => (
                                  <Badge key={j} variant="outline" className="text-[10px]">
                                    {OTA_LABELS[r.ota] || r.ota}: {r.rateXof !== null ? formatXOF(r.rateXof) : '—'}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-right font-mono text-red-600">{formatXOF(diff)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px]', severity === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                                {severity === 'high' ? 'Élevée' : 'Moyenne'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
