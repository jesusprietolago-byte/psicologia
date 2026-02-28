"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ArrowLeft, Leaf } from 'lucide-react';
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')} 
          className="mb-8 text-[#7a6f64] hover:text-[#c17d60] hover:bg-white/50 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
        </Button>

        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-[#b5b891]/20 rounded-2xl flex items-center justify-center">
            <FileText className="text-[#6b6e4d] w-6 h-6" />
          </div>
          <h1 className="text-4xl font-serif text-[#4a3f35]">Mis Facturas</h1>
        </div>
        
        <div className="space-y-6">
          {invoices.map((inv) => (
            <Card key={inv.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all">
              <CardHeader className="pb-2 pt-8 px-8">
                <CardTitle className="flex items-center justify-between text-2xl font-serif text-[#4a3f35]">
                  <span>Factura {inv.invoice_number}</span>
                  <span className="text-sm font-sans font-normal text-[#7a6f64] bg-[#fdfaf6] px-4 py-1 rounded-full border border-[#e8e1d5]">
                    {format(new Date(inv.created_at), 'PPP', { locale: es })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <p className="text-4xl font-serif font-semibold text-[#4a3f35]">{inv.amount}€</p>
                    <p className="text-xs text-[#7a6f64] uppercase tracking-widest font-bold">Servicios Sanitarios Exentos de IVA</p>
                  </div>
                  <Button variant="outline" className="border-[#e8e1d5] text-[#4a3f35] hover:bg-[#fdfaf6] hover:border-[#c17d60] rounded-full px-8 h-12">
                    <Download className="w-4 h-4 mr-3" /> Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && invoices.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
              <Leaf className="w-16 h-16 mx-auto mb-6 text-[#e8e1d5]" />
              <h3 className="text-2xl font-serif text-[#7a6f64]">No tienes facturas todavía</h3>
              <p className="text-[#7a6f64] mt-2">Las facturas se generarán automáticamente tras tus sesiones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;