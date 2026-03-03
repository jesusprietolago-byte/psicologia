"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentManager from '@/components/DocumentManager';

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

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
          <div className="w-12 h-12 bg-[#c17d60]/10 rounded-2xl flex items-center justify-center">
            <Leaf className="text-[#c17d60] w-6 h-6" />
          </div>
          <h1 className="text-4xl font-serif text-[#4a3f35]">Mis Documentos</h1>
        </div>
        
        <DocumentManager patientId={user.id} isAdmin={false} />
      </div>
    </div>
  );
};

export default Documents;