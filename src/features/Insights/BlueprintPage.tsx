import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { getAttributesStream, deleteAttribute } from '../../services/firestoreService.ts';
import { UserAttribute } from '../../types';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

// A sub-component for displaying a single attribute card
const AttributeCard = ({ attribute, onDelete }: { attribute: UserAttribute; onDelete: (id: string) => void }) => {
  const formattedDate = new Date(attribute.createdAt.toDate()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove this attribute?\n\n"${attribute.text}"`)) {
      onDelete(attribute.id);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-start justify-between space-x-4">
      <div>
        <p className="text-slate-800">{attribute.text}</p>
        <p className="text-xs text-slate-400 mt-2">First noticed on: {formattedDate}</p>
      </div>
      <button
        onClick={handleDelete}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
        aria-label="Delete attribute"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default function BlueprintPage() {
  const { user } = useAuthStore();
  const [attributes, setAttributes] = useState<UserAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
        setIsLoading(false); // Failsafe: don't get stuck
    }, 5000); // 5 seconds fallback

    const unsubscribe = getAttributesStream(user.uid, (fetchedAttributes) => {
        clearTimeout(timeout);
        setAttributes(fetchedAttributes);
        setIsLoading(false);
    });

    return () => {
        clearTimeout(timeout);
        unsubscribe();
    };
  }, [user]);

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!user) return;
    try {
      await deleteAttribute(user.uid, attributeId);
      // The real-time listener will automatically update the UI
    } catch (error) {
      console.error("Failed to delete attribute:", error);
      alert("Could not delete attribute. Please try again.");
    }
  };

  return (
    <div>
      <Link to="/insights" className="inline-flex items-center space-x-2 text-blue-600 hover:underline mb-6">
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to Insights</span>
      </Link>

      <h1 className="text-3xl font-bold text-slate-800">Your Personal Blueprint</h1>
      <p className="text-slate-600 mt-2 mb-8">
        This is a list of traits and patterns the AI has identified from your entries. You can remove any you feel are inaccurate.
      </p>

      {isLoading ? (
        <p className="text-slate-500 text-center py-8">Loading your blueprint...</p>
      ) : attributes.length > 0 ? (
        <div className="space-y-4">
          {attributes.map(attr => (
            <AttributeCard key={attr.id} attribute={attr} onDelete={handleDeleteAttribute} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-slate-700">Your Blueprint is Currently Blank</h2>
          <p className="text-slate-500 mt-2">As you write more journal entries, the AI will begin to identify patterns and they will appear here.</p>
        </div>
      )}
    </div>
  );
}