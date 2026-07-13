'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, KeyRound, FileText, Download, User, Building2, Calendar,
  Coins, Home, Loader2, Check, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminLeaseDetail } from '@/hooks/useAdminApi';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function AdminLeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: lease, isLoading } = useAdminLeaseDetail(id);

  const handleDownloadPdf = async () => {
    if (!lease) return;
    try {
      const token = localStorage.getItem('afribayit_access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/admin/leases/${lease.id}/contract-pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'PDF non disponible');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bail-${lease.leaseRef || lease.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erreur lors du téléchargement');
    }
  };

  if (isLoading) {
    return (<div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></div>);
  }
  if (!lease) {
    return (<div className="text-center py-24 text-gray-400"><KeyRound className="w-12 h-12 mx-auto mb-2" /><p>Bail non trouvé</p></div>);
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.push('/admin/leases')} className="text-sm text-gray-500 hover:text-[#003087] mb-3 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Retour à la liste
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2">
              <KeyRound className="w-6 h-6" />
              Bail {lease.leaseRef || lease.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Détails du bail et documents associés</p>
          </div>
          <Button onClick={handleDownloadPdf} className="bg-[#D4AF37] hover:bg-[#b8961f] text-white">
            <Download className="w-4 h-4 mr-2" />
            Télécharger le contrat PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tenant + Owner */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Locataire</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium text-[#0a2a5e]">{lease.tenant?.name}</span></div>
            <p className="text-xs text-gray-500">{lease.tenant?.email}</p>
            {lease.tenant?.phone && <p className="text-xs text-gray-500">{lease.tenant.phone}</p>}
            {lease.tenantSignedAt && (
              <div className="pt-2"><Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100"><Check className="w-3 h-3 mr-1" />Signé le {new Date(lease.tenantSignedAt).toLocaleDateString('fr-FR')}</Badge></div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Propriétaire</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium text-[#0a2a5e]">{lease.owner?.name}</span></div>
            <p className="text-xs text-gray-500">{lease.owner?.email}</p>
            {lease.owner?.phone && <p className="text-xs text-gray-500">{lease.owner.phone}</p>}
            {lease.ownerSignedAt && (
              <div className="pt-2"><Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100"><Check className="w-3 h-3 mr-1" />Signé le {new Date(lease.ownerSignedAt).toLocaleDateString('fr-FR')}</Badge></div>
            )}
          </CardContent>
        </Card>
        {/* Property */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Bien</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /><span className="font-medium text-[#0a2a5e]">{lease.property?.title}</span></div>
            <p className="text-xs text-gray-500">{lease.property?.quartier}, {lease.property?.city}</p>
            {lease.property?.address && <p className="text-xs text-gray-500">{lease.property.address}</p>}
            <div className="flex gap-3 pt-1 text-xs text-gray-600">
              <span>{lease.property?.surface} m²</span>
              <span>{lease.property?.bedrooms} ch.</span>
              <span>{lease.property?.bathrooms} sdb</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lease terms */}
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Conditions du bail</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase">Loyer mensuel</p>
              <p className="text-lg font-bold text-[#D4AF37]">{fmt(lease.monthlyRent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Dépôt de garantie</p>
              <p className="text-lg font-bold text-[#0a2a5e]">{fmt(lease.securityDeposit || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Durée</p>
              <p className="text-lg font-bold text-[#0a2a5e]">{lease.leaseTermMonths} mois</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Meublé</p>
              <p className="text-lg font-bold text-[#0a2a5e]">{lease.furnished ? 'Oui' : 'Non'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Charges comprises</p>
              <p className="text-lg font-bold text-[#0a2a5e]">{lease.chargesIncluded ? 'Oui' : 'Non'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date de début</p>
              <p className="text-sm font-medium text-[#0a2a5e]">{new Date(lease.startDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date de fin</p>
              <p className="text-sm font-medium text-[#0a2a5e]">{new Date(lease.endDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Pays</p>
              <p className="text-sm font-medium text-[#0a2a5e]">{lease.country}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Documents ({lease.documents?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {lease.documents?.length > 0 ? (
            <div className="space-y-2">
              {lease.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#003087]" />
                    <div>
                      <p className="text-sm font-medium text-[#0a2a5e]">{doc.documentType}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.tenantSigned && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Locataire ✓</Badge>}
                    {doc.ownerSigned && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Propriétaire ✓</Badge>}
                    <Button size="sm" variant="outline" className="h-7 text-xs">Voir</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucun document</p></div>
          )}
        </CardContent>
      </Card>

      {/* Rent payments */}
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Paiements de loyer ({lease.rentPayments?.length || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {lease.rentPayments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Mois</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-700">Montant</th>
                    <th className="text-center px-4 py-2 font-semibold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lease.rentPayments.slice(0, 12).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">{fmt(p.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant={p.status === 'PAID' ? 'default' : p.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                               className={p.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                          {p.status === 'PAID' ? 'Payé' : p.status === 'OVERDUE' ? 'En retard' : p.status === 'PENDING' ? 'À venir' : p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400"><Coins className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucun paiement enregistré</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
