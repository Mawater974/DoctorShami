
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { messagingService } from '../services/supabase';
import { Conversation, Message } from '../types';
import { Card, Button, Spinner, Input } from '../components/UiComponents';
import { Send, User, MessageSquare, ArrowLeft } from 'lucide-react';

export const Messages: React.FC = () => {
  const { lang, user } = useStore();
  const t = (key: string) => TRANSLATIONS[key] ? TRANSLATIONS[key][lang] : key;
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('cid');

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Conversations List
  useEffect(() => {
    if (!user) return;
    const fetchList = async () => {
        try {
            const data = await messagingService.getConversations(user.id);
            setConversations(data);
            setLoadingList(false);
        } catch (e) {
            console.error(e);
            setLoadingList(false);
        }
    };
    fetchList();
    
    // Simple Polling for new conversations/updates every 10s
    const interval = setInterval(fetchList, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Load Messages for Active Conversation
  useEffect(() => {
    if (!activeConvId) return;
    const fetchMsgs = async () => {
        setLoadingMsgs(true);
        try {
            const data = await messagingService.getMessages(activeConvId);
            setMessages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMsgs(false);
        }
    };
    fetchMsgs();

    // Poll messages every 3s
    const interval = setInterval(async () => {
        const data = await messagingService.getMessages(activeConvId);
        setMessages(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConvId || !newMessage.trim()) return;
    setSending(true);
    try {
        await messagingService.sendMessage(activeConvId, user.id, newMessage);
        setNewMessage('');
        // Optimistic refresh
        const data = await messagingService.getMessages(activeConvId);
        setMessages(data);
    } catch (e) {
        console.error(e);
        alert(lang === 'en' ? 'Failed to send message' : 'فشل إرسال الرسالة');
    } finally {
        setSending(false);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        
        {/* Left: Conversation List */}
        <Card className={`h-full flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b dark:border-gray-800">
                <h2 className="text-xl font-bold">{lang === 'en' ? 'Messages' : 'الرسائل'}</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loadingList ? (
                    <div className="p-8 text-center"><Spinner /></div>
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>{lang === 'en' ? 'No conversations yet' : 'لا توجد محادثات'}</p>
                    </div>
                ) : (
                    <div className="divide-y dark:divide-gray-800">
                        {conversations.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setActiveConvId(c.id)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${activeConvId === c.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {c.other_user?.avatar_url ? (
                                            <img src={c.other_user.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-sm truncate">{c.other_user?.full_name || 'User'}</h3>
                                            <span className="text-xs text-gray-400">
                                                {new Date(c.last_message_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {c.last_message_preview || (lang === 'en' ? 'No messages' : 'لا توجد رسائل')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>

        {/* Right: Chat Window */}
        <Card className={`md:col-span-2 h-full flex flex-col ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
            {!activeConvId ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                    <p>{lang === 'en' ? 'Select a conversation to start chatting' : 'اختر محادثة للبدء'}</p>
                </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="p-4 border-b dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-gray-950">
                        <button onClick={() => setActiveConvId(null)} className="md:hidden p-1 -ml-1">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {activeConversation?.other_user?.avatar_url ? (
                                <img src={activeConversation.other_user.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold">{activeConversation?.other_user?.full_name || 'User'}</h3>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-950">
                        {loadingMsgs ? (
                            <div className="flex justify-center p-4"><Spinner /></div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">
                                {lang === 'en' ? 'Start the conversation...' : 'ابدأ المحادثة...'}
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                                            isMe 
                                                ? 'bg-primary-600 text-white rounded-tr-none' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                                        }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-end ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex gap-2">
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={lang === 'en' ? "Type a message..." : "اكتب رسالة..."}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()} className="rounded-xl px-4">
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </>
            )}
        </Card>
      </div>
    </div>
  );
};
