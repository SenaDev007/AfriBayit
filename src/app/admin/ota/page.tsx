'use client';

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Cable, Calendar, Check, CheckCircle2, Clock, Download, ExternalLink, Globe2, Hotel, RefreshCw, Settings, Shield, TrendingUp, Upload, X, XCircle, Zap } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ============ Mock Data ============

const otaProviders = [
  { id: 'booking', name: 'Booking.com', status: 'connected', lastSync: '2025-12-15T10:30:00', hotelsMapped: 12, syncErrors: 0, logo: '' },
  { id: 'expedia', name: 'Expedia Group', status: 'connected', lastSync: '2025-12-15T09:15:00', hotelsMapped: 8, syncErrors: 2, logo: '' },
  { id: 'airbnb', name: 'Airbnb', status: 'partial', lastSync: '2025-12-14T22:00:00', hotelsMapped: 5, syncErrors: 1, logo: '' },
  { id: 'hotelscom', name: 'Hotels.com', status: 'disconnected', lastSync: null, hotelsMapped: 0, syncErrors: 0, logo: '' },
  { id: 'jumia', name: 'Jumia Travel', status: 'connected', lastSync: '2025-12-15T08:00:00', hotelsMapped: 15, syncErrors: 0, logo: '' },
];

const syncLogs = [
  { id: 1, provider: 'Booking.com', action: 'Rate Update', status: 'success', rooms: 48, timestamp: '2025-12-15T10:30:00' },
  { id: 2, provider: 'Expedia Group', action: 'Availability Sync', status: 'error', rooms: 0, timestamp: '2025-12-15T09:15:00', error: 'API timeout — Room type mismatch for Hotel Palm Beach' },
  { id: 3, provider: 'Airbnb', action: 'Booking Import', status: 'success', rooms: 3, timestamp: '2025-12-14T22:00:00' },
  { id: 4, provider: 'Jumia Travel', action: 'Rate Update', status: 'success', rooms: 32, timestamp: '2025-12-15T08:00:00' },
  { id: 5, provider: 'Expedia Group', action: 'Rate Update', status: 'error', rooms: 0, timestamp: '2025-12-15T08:00:00', error: 'Authentication failed — Token expired' },
  { id: 6, provider: 'Booking.com', action: 'Reservation Import', status: 'success', rooms: 12, timestamp: '2025-12-15T07:00:00' },
];

const hotelMappings = [
  { hotelName: 'Hôtel du Port', internalId: 'H-BJ-001', bookingId: '1234567', expediaId: 'EXP-BJ-001', airbnbId: null, jumiaId: 'JUM-BJ-001', rateParity: true },
  { hotelName: 'Palm Beach Hotel', internalId: 'H-CI-001', bookingId: '2345678', expediaId: 'EXP-CI-001', airbnbId: 'ABNB-CI-001', jumiaId: null, rateParity: false },
  { hotelName: 'Hôtel Silmandé', internalId: 'H-BF-001', bookingId: '3456789', expediaId: null, airbnbId: null, jumiaId: 'JUM-BF-001', rateParity: true },
  { hotelName: 'Hôtel Sarakawa', internalId: 'H-TG-001', bookingId: '4567890', expediaId: 'EXP-TG-001', airbnbId: 'ABNB-TG-001', jumiaId: 'JUM-TG-001', rateParity: true },
  { hotelName: 'Azalaï Hôtel', internalId: 'H-BJ-002', bookingId: '5678901', expediaId: 'EXP-BJ-002', airbnbId: null, jumiaId: 'JUM-BJ-002', rateParity: false },
];

const parityViolations = [
  { hotel: 'Palm Beach Hotel', ourRate: 45000, bookingRate: 42000, expediaRate: 40000, diff: -5000, severity: 'high' },
  { hotel: 'Azalaï Hôtel', ourRate: 55000, bookingRate: 52000, expediaRate: 55000, diff: -3000, severity: 'medium' },
];

const overbookingAlerts = [
  { hotel: 'Hôtel du Port', room: 'Suite Océan', date: '2025-12-20', bookingCount: 2, capacity: 1, providers: ['Booking.com', 'Airbnb'] },
  { hotel: 'Sarakawa', room: 'Chambre Standard', date: '2025-12-25', bookingCount: 3, capacity: 2, providers: ['Booking.com', 'Expedia', 'Direct'] },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  connected: { label: 'Connecté', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  partial: { label: 'Partiel', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  disconnected: { label: 'Déconnecté', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOtaPage() {
  const [autoSync, setAutoSync] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cable className="w-6 h-6 text-[#003087]" />
            Configuration OTA
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des canaux de distribution hôtelière</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={autoSync} onCheckedChange={setAutoSync} className="data-[state=checked]:bg-[#003087]" />
            <span className="text-sm text-gray-600">Sync auto</span>
          </div>
          <Button size="sm" className="h-9 bg-[#003087] hover:bg-[#002a70]">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Synchroniser tout
          </Button>
        </div>
      </div>

      {/* Alert banners */}
      {(parityViolations.length > 0 || overbookingAlerts.length > 0) && (
        <div className="space-y-2">
          {overbookingAlerts.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{overbookingAlerts.length} alerte(s) de surréservation</p>
                <p className="text-xs text-red-600">Des réservations en double ont été détectées sur plusieurs canaux</p>
              </div>
            </div>
          )}
          {parityViolations.length > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">{parityViolations.length} violation(s) de parité tarifaire</p>
                <p className="text-xs text-amber-600">Certains tarifs diffèrent entre les canaux de distribution</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Cable className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Fournisseurs connectés</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{otaProviders.filter(p => p.status === 'connected').length}/{otaProviders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Hôtels mappés</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{hotelMappings.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Surréservations</p>
            <p className="text-2xl font-bold text-red-600 font-display">{overbookingAlerts.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Erreurs sync</p>
            <p className="text-2xl font-bold text-amber-600 font-display">{otaProviders.reduce((s, p) => s + p.syncErrors, 0)}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="sync">Journaux de sync</TabsTrigger>
          <TabsTrigger value="mapping">Mapping hôtels</TabsTrigger>
          <TabsTrigger value="parity">Parité tarifaire</TabsTrigger>
          <TabsTrigger value="overbooking">Surréservation</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otaProviders.map((provider) => {
              const statusConfig = STATUS_CONFIG[provider.status];
              const StatusIcon = statusConfig.icon;
              return (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold">
                          {provider.logo}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{provider.name}</p>
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
                        <span className="text-gray-500">Hôtels mappés</span>
                        <span className="font-medium">{provider.hotelsMapped}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dernière sync</span>
                        <span className="text-xs">{provider.lastSync ? formatDate(provider.lastSync) : '—'}</span>
                      </div>
                      {provider.syncErrors > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Erreurs</span>
                          <span className="font-medium">{provider.syncErrors}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" disabled={provider.status === 'disconnected'}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Sync
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" disabled={provider.status === 'disconnected'}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Journaux de synchronisation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Fournisseur</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs">Chambres</TableHead>
                    <TableHead className="text-xs">Date/Heure</TableHead>
                    <TableHead className="text-xs">Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-medium">{log.provider}</TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', log.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                          {log.status === 'success' ? <><Check className="w-4 h-4" /> Succès</> : <><X className="w-4 h-4" /> Erreur</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right">{log.rooms}</TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                        {log.error || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4 mt-4">
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
                    <TableHead className="text-xs">ID Interne</TableHead>
                    <TableHead className="text-xs">Booking.com</TableHead>
                    <TableHead className="text-xs">Expedia</TableHead>
                    <TableHead className="text-xs">Airbnb</TableHead>
                    <TableHead className="text-xs">Jumia</TableHead>
                    <TableHead className="text-xs">Parité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotelMappings.map((hotel) => (
                    <TableRow key={hotel.internalId}>
                      <TableCell className="text-sm font-medium">{hotel.hotelName}</TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">{hotel.internalId}</TableCell>
                      <TableCell className="text-xs font-mono">{hotel.bookingId || '—'}</TableCell>
                      <TableCell className="text-xs font-mono">{hotel.expediaId || '—'}</TableCell>
                      <TableCell className="text-xs font-mono">{hotel.airbnbId || '—'}</TableCell>
                      <TableCell className="text-xs font-mono">{hotel.jumiaId || '—'}</TableCell>
                      <TableCell>
                        {hotel.rateParity ? (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> Violation
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parity" className="space-y-4 mt-4">
          {parityViolations.length > 0 ? (
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
                      <TableHead className="text-xs text-right">Notre tarif</TableHead>
                      <TableHead className="text-xs text-right">Booking.com</TableHead>
                      <TableHead className="text-xs text-right">Expedia</TableHead>
                      <TableHead className="text-xs text-right">Écart</TableHead>
                      <TableHead className="text-xs">Sévérité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parityViolations.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{v.hotel}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{v.ourRate.toLocaleString()} XOF</TableCell>
                        <TableCell className="text-sm text-right font-mono">{v.bookingRate.toLocaleString()} XOF</TableCell>
                        <TableCell className="text-sm text-right font-mono">{v.expediaRate.toLocaleString()} XOF</TableCell>
                        <TableCell className="text-sm text-right font-mono text-red-600">{v.diff.toLocaleString()} XOF</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px]', v.severity === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                            {v.severity === 'high' ? 'Élevée' : 'Moyenne'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucune violation de parité</p>
                <p className="text-xs text-gray-500 mt-1">Tous les tarifs sont alignés entre les canaux</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overbooking" className="space-y-4 mt-4">
          {overbookingAlerts.length > 0 ? (
            <div className="space-y-3">
              {overbookingAlerts.map((alert, i) => (
                <Card key={i} className="border-red-200 bg-red-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">{alert.hotel} — {alert.room}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {alert.bookingCount} réservation(s) pour {alert.capacity} chambre(s) le {new Date(alert.date).toLocaleDateString('fr-FR')}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {alert.providers.map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] bg-white border-red-200 text-red-700">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100">
                        Résoudre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucune surréservation</p>
                <p className="text-xs text-gray-500 mt-1">Toutes les réservations sont dans les limites de capacité</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
