// --- File: \src\features\Journal\SummitPage.tsx ---
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { useSettingsStore } from '../../store/useSettingsStore.ts';
import { getEntry, getSummitStream, addSummitTurns } from '../../services/firestoreService.ts';
import { generateSummitResponse } from '../../services/llmService.ts';
import { JournalEntry, SummitMessage } from '../../types/index.ts';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';


const getAuthorStyle = (author: SummitMessage['author']) => {
  switch (author) {
    case 'user':
      return 'bg-blue-500 text-white self-end';
    case 'plitt':
      return 'bg-red-100 text-red-900 self-start';
    case 'hudson':
      return 'bg-sky-100 text-sky-900 self-start';
    case 'self':
      return 'bg-amber-100 text-amber-900 self-start';
    default:
      return 'bg-slate-200 text-slate-800 self-start';
  }
};


export default function SummitPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const { user } = useAuthStore();
  const { apiKey, primaryModel } = useSettingsStore();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [messages, setMessages] = useState<SummitMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !entryId) return;

    getEntry(user.uid, entryId).then(setEntry);
    
    const unsubscribe = getSummitStream(user.uid, entryId, setMessages);
    console.log(messages)
    return () => unsubscribe();
  }, [user, entryId]);
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !user || !entryId || !entry) return;

    const userMessage = { author: 'user' as const, text: inputText.trim() };
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      // 1. Add user's message
      await addSummitTurns(user.uid, entryId, userMessage);
      
      const currentTranscript = [...messages, { ...userMessage, id: 'temp', createdAt: new Date() } as any];

      // 2. Get the structured JSON array from the AI
      const advisorResponses = await generateSummitResponse(entry, currentTranscript, apiKey, primaryModel);
      
      // 3. Convert the entire array of advisor responses into a single JSON string.
      const turnsAsJsonString = JSON.stringify(advisorResponses);

      // 4. Save this single string as one message from the "advisors" author.
      const advisorTurn = { author: 'advisors' as const, text: turnsAsJsonString };
      await addSummitTurns(user.uid, entryId, advisorTurn);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!entry) {
    return <div className="p-8 text-center">Loading Entry...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <Link to={`/journal`} className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:underline mb-2">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Journal</span>
        </Link>
        <p className="text-sm text-slate-600 italic line-clamp-2">
          Discussing your entry from {new Date(entry.createdAt.toDate()).toLocaleDateString()}: "{entry.entryText}"
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          // This block correctly handles your NEW data format
          if (msg.author === 'advisors') {
            try {
              const advisorTurns: Array<{ advisor: 'hudson' | 'plitt' | 'self', text: string }> = JSON.parse(msg.text);

              return (
                <div key={msg.id} className="space-y-4">
                  {advisorTurns.map((turn, index) => (
                    <div key={`${msg.id}-${index}`} className="flex flex-col items-start">
                      <div className={`px-4 py-2 rounded-xl max-w-lg ${getAuthorStyle(turn.advisor)}`}>
                        <p className="text-sm">{turn.text}</p>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 capitalize">{turn.advisor}</span>
                    </div>
                  ))}
                </div>
              );
            } catch (e) {
              console.error("Failed to parse advisor message JSON:", e);
              return <div key={msg.id} className="text-red-500">Error displaying advisor response.</div>;
            }
          }

          const isUserMessage = msg.author === 'user';
          const alignmentClass = isUserMessage ? 'items-end' : 'items-start';

          return (
            <div key={msg.id} className={`flex flex-col ${alignmentClass}`}>
              <div className={`px-4 py-2 rounded-xl max-w-lg ${getAuthorStyle(msg.author)}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
              <span className="text-xs text-slate-400 mt-1 capitalize">{msg.author}</span>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 bg-white">
        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isLoading ? "Advisors are thinking..." : "Ask a follow-up..."}
            disabled={isLoading}
            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={isLoading || !inputText.trim()} className="p-3 bg-blue-600 text-white rounded-lg disabled:bg-slate-400">
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}