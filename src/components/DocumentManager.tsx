"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Trash2, Upload, Loader2, FileIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentManagerProps {
  patientId: string;
  isAdmin?: boolean;
}

const DocumentManager = ({ patientId, isAdmin = false }: DocumentManagerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) showError(error.message);
    else setDocuments(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${patientId}/${fileName}`;

    try {
      // 1. Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Registrar en la tabla
      const { error: dbError } = await supabase.from('documents').insert({
        patient_id: patientId,
        name: file.name,
        file_path: filePath
      });

      if (dbError) throw dbError;

      showSuccess("Documento subido correctamente");
      fetchDocuments();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
    } catch (error: any) {
      showError("Error al descargar: " + error.message);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return;

    try {
      await supabase.storage.from('patient-documents').remove([doc.file_path]);
      await supabase.from('documents').delete().eq('id', doc.id);
      showSuccess("Documento eliminado");
      fetchDocuments();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 border-b border-[#fdfaf6] flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-serif text-[#4a3f35] flex items-center">
          <FileText className="w-6 h-6 mr-3 text-[#c17d60]" /> Documentos Compartidos
        </CardTitle>
        {isAdmin && (
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-6">
              <label htmlFor="file-upload" className="cursor-pointer flex items-center">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir Documento
              </label>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-[#7a6f64] animate-pulse">Cargando documentos...</p>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-5 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] hover:border-[#c17d60]/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-xl border border-[#e8e1d5]">
                    <FileIcon className="w-5 h-5 text-[#c17d60]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#4a3f35]">{doc.name}</p>
                    <p className="text-xs text-[#7a6f64]">
                      {format(new Date(doc.created_at), 'PPP', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
                    <Download className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} className="text-[#7a6f64] hover:text-red-500 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-[#e8e1d5] rounded-[2rem]">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[#e8e1d5]" />
              <p className="text-[#7a6f64]">No hay documentos compartidos todavía.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentManager;