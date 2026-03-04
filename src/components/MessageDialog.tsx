"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageDialogProps {
  otherUserId: string;
  otherUserName: string;
  trigger?: React.ReactNode;
}

const MessageDialog = ({ otherUserId, otherUserName, trigger }: MessageDialogProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (otherUserId && user) {
      console.log(`[Chat] Iniciando chat con: ${otherUserName} (${otherUserId})`);
      fetchMessages();
      
      const channel = supabase
        .channel(`chat:${user.id}:${otherUserId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages'
          },
          (payload) => {
            console.log("[Chat] Nuevo mensaje detectado en Realtime:", payload);
            // Solo añadir si el mensaje es para nosotros y viene de la persona correcta
            if (payload.new.receiver_id === user.id && payload.new.sender_id === otherUserId) {
              setMessages((prev) => [...prev, payload.new]);
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Chat] Estado de la suscripción Realtime: ${status}`);
        });

      return () => {
        console.log("[Chat] Cerrando canal de chat");
        supabase.removeChannel(channel);
      };
    }
  }, [otherUserId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("[Chat] Error al cargar mensajes:", error);
    } else {
      console.log(`[Chat] ${data?.length || 0} mensajes cargados`);
      setMessages(data || []);
    }
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage(''); 
    setSending(true);

    console.log("[Chat] Enviando mensaje...");
    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: content
    }).select().single();

    if (error) {
      console.error("[Chat] Error al enviar mensaje:", error);
      setNewMessage(content); // Devolvemos el texto al input si falla
    } else if (data) {
      console.log("[Chat] Mensaje enviado con éxito");
      setMessages((prev) => [...prev, data]);
    }
    setSending(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-full border-[#c17d60] text-[#c17d60] hover:bg-[#c17d60] hover:text-white">
            <MessageCircle className="w-4 h-4 mr-2" /> Mensajes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="bg-[#c17d60] p-6 text-white shrink-0">
          <DialogTitle className="flex items-center font-serif text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5" />
            </div>
            {otherUserName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-[#fdfaf6]">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#c17d60]" /></div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[80%] space-y-1",
                    msg.sender_id === user?.id ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm shadow-sm",
                    msg.sender_id === user?.id 
                      ? "bg-[#c17d60] text-white rounded-tr-none" 
                      : "bg-white text-[#4a3f35] border border-[#e8e1d5] rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-[#7a6f64] px-1">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-[#7a6f64] italic">
                No hay mensajes todavía. ¡Saluda!
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-[#e8e1d5] flex gap-2 shrink-0">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="rounded-full bg-[#fdfaf6] border-[#e8e1d5] focus:ring-[#c17d60]"
          />
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className="rounded-full bg-[#c17d60] hover:bg-[#a66a51] w-10 h-10 p-0 shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;