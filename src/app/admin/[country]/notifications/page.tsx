'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell, Send, Search, Loader2, ChevronLeft, ChevronRight,
  MessageSquare, Mail, Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  channel: string;
  target: string;
  sentAt: string;
  status: string;
  recipients: number;
}

interface NotificationsResponse {
  notifications: NotificationRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const channelLabels: Record<string, string> = {
  push: 'Push', email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp',
};
const channelIcons: Record<string, React.ElementType> = {
  push: Bell, email: Mail, sms: Smartphone, whatsapp: MessageSquare,
};
const channelColors: Record<string, string> = {
  push: 'bg-blue-50 text-blue-700', email: 'bg-green-50 text-green-700',
  sms: 'bg-purple-50 text-purple-700', whatsapp: 'bg-emerald-50 text-emerald-700',
};

export default function CountryNotificationsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Send form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('push');
  const [target, setTarget] = useState('all');

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['admin-notifications', country, page],
    queryFn: () => apiFetch(`/api/admin/notifications?country=${country}&page=${page}&limit=${LIMIT}`),
    enabled: tab === 'history',
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  const sendMutation = useMutation({
    mutationFn: async () => {
      return apiPost('/api/admin/notifications', {
        title,
        message,
        channel,
        target,
        country,
      });
    },
    onSuccess: () => {
      toast.success('Notification envoyée avec succès');
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications', country] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la notification");
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Le titre et le message sont requis');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#003087]" />
            Notifications — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Envoyer et consulter les notifications du {COUNTRY_NAMES[country]}
          </p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'send' ? 'default' : 'outline'}
          onClick={() => setTab('send')}
          className={tab === 'send' ? 'bg-[#003087] text-white' : ''}
        >
          <Send className="w-4 h-4 mr-2" /> Envoyer
        </Button>
        <Button
          variant={tab === 'history' ? 'default' : 'outline'}
          onClick={() => setTab('history')}
          className={tab === 'history' ? 'bg-[#D4AF37] text-white' : ''}
        >
          <Bell className="w-4 h-4 mr-2" /> Historique
        </Button>
      </div>

      {tab === 'send' ? (
        <Card className="rounded-2xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-[#003087]" />
              Envoyer une notification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="bg-[#003087]/5 rounded-xl p-4">
              <p className="text-sm text-[#003087] font-medium">
                {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
              </p>
              <p className="text-xs text-gray-500">Pays : {country}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Canal</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['push', 'email', 'sms', 'whatsapp'] as const).map((ch) => {
                  const Icon = channelIcons[ch];
                  return (
                    <Button
                      key={ch}
                      variant={channel === ch ? 'default' : 'outline'}
                      onClick={() => setChannel(ch)}
                      className={channel === ch ? 'bg-[#003087] text-white' : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" /> {channelLabels[ch]}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cible</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Sélectionner la cible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="buyers">Acheteurs</SelectItem>
                  <SelectItem value="sellers">Vendeurs</SelectItem>
                  <SelectItem value="agents">Agents</SelectItem>
                  <SelectItem value="artisans">Artisans</SelectItem>
                  <SelectItem value="hoteliers">Hôteliers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Titre</label>
              <Input
                placeholder="Titre de la notification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
              <Textarea
                placeholder="Contenu de la notification..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSend}
              className="w-full sm:w-auto bg-[#003087] hover:bg-[#002A70] text-white rounded-xl h-11 px-8"
              disabled={sendMutation.isPending || !title.trim() || !message.trim()}
            >
              {sendMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Envoyer la notification</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-600">Titre</th>
                      <th className="text-left p-4 font-medium text-gray-600">Canal</th>
                      <th className="text-left p-4 font-medium text-gray-600">Cible</th>
                      <th className="text-left p-4 font-medium text-gray-600">Destinataires</th>
                      <th className="text-left p-4 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : notifications.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune notification envoyée</td></tr>
                    ) : (
                      notifications.map((n) => {
                        const Icon = channelIcons[n.channel] || Bell;
                        return (
                          <tr key={n.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div>
                                <span className="font-medium text-gray-900 block">{n.title}</span>
                                <span className="text-xs text-gray-500 line-clamp-1">{n.message}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={`${channelColors[n.channel] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                                <Icon className="w-3 h-3 mr-1" /> {channelLabels[n.channel] || n.channel}
                              </Badge>
                            </td>
                            <td className="p-4 text-gray-600 capitalize">{n.target}</td>
                            <td className="p-4 text-gray-900 font-medium">{n.recipients}</td>
                            <td className="p-4 text-gray-500 text-xs">{new Date(n.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {(pagination.page - 1) * LIMIT + 1}–{Math.min(pagination.page * LIMIT, pagination.total)} sur {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
