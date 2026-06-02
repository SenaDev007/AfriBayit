'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, QrCode, LogIn, LogOut, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CheckinQRProps {
  bookingId: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  propertyTitle?: string;
  initialStatus?: string;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export function CheckinQR({
  bookingId,
  propertyId,
  checkInDate,
  checkOutDate,
  propertyTitle,
  initialStatus = 'confirmed',
}: CheckinQRProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [checkedOutAt, setCheckedOutAt] = useState<string | null>(null);

  // Fetch QR code on mount
  const fetchQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        bookingId,
        propertyId,
        checkInDate,
        checkOutDate,
      });
      const res = await fetch(`/api/checkin/qr?${params}`);
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setStatus(data.status || initialStatus);
      } else {
        setError(data.error || 'Erreur lors de la génération du QR code');
      }
    } catch (err) {
      setError('Erreur réseau — veuillez réessayer');
    } finally {
      setLoading(false);
    }
  }, [bookingId, propertyId, checkInDate, checkOutDate, initialStatus]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  // Process check-in via QR scan
  const handleCheckin = async () => {
    if (!qrCode) return;
    setScanStatus('scanning');
    setError(null);

    try {
      const res = await fetch('/api/checkin/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrCode }),
      });
      const data = await res.json();

      if (data.success) {
        setScanStatus('success');
        setStatus('checked_in');
        setCheckedInAt(data.checkedInAt);
      } else {
        setScanStatus('error');
        setError(data.error || 'Échec du check-in');
      }
    } catch {
      setScanStatus('error');
      setError('Erreur réseau — veuillez réessayer');
    }
  };

  // Process check-out
  const handleCheckout = async () => {
    setScanStatus('scanning');
    setError(null);

    try {
      const res = await fetch('/api/checkin/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (data.success) {
        setScanStatus('success');
        setStatus('completed');
        setCheckedOutAt(data.checkedOutAt);
      } else {
        setScanStatus('error');
        setError(data.error || 'Échec du check-out');
      }
    } catch {
      setScanStatus('error');
      setError('Erreur réseau — veuillez réessayer');
    }
  };

  // Status badge config
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmée', variant: 'default' as const, color: 'bg-emerald-100 text-emerald-800' };
      case 'checked_in':
        return { label: 'Enregistré', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { label: 'Terminé', variant: 'default' as const, color: 'bg-gray-100 text-gray-800' };
      case 'cancelled':
        return { label: 'Annulée', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusConfig = getStatusConfig();

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    };
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check-in Digital
          </CardTitle>
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
        {propertyTitle && (
          <p className="text-sm text-muted-foreground mt-1">{propertyTitle}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <LogIn className="h-4 w-4" />
            <span>{formatDate(checkInDate)}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span>{formatDate(checkOutDate)}</span>
          </div>
        </div>

        {/* QR Code display */}
        {status !== 'completed' && qrCode && (
          <div className="flex justify-center">
            <div className="relative p-3 bg-white rounded-xl border shadow-sm">
              <img
                src={qrCode}
                alt="QR Code de check-in"
                className="w-64 h-64 object-contain"
              />
              {/* Success overlay */}
              <AnimatePresence>
                {scanStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle2 className="h-24 w-24 text-emerald-500" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Check-in time display */}
        {checkedInAt && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Check-in: {new Date(checkedInAt).toLocaleString('fr-FR')}</span>
          </div>
        )}

        {/* Check-out time display */}
        {checkedOutAt && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Check-out: {new Date(checkedOutAt).toLocaleString('fr-FR')}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {status === 'confirmed' && (
            <Button
              onClick={handleCheckin}
              className="flex-1"
              disabled={scanStatus === 'scanning' || !qrCode}
            >
              {scanStatus === 'scanning' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Check-in
                </>
              )}
            </Button>
          )}

          {status === 'checked_in' && (
            <Button
              onClick={handleCheckout}
              variant="outline"
              className="flex-1"
              disabled={scanStatus === 'scanning'}
            >
              {scanStatus === 'scanning' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Départ...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Check-out
                </>
              )}
            </Button>
          )}

          {status === 'completed' && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 w-full justify-center py-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Séjour terminé</span>
            </div>
          )}
        </div>

        {/* QR refresh */}
        {status !== 'completed' && qrCode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQR}
            className="w-full text-muted-foreground"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Régénérer le QR code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
