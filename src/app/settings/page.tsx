'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  BadgeCheck,
  Link2,
  Settings,
  Trash2,
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Coins,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import SecuritySettings from '@/components/afribayit/SecuritySettings';
import ConnectedAccounts from '@/components/afribayit/ConnectedAccounts';


// Types
interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  avatar: string | null;
  preferredLanguage: string;
  currency: string;
  verified: boolean;
  emailVerified: string | null;
  phoneVerified: string | null;
  twoFactorEnabled: boolean;
  role: string;
  kycLevel: number;
  createdAt: string;
}

// Tab config
const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'verification', label: 'Vérification', icon: BadgeCheck },
  { id: 'connected', label: 'Comptes connectés', icon: Link2 },
  { id: 'preferences', label: 'Préférences', icon: Settings },
  { id: 'delete', label: 'Supprimer le compte', icon: Trash2 },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('');

  // Preferences
  const [formLanguage, setFormLanguage] = useState('fr');
  const [formCurrency, setFormCurrency] = useState('XOF');

  // Verification
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        // Populate form
        setFormName(data.user.name || '');
        setFormBio(data.user.bio || '');
        setFormPhone(data.user.phone || '');
        setFormCity(data.user.city || '');
        setFormCountry(data.user.country || '');
        setFormLanguage(data.user.preferredLanguage || 'fr');
        setFormCurrency(data.user.currency || 'XOF');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/settings');
      return;
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          bio: formBio,
          phone: formPhone,
          city: formCity,
          country: formCountry,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setProfile(data.user);
      toast({ title: 'Succès', description: 'Profil mis à jour' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredLanguage: formLanguage,
          currency: formCurrency,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setProfile(data.user);
      toast({ title: 'Succès', description: 'Préférences mises à jour' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Send email verification
  const handleSendEmailOtp = async () => {
    setSendingEmailOtp(true);
    try {
      const res = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(profile?.email || '')}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setEmailOtpSent(true);
      toast({ title: 'Code envoyé', description: 'Vérifiez votre boîte mail' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de l\'envoi',
        variant: 'destructive',
      });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Verify email
  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, code: emailOtpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Code invalide');
      }

      // Refresh profile
      await fetchProfile();
      setEmailOtpSent(false);
      setEmailOtpCode('');
      toast({ title: 'Succès', description: 'Email vérifié avec succès' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Code invalide',
        variant: 'destructive',
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Send phone verification
  const handleSendPhoneOtp = async () => {
    if (!formPhone) {
      toast({ title: 'Erreur', description: 'Ajoutez un numéro de téléphone d\'abord', variant: 'destructive' });
      return;
    }
    setSendingPhoneOtp(true);
    try {
      const res = await fetch(`/api/auth/verify-phone?phone=${encodeURIComponent(formPhone)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setPhoneOtpSent(true);
      toast({ title: 'Code envoyé', description: 'Vérifiez votre téléphone' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de l\'envoi',
        variant: 'destructive',
      });
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  // Verify phone
  const handleVerifyPhone = async () => {
    setVerifyingPhone(true);
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formPhone, code: phoneOtpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Code invalide');
      }

      await fetchProfile();
      setPhoneOtpSent(false);
      setPhoneOtpCode('');
      toast({ title: 'Succès', description: 'Téléphone vérifié avec succès' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Code invalide',
        variant: 'destructive',
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') {
      toast({ title: 'Erreur', description: 'Tapez SUPPRIMER pour confirmer', variant: 'destructive' });
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmation: 'SUPPRIMER' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast({ title: 'Compte supprimé', description: 'Votre compte a été supprimé' });
      router.push('/');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#003087]" />
          <p className="text-sm text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Connectez-vous pour accéder aux paramètres</p>
            <Button className="bg-[#003087] hover:bg-[#002266] text-white" onClick={() => router.push('/auth/login?callbackUrl=/settings')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-[#003087] hover:bg-[#003087]/5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <h1 className="text-xl font-bold text-[#003087]">Paramètres du compte</h1>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs — Desktop */}
          <nav className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-[#003087] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#003087]'
                      }
                      ${tab.id === 'delete' && !isActive ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : ''}
                      ${tab.id === 'delete' && isActive ? 'bg-red-600 text-white shadow-md' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile Tabs */}
          <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                      ${isActive
                        ? 'bg-[#003087] text-white shadow-sm'
                        : 'bg-white text-gray-600 border hover:bg-gray-50'
                      }
                      ${tab.id === 'delete' && !isActive ? 'text-red-500 border-red-200' : ''}
                      ${tab.id === 'delete' && isActive ? 'bg-red-600 text-white' : ''}
                    `}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ============ TAB 1: PROFILE ============ */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#003087]">Informations du profil</h2>
                    <p className="text-sm text-muted-foreground mt-1">Mettez à jour vos informations personnelles</p>
                  </div>

                  <Card className="border-[#003087]/10">
                    <CardContent className="p-6 space-y-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" /> Nom complet
                        </Label>
                        <Input
                          id="name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Votre nom"
                        />
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="flex items-center gap-2">
                          <span className="text-sm">📝</span> Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={formBio}
                          onChange={(e) => setFormBio(e.target.value)}
                          placeholder="Parlez un peu de vous..."
                          maxLength={500}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground text-right">{formBio.length}/500</p>
                      </div>

                      <Separator />

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" /> Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="+229 90 00 00 00"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" /> Ville
                        </Label>
                        <Input
                          id="city"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="Cotonou"
                        />
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5" /> Pays
                        </Label>
                        <Select value={formCountry} onValueChange={setFormCountry}>
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Sélectionnez votre pays" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                            <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                            <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                            <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                            <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                            <SelectItem value="ML">🇲🇱 Mali</SelectItem>
                            <SelectItem value="NE">🇳🇪 Niger</SelectItem>
                            <SelectItem value="GN">🇬🇳 Guinée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-[#003087] hover:bg-[#002266] text-white min-w-[140px]"
                        >
                          {saving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde...</>
                          ) : (
                            <><Save className="h-4 w-4 mr-2" /> Enregistrer</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ============ TAB 2: SECURITY ============ */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#003087]">Sécurité</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gérez votre mot de passe et l&apos;authentification à deux facteurs</p>
                  </div>
                  <SecuritySettings
                    twoFactorEnabled={profile?.twoFactorEnabled || false}
                    hasPassword={true}
                  />
                </motion.div>
              )}

              {/* ============ TAB 3: VERIFICATION ============ */}
              {activeTab === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#003087]">Vérification</h2>
                    <p className="text-sm text-muted-foreground mt-1">Vérifiez votre email et votre numéro de téléphone</p>
                  </div>

                  {/* Email Verification */}
                  <Card className="border-[#003087]/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-[#003087]/10 shrink-0">
                          <Mail className="h-5 w-5 text-[#003087]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">Adresse email</h3>
                            {profile?.emailVerified ? (
                              <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Vérifié
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                <XCircle className="h-3 w-3 mr-1" /> Non vérifié
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>

                          {!profile?.emailVerified && (
                            <div className="mt-4 space-y-3">
                              {!emailOtpSent ? (
                                <Button
                                  onClick={handleSendEmailOtp}
                                  disabled={sendingEmailOtp}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#003087] text-[#003087] hover:bg-[#003087]/5"
                                >
                                  {sendingEmailOtp ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Envoi...</>
                                  ) : (
                                    <><Send className="h-3.5 w-3.5 mr-1.5" /> Envoyer un code de vérification</>
                                  )}
                                </Button>
                              ) : (
                                <div className="flex items-end gap-2">
                                  <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Code de vérification</Label>
                                    <Input
                                      value={emailOtpCode}
                                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      placeholder="000000"
                                      className="font-mono text-center tracking-widest"
                                      maxLength={6}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleVerifyEmail}
                                    disabled={verifyingEmail || emailOtpCode.length !== 6}
                                    size="sm"
                                    className="bg-[#00A651] hover:bg-[#008f47] text-white"
                                  >
                                    {verifyingEmail ? (
                                      <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /></>
                                    ) : (
                                      <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Vérifier</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Phone Verification */}
                  <Card className="border-[#003087]/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-[#003087]/10 shrink-0">
                          <Phone className="h-5 w-5 text-[#003087]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">Numéro de téléphone</h3>
                            {profile?.phoneVerified ? (
                              <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Vérifié
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                <XCircle className="h-3 w-3 mr-1" /> Non vérifié
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile?.phone || 'Aucun numéro de téléphone'}
                          </p>

                          {!profile?.phoneVerified && (
                            <div className="mt-4 space-y-3">
                              {!profile?.phone && (
                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                  Ajoutez un numéro de téléphone dans l&apos;onglet Profil avant de le vérifier.
                                </p>
                              )}
                              {!phoneOtpSent ? (
                                <Button
                                  onClick={handleSendPhoneOtp}
                                  disabled={sendingPhoneOtp || !profile?.phone}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#003087] text-[#003087] hover:bg-[#003087]/5"
                                >
                                  {sendingPhoneOtp ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Envoi...</>
                                  ) : (
                                    <><Send className="h-3.5 w-3.5 mr-1.5" /> Envoyer un code SMS</>
                                  )}
                                </Button>
                              ) : (
                                <div className="flex items-end gap-2">
                                  <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Code de vérification</Label>
                                    <Input
                                      value={phoneOtpCode}
                                      onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      placeholder="000000"
                                      className="font-mono text-center tracking-widest"
                                      maxLength={6}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleVerifyPhone}
                                    disabled={verifyingPhone || phoneOtpCode.length !== 6}
                                    size="sm"
                                    className="bg-[#00A651] hover:bg-[#008f47] text-white"
                                  >
                                    {verifyingPhone ? (
                                      <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /></>
                                    ) : (
                                      <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Vérifier</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* KYC Level */}
                  <Card className="border-[#003087]/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-[#D4AF37]/10 shrink-0">
                          <BadgeCheck className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <h3 className="font-medium">Niveau KYC</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Niveau actuel : <span className="font-medium text-[#003087]">{profile?.kycLevel || 0}</span> / 3
                          </p>
                          <div className="flex gap-1 mt-2">
                            {[0, 1, 2, 3].map((level) => (
                              <div
                                key={level}
                                className={`h-2 w-12 rounded-lg ${
                                  (profile?.kycLevel || 0) >= level ? 'bg-[#00A651]' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Augmentez votre niveau KYC pour débloquer plus de fonctionnalités
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ============ TAB 4: CONNECTED ACCOUNTS ============ */}
              {activeTab === 'connected' && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#003087]">Comptes connectés</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gérez vos comptes Google et Facebook liés</p>
                  </div>
                  <ConnectedAccounts userEmail={profile?.email || ''} />
                </motion.div>
              )}

              {/* ============ TAB 5: PREFERENCES ============ */}
              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#003087]">Préférences</h2>
                    <p className="text-sm text-muted-foreground mt-1">Personnalisez votre expérience</p>
                  </div>

                  <Card className="border-[#003087]/10">
                    <CardContent className="p-6 space-y-6">
                      {/* Language */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5" /> Langue
                        </Label>
                        <Select value={formLanguage} onValueChange={setFormLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une langue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">🇫🇷 Français</SelectItem>
                            <SelectItem value="en">🇬🇧 English</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Langue de l&apos;interface utilisateur
                        </p>
                      </div>

                      <Separator />

                      {/* Currency */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Coins className="h-3.5 w-3.5" /> Devise
                        </Label>
                        <Select value={formCurrency} onValueChange={setFormCurrency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une devise" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XOF">💶 FCFA (XOF)</SelectItem>
                            <SelectItem value="EUR">💶 Euro (EUR)</SelectItem>
                            <SelectItem value="USD">💵 Dollar US (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Devise affichée pour les prix et transactions
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={handleSavePreferences}
                          disabled={saving}
                          className="bg-[#003087] hover:bg-[#002266] text-white min-w-[140px]"
                        >
                          {saving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde...</>
                          ) : (
                            <><Save className="h-4 w-4 mr-2" /> Enregistrer</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ============ TAB 6: DELETE ACCOUNT ============ */}
              {activeTab === 'delete' && (
                <motion.div
                  key="delete"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-red-600">Supprimer le compte</h2>
                    <p className="text-sm text-muted-foreground mt-1">Cette action est irréversible</p>
                  </div>

                  <Card className="border-red-200 bg-red-50/30">
                    <CardContent className="p-6 space-y-5">
                      <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-red-700">Attention</h3>
                          <p className="text-sm text-red-600 mt-1">
                            La suppression de votre compte est permanente et irréversible. Toutes vos données,
                            propriétés, transactions et historique seront définitivement supprimés.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deletePassword" className="text-red-700">
                          Confirmez avec votre mot de passe
                        </Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Entrez votre mot de passe"
                          className="border-red-200 focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm" className="text-red-700">
                          Tapez <span className="font-mono font-bold bg-red-100 px-1.5 py-0.5 rounded">SUPPRIMER</span> pour confirmer
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="SUPPRIMER"
                          className="border-red-200 focus:border-red-500 font-mono"
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={!deletePassword || deleteConfirm !== 'SUPPRIMER'}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer définitivement mon compte
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Dernière confirmation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est
                              irréversible. Toutes vos données seront perdues.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleting}
                            >
                              {deleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Suppression...</>
                              ) : (
                                'Oui, supprimer mon compte'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
