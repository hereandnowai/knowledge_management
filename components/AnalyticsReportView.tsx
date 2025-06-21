
import React, { useMemo } from 'react';
import { Document, DocumentType } from '../types';
import { ChartBarIcon, DocumentIcon, BookmarkIcon, TagIcon, ClockIcon, SparklesIcon, CogIcon } from '../constants';

interface AnalyticsReportViewProps {
  documents: Document[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        <span className="text-hnai-teal-500 dark:text-hnai-teal-400">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
    {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{description}</p>}
  </div>
);

const AnalyticsReportView: React.FC<AnalyticsReportViewProps> = ({ documents }) => {
  const analyticsData = useMemo(() => {
    const totalDocuments = documents.length;
    const totalBookmarks = documents.filter(doc => doc.isFavorite).length;
    
    const documentTypesCount = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    const allTags = documents.flatMap(doc => doc.tags);
    const uniqueTagsCount = new Set(allTags).size;
    
    const tagFrequencies = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTags = Object.entries(tagFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAddedCount = documents.filter(doc => new Date(doc.uploadedAt) > sevenDaysAgo).length;
    const recentDocuments = documents
        .sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0,5);

    return {
      totalDocuments,
      totalBookmarks,
      documentTypesCount,
      uniqueTagsCount,
      popularTags,
      recentlyAddedCount,
      recentDocuments,
    };
  }, [documents]);

  const documentTypeColors: Record<DocumentType, string> = {
    [DocumentType.PDF]: "bg-red-500",
    [DocumentType.WORD]: "bg-blue-500",
    [DocumentType.EXCEL]: "bg-green-500",
    [DocumentType.TEXT]: "bg-yellow-500",
    [DocumentType.URL]: "bg-indigo-500",
    [DocumentType.YOUTUBE_LINK]: "bg-pink-500",
    [DocumentType.UNKNOWN]: "bg-slate-500",
  };
  
  // Ensure all values for maxDocTypeCount calculation are numbers
  const documentTypeCountValues = Object.values(analyticsData.documentTypesCount).map(val => typeof val === 'number' ? val : 0);
  const maxDocTypeCount = Math.max(0, ...documentTypeCountValues);


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50 min-h-full">
      <div className="flex items-center space-x-3 mb-6">
        <ChartBarIcon className="w-8 h-8 text-hnai-teal-600 dark:text-hnai-teal-400" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Documents" value={analyticsData.totalDocuments} icon={<DocumentIcon className="w-7 h-7" />} />
        <StatCard title="Total Bookmarks" value={analyticsData.totalBookmarks} icon={<BookmarkIcon className="w-7 h-7" />} />
        <StatCard title="Unique Tags" value={analyticsData.uniqueTagsCount} icon={<TagIcon className="w-7 h-7" />} />
        <StatCard title="Added This Week" value={analyticsData.recentlyAddedCount} icon={<ClockIcon className="w-7 h-7" />} description="Documents added in last 7 days"/>
      </div>

      {/* Document Overview & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Types Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Document Distribution by Type</h2>
          {Object.keys(analyticsData.documentTypesCount).length > 0 ? (
            <div className="space-y-3">
              {(Object.entries(analyticsData.documentTypesCount) as [DocumentType, number][])
                .sort(([,a], [,b]) => b - a) // Sort by count desc
                .map(([type, count]) => (
                <div key={type} className="flex items-center">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400 capitalize">{type.replace(/_/g, " ")}</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-5 mr-2">
                    <div
                      className={`${documentTypeColors[type] || 'bg-slate-400'} h-5 rounded-full text-xs text-white flex items-center justify-end pr-2`}
                      style={{ width: maxDocTypeCount > 0 ? `${(count / maxDocTypeCount) * 100}%` : '0%' }}
                      title={`${count} document${count === 1 ? '' : 's'}`}
                    >
                     {count > 0 && <span className="opacity-80">{count}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No document type data available.</p>
          )}
        </div>

        {/* Popular Tags */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Top 5 Popular Tags</h2>
          {analyticsData.popularTags.length > 0 ? (
            <ul className="space-y-2">
              {analyticsData.popularTags.map(({ tag, count }) => (
                <li key={tag} className="flex justify-between items-center text-sm">
                  <span className="bg-hnai-teal-100 dark:bg-hnai-teal-800 text-hnai-teal-700 dark:text-hnai-teal-200 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{count} uses</span>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-slate-500 dark:text-slate-400">No tag data available.</p>
          )}
        </div>
      </div>
      
      {/* Recent Activity Section */}
       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Recently Added Documents</h2>
        {analyticsData.recentDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Uploaded On</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.recentDocuments.map(doc => (
                  <tr key={doc.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{doc.name}</td>
                    <td className="px-4 py-3">{doc.type}</td>
                    <td className="px-4 py-3">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No recent documents to display.</p>
        )}
      </div>


      {/* Placeholders for Future Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
          <SparklesIcon className="w-12 h-12 text-hnai-gold-500 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Search Query Insights</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Top searches, zero-result queries, AI interaction analysis. (Coming Soon)</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
          <CogIcon className="w-12 h-12 text-hnai-gold-500 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">User Engagement Metrics</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Document views, contribution patterns, content lifecycle. (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportView;
