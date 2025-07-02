import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

export default function InsightsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">AI Insights</h1>

      <div className="space-y-6">
        {/*  Blueprint Card */}
        <Link to="/insights/blueprint" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">🧠 Explore Your Personal Blueprint</h2>
              <p className="text-slate-600 mt-1">View and manage the traits the AI has learned about you.</p>
            </div>
            <ChevronRightIcon className="h-6 w-6 text-slate-400" />
          </div>
        </Link>
        
        {/* Placeholder for future insights */}
        <div className="p-8 bg-white rounded-lg shadow text-center text-slate-500">
          <p>Weekly Synthesis and other AI-generated reports will appear here soon.</p>
        </div>
      </div>
    </div>
  );
}