"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Trash2, Upload, Loader2, FileIcon, ShieldAlert, Clock } from 'lucide-react';
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
    if (patientId) {
      fetchDocuments();
    }
  }, [patientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching docs:", error);
      showError("No se pudieron cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `${patientId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documents').insert({
        patient_id: patientId,
        name: file.name,
        file_path: filePath
      });

      if (dbError) throw dbError;

      showSuccess("Documento compartido con éxito");
      fetchDocuments();
    } catch (error: any) {
      showError("Error al subir: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      showError("Error al descargar: " + error.message);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`¿Estás seguro de eliminar "${doc.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);

      if (dbError) throw dbError;

      showSuccess("Documento eliminado correctamente");
      fetchDocuments();
    } catch (error: any) {
      showError("Error al eliminar: " + error.message);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden w-full">
      <CardHeader className="p-6 md:p-8 border-b border-[#fdfaf6] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#c17d60]/10 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#c17d60]" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">Documentos</CardTitle>
            <p className="text-sm text-[#7a6f64] truncate">Espacio privado y seguro</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="relative w-full lg:w-auto shrink-0">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} className="w-full lg:w-auto bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-6 h-11 shadow-lg shadow-[#c17d60]/20">
              <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir Archivo
              </label>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#c17d60]" />
              <p className="text-[#7a6f64] font-medium">Cargando archivos...</p>
            </div>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="group flex items-center justify-between p-4 md:p-5 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] hover:border-[#c17d60]/30 transition-all hover:shadow-md min-w-0">
                <div className="flex items-center space-x-4 min-w-0 flex-1 mr-2">
                  <div className="p-2 md:p-3 bg-white rounded-xl border border-[#e8e1d5] shadow-sm shrink-0">
                    <FileIcon className="w-5 h-5 md:w-6 md:h-6 text-[#c17d60]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#4a3f35] text-base md:text-lg truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-[#7a6f64] flex items-center">
                      <Clock className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{format(new Date(doc.created_at), "d 'de' MMM, yyyy", { locale: es })}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDownload(doc)} 
                    className="h-9 w-9 md:h-11 md:w-11 text-[#7a6f64] hover:text-[#c17d60] hover:bg-white rounded-full"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc)} 
                      className="h-9 w-9 md:h-11 md:w-11 text-[#7a6f64] hover:text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 md:py-16 border-2 border-dashed border-[#e8e1d5] rounded-[2.5rem] bg-[#fdfaf6]/30">
              <FileText className="w-10 h-10 text-[#e8e1d5] mx-auto mb-4" />
              <h3 className="text-lg font-serif text-[#4a3f35]">No hay documentos</h3>
            </div>
          )}
        </div>
        
        <div className="mt-6 md:mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-[10px] md:text-xs text-blue-700 leading-relaxed">
            Espacio seguro y encriptado conforme a la normativa de protección de datos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentManager;