'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface OAuthStatus {
  google: { linked: boolean; linkedAt: string | null };
  facebook: { linked: boolean; linkedAt: string | null };
  hasPassword: boolean;
  canUnlink: boolean;
}

interface ConnectedAccountsProps {
  userEmail: string;
}

export default function ConnectedAccounts({ userEmail }: ConnectedAccountsProps) {
  const { toast } = useToast();
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Unlink dialog state
  const [unlinkProvider, setUnlinkProvider] = useState<'google' | 'facebook' | null>(null);
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    fetchOAuthStatus();
  }, []);

  const fetchOAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/oauth-status');
      if (res.ok) {
        const data = await res.json();
        setOauthStatus(data);
      }
    } catch (err) {
      console.error('Error fetching OAuth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkProvider) return;

    setUnlinking(true);
    try {
      const res = await fetch('/api/auth/oauth-unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: unlinkProvider, password: unlinkPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la dissociation');
      }

      toast({
        title: 'Succès',
        description: `Compte ${unlinkProvider === 'google' ? 'Google' : 'Facebook'} dissocié`,
      });
      setUnlinkProvider(null);
      setUnlinkPassword('');
      fetchOAuthStatus();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la dissociation',
        variant: 'destructive',
      });
    } finally {
      setUnlinking(false);
    }
  };

  const handleLink = (provider: 'google' | 'facebook') => {
    // Redirect to OAuth provider sign-in
    const callbackUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=${callbackUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#003087]" />
        <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  const providers = [
    {
      key: 'google' as const,
      name: 'Google',
      description: 'Connectez votre compte Google pour vous connecter facilement',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
      linked: oauthStatus?.google?.linked || false,
      linkedAt: oauthStatus?.google?.linkedAt,
    },
    {
      key: 'facebook' as const,
      name: 'Facebook',
      description: 'Connectez votre compte Facebook pour un accès rapide',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      linked: oauthStatus?.facebook?.linked || false,
      linkedAt: oauthStatus?.facebook?.linkedAt,
    },
  ];

  return (
    <div className="space-y-6">
      {providers.map((provider, index) => (
        <motion.div
          key={provider.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="border-[#003087]/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{provider.name}</p>
                      {provider.linked ? (
                        <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connecté
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Non connecté
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                    {provider.linked && provider.linkedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Connecté le {new Date(provider.linkedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {provider.linked && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Email associé : {userEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {provider.linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        if (oauthStatus?.canUnlink) {
                          setUnlinkProvider(provider.key);
                        } else {
                          toast({
                            title: 'Impossible de dissocier',
                            description: 'Vous devez avoir au moins un autre moyen de connexion.',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      Dissocier
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-[#003087] hover:bg-[#002266] text-white"
                      onClick={() => handleLink(provider.key)}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Connecter
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Unlink Confirmation Dialog */}
      <Dialog open={!!unlinkProvider} onOpenChange={(open) => { if (!open) { setUnlinkProvider(null); setUnlinkPassword(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Dissocier le compte {unlinkProvider === 'google' ? 'Google' : 'Facebook'}
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir dissocier votre compte {unlinkProvider === 'google' ? 'Google' : 'Facebook'} ?
              Vous ne pourrez plus vous connecter avec ce fournisseur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlinkPassword">Confirmez avec votre mot de passe</Label>
              <Input
                id="unlinkPassword"
                type="password"
                value={unlinkPassword}
                onChange={(e) => setUnlinkPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUnlinkProvider(null); setUnlinkPassword(''); }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={unlinking || !unlinkPassword}
            >
              {unlinking ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Dissociation...</>
              ) : (
                <><Unlink className="h-4 w-4 mr-2" /> Dissocier</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
