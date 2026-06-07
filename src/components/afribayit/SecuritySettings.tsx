'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Smartphone,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  QrCode,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  hasPassword: boolean;
}

export default function SecuritySettings({ twoFactorEnabled: initial2FA, hasPassword }: SecuritySettingsProps) {
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initial2FA);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // 2FA setup state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'loading' | 'qr' | 'verify'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // 2FA disable state
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Active sessions (mock data — would need a sessions table for real data)
  const sessions = [
    {
      id: '1',
      device: 'Chrome sur Windows',
      location: 'Cotonou, Bénin',
      lastActive: 'Actif maintenant',
      current: true,
    },
    {
      id: '2',
      device: 'Safari sur iPhone',
      location: 'Abidjan, Côte d\'Ivoire',
      lastActive: 'Il y a 2 heures',
      current: false,
    },
  ];

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      toast({ title: 'Succès', description: 'Mot de passe modifié avec succès' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleStart2FASetup = async () => {
    setShow2FASetup(true);
    setSetupStep('loading');
    setTotpCode('');

    try {
      const res = await fetch('/api/auth/2fa/setup');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la configuration du 2FA');
      }

      setQrCodeUrl(data.qrCodeUrl);
      setManualEntryKey(data.manualEntryKey);
      setSetupStep('qr');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la configuration du 2FA',
        variant: 'destructive',
      });
      setShow2FASetup(false);
    }
  };

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) {
      toast({ title: 'Erreur', description: 'Le code doit contenir 6 chiffres', variant: 'destructive' });
      return;
    }

    setSetupLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Code invalide');
      }

      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      toast({ title: 'Succès', description: '2FA activé avec succès' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Code invalide',
        variant: 'destructive',
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast({ title: 'Erreur', description: 'Mot de passe requis', variant: 'destructive' });
      return;
    }

    setDisabling2FA(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la désactivation');
      }

      setTwoFactorEnabled(false);
      setShow2FADisable(false);
      setDisablePassword('');
      toast({ title: 'Succès', description: '2FA désactivé' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la désactivation',
        variant: 'destructive',
      });
    } finally {
      setDisabling2FA(false);
    }
  };

  const copyManualKey = () => {
    navigator.clipboard.writeText(manualEntryKey);
    toast({ title: 'Copié', description: 'Clé copiée dans le presse-papier' });
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-[#003087]/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#003087]/10">
                <Lock className="h-5 w-5 text-[#003087]" />
              </div>
              <div>
                <CardTitle className="text-lg">Changer le mot de passe</CardTitle>
                <CardDescription>Modifiez votre mot de passe pour sécuriser votre compte</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasPassword && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                Vous n&apos;avez pas de mot de passe configuré. Votre compte utilise une connexion OAuth.
              </div>
            )}
            {hasPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez le nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-[#003087] hover:bg-[#002266] text-white"
                >
                  {changingPassword ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
                  ) : (
                    <><KeyRound className="h-4 w-4 mr-2" /> Changer le mot de passe</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 2FA Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-[#003087]/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#003087]/10">
                  <Smartphone className="h-5 w-5 text-[#003087]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Authentification à deux facteurs</CardTitle>
                  <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte</CardDescription>
                </div>
              </div>
              <Badge
                className={twoFactorEnabled ? 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20' : 'bg-gray-100 text-gray-600'}
              >
                {twoFactorEnabled ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activé</>
                ) : (
                  <><XCircle className="h-3.5 w-3.5 mr-1" /> Désactivé</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className={`h-8 w-8 ${twoFactorEnabled ? 'text-[#00A651]' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-sm">
                    {twoFactorEnabled ? '2FA activé' : '2FA non activé'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled
                      ? 'Votre compte est protégé par une vérification en deux étapes'
                      : 'Activez le 2FA pour sécuriser votre compte'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleStart2FASetup();
                    } else {
                      setShow2FADisable(true);
                    }
                  }}
                />
              </div>
            </div>

            {/* 2FA Setup Dialog */}
            <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#003087]" />
                    Configuration du 2FA
                  </DialogTitle>
                  <DialogDescription>
                    Scannez le QR code avec votre application d&apos;authentification
                  </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {setupStep === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center py-8"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-[#003087]" />
                      <p className="mt-3 text-sm text-muted-foreground">Génération du secret TOTP...</p>
                    </motion.div>
                  )}

                  {setupStep === 'qr' && (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col items-center p-4 bg-white rounded-lg border">
                        <QrCode className="h-48 w-48 text-[#003087]" />
                        <p className="mt-3 text-xs text-muted-foreground text-center">
                          Scannez avec Google Authenticator, Authy ou une app similaire
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Clé manuelle</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {manualEntryKey}
                          </code>
                          <Button variant="outline" size="sm" onClick={copyManualKey}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Button onClick={() => setSetupStep('verify')} className="w-full bg-[#003087] hover:bg-[#002266] text-white">
                        Continuer
                      </Button>
                    </motion.div>
                  )}

                  {setupStep === 'verify' && (
                    <motion.div
                      key="verify"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Entrez le code à 6 chiffres de votre application d&apos;authentification
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <Input
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="text-center text-2xl tracking-[0.5em] font-mono max-w-[240px]"
                          maxLength={6}
                        />
                      </div>
                      <Button
                        onClick={handleVerify2FA}
                        disabled={setupLoading || totpCode.length !== 6}
                        className="w-full bg-[#00A651] hover:bg-[#008f47] text-white"
                      >
                        {setupLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Vérification...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4 mr-2" /> Activer le 2FA</>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DialogContent>
            </Dialog>

            {/* 2FA Disable Dialog */}
            <Dialog open={show2FADisable} onOpenChange={setShow2FADisable}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <Shield className="h-5 w-5" />
                    Désactiver le 2FA
                  </DialogTitle>
                  <DialogDescription>
                    Cette action rendra votre compte moins sécurisé. Entrez votre mot de passe pour confirmer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disablePassword">Mot de passe</Label>
                    <Input
                      id="disablePassword"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShow2FADisable(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={disabling2FA || !disablePassword}
                  >
                    {disabling2FA ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Désactivation...</>
                    ) : (
                      'Désactiver le 2FA'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-[#003087]/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#003087]/10">
                <Smartphone className="h-5 w-5 text-[#003087]" />
              </div>
              <div>
                <CardTitle className="text-lg">Sessions actives</CardTitle>
                <CardDescription>Appareils connectés à votre compte</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session, i) => (
              <React.Fragment key={session.id}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white border">
                      <Smartphone className="h-4 w-4 text-[#003087]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{session.device}</p>
                      <p className="text-xs text-muted-foreground">{session.location} · {session.lastActive}</p>
                    </div>
                  </div>
                  {session.current ? (
                    <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 text-xs">
                      Actif
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs">
                      Révoquer
                    </Button>
                  )}
                </div>
                {i < sessions.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
