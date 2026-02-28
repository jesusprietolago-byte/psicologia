"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Invoices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setInvoices(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        <h1 className="text-2xl font-light text-slate-800 mb-6">Mis Facturas</h1>
        
        <div className="space-y-4">
          {invoices.map((inv) => (
            <Card key={inv.id} className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg font-medium">
                  <span>Factura {inv.invoice_number}</span>
                  <span className="text-sm font-normal text-slate-500">
                    {format(new Date(inv.created_at), 'PPP', { locale: es })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-slate-800">{inv.amount}€</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Servicios Sanitarios Exentos de IVA</p>
                  </div>
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                    <Download className="w-4 h-4 mr-2" /> Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && invoices.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-medium text-slate-400">No tienes facturas todavía</h3>
              <p className="text-slate-300 text-sm">Las facturas se generarán automáticamente tras tus sesiones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;