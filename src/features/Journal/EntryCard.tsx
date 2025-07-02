import { Link } from 'react-router-dom';
import { deleteEntry } from '../../services/firestoreService.ts';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { JournalEntry } from '../../types';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

function AdvisorResponse({ title, color, response, status }: { title: string; color: string; response?: string; status?: 'completed' | 'error' }) {
  if (!response) {
    return null;
  }

  const borderColor = `border-${color}-200`;
  const bgColor = `bg-${color}-50`;
  const textColor = `text-${color}-800`;
  const titleColor = `text-${color}-600`;

  return (
    <div className="p-4 border border-slate-300 rounded-lg bg-white">
      {/* The bolded title */}
      <h4 className="font-bold ">{title}</h4>
      
      {/* The response text, with styling for the error state */}
      <p className={`mt-1 whitespace-pre-wrap ${status === 'error' ? 'italic text-red-600' : ''}`}>
        {status === 'error' ? `Error generating feedback.` : response}
      </p>
    </div>
  );
}



export default function EntryCard({ entry }) {
  const { feedback } = entry;
  const { user } = useAuthStore(); //  Get the current user from the store

  // CHANGED: Format to show the time of the entry
  const formattedTime = new Date(entry.createdAt.toDate()).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  //  Handler for the delete action
  const handleDelete = async () => {
    // A simple confirmation dialog is good practice for destructive actions.
    const isConfirmed = window.confirm("Are you sure you want to delete this entry? This action cannot be undone.");

    if (isConfirmed && user) {
      try {
        await deleteEntry(user.uid, entry.id);
        // No need to update local state! The real-time listener will do it for us.
      } catch (error) {
        console.error("Failed to delete entry:", error);
        alert("There was an error deleting the entry. Please try again.");
      }
    }
  };

  return (
    <article className="bg-white p-4 sm:p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
      <header className="flex justify-between items-center"> {/* CHANGED: Use flexbox for alignment */}
        <p className="text-sm font-semibold text-slate-500">{formattedTime}</p>

        {/*  Delete Button */}
        <button
          onClick={handleDelete}
          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          aria-label="Delete entry"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      <p className="text-slate-800 mt-4 whitespace-pre-wrap text-lg leading-relaxed">
        {entry.entryText}
      </p>

      {feedback && (
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
          <AdvisorResponse
            title="Hudson's Reflection (Introspective)"
            color="sky"
            response={feedback.hudson?.response}
            status={feedback.hudson?.status}
          />
          <AdvisorResponse
            title="Plitt's Take (Tough Love)"
            color="red"
            response={feedback.plitt?.response}
            status={feedback.plitt?.status}
          />
          <AdvisorResponse
            title="Your 85-Year-Old Self's Wisdom"
            color="amber"
            response={feedback.self?.response}
            status={feedback.self?.status}
          />
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-slate-100 text-right">
        <Link 
          to={`/journal/entry/${entry.id}/summit`}
          className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          <span>Convene the Advisors</span>
        </Link>
      </div>
    </article>
  );
}