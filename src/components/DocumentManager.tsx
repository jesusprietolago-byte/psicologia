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
    const fileExt = file.name.split('.').pop();
    // Usamos una estructura de carpetas: patientId/timestamp-nombre
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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

      showSuccess("Documento compartido con éxito");
      fetchDocuments();
    } catch (error: any) {
      showError("Error al subir: " + error.message);
    } finally {
      setUploading(false);
      // Limpiar el input
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
      // 1. Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // 2. Eliminar de la tabla
      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);

      if (dbError) throw dbError;

      showSuccess("Documento eliminado correctamente");
      fetchDocuments();
    } catch (error: any) {
      showError("Error al eliminar: " + error.message);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 border-b border-[#fdfaf6] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#c17d60]/10 rounded-2xl flex items-center justify-center mr-4">
            <FileText className="w-6 h-6 text-[#c17d60]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif text-[#4a3f35]">Documentos</CardTitle>
            <p className="text-sm text-[#7a6f64]">Espacio privado y seguro</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} className="w-full sm:w-auto bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8 h-12 shadow-lg shadow-[#c17d60]/20">
              <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir Archivo
              </label>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#c17d60]" />
              <p className="text-[#7a6f64] font-medium">Cargando archivos...</p>
            </div>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="group flex items-center justify-between p-5 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] hover:border-[#c17d60]/30 transition-all hover:shadow-md">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-xl border border-[#e8e1d5] shadow-sm group-hover:scale-110 transition-transform">
                    <FileIcon className="w-6 h-6 text-[#c17d60]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#4a3f35] text-lg">{doc.name}</p>
                    <p className="text-xs text-[#7a6f64] flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(doc.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDownload(doc)} 
                    className="h-11 w-11 text-[#7a6f64] hover:text-[#c17d60] hover:bg-white rounded-full shadow-sm"
                    title="Descargar"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc)} 
                      className="h-11 w-11 text-[#7a6f64] hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-[#e8e1d5] rounded-[3rem] bg-[#fdfaf6]/30">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FileText className="w-10 h-10 text-[#e8e1d5]" />
              </div>
              <h3 className="text-xl font-serif text-[#4a3f35]">No hay documentos todavía</h3>
              <p className="text-[#7a6f64] mt-2 max-w-xs mx-auto">
                {isAdmin 
                  ? "Sube el primer archivo para compartirlo con el paciente de forma segura." 
                  : "Laura compartirá contigo aquí los documentos relevantes de tu proceso."}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Este espacio cumple con la normativa de protección de datos. Los archivos están encriptados y solo son accesibles por ti y tu psicóloga.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentManager;