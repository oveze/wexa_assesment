
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '../components/Layout';

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  triaged: 'bg-blue-100 text-blue-800 border-blue-200',
  waiting_human: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const categoryColors = {
  billing: 'bg-purple-100 text-purple-800',
  tech: 'bg-red-100 text-red-800',
  shipping: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, hasRole } = useAuthStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const [ticketRes, auditRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/audit/tickets/${id}`).catch(() => ({ data: [] })) // Fallback if audit endpoint not available
      ]);

      setTicket(ticketRes.data);
      setAuditLogs(auditRes.data);

      // Fetch agent suggestion if available
      if (ticketRes.data.agentSuggestionId) {
        try {
          const suggestionRes = await api.get(`/agent/suggestion/${id}`);
          setSuggestion(suggestionRes.data);
        } catch (err) {
          console.log('No suggestion available');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const onReplySubmit = async (data) => {
    setReplyLoading(true);
    try {
      await api.post(`/tickets/${id}/reply`, data);
      reset();
      fetchTicketDetails(); // Refresh ticket data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !ticket) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{ticket?.title}</h1>
          <div className="mt-2 flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${statusColors[ticket?.status]}`}>
              {ticket?.status?.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[ticket?.category]}`}>
              {ticket?.category}
            </span>
            <span className="text-sm text-gray-500">
              Created by {ticket?.createdBy?.name} on {formatDate(ticket?.createdAt)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Ticket */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Original Request</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket?.description}</p>
                {ticket?.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                    <ul className="space-y-1">
                      {ticket.attachmentUrls.map((url, index) => (
                        <li key={index}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestion */}
            {suggestion && (
              <div className="bg-blue-50 rounded-lg border border-blue-200">
                <div className="px-6 py-4 border-b border-blue-200">
                  <h2 className="text-lg font-medium text-blue-900">AI Assistant Suggestion</h2>
                  <div className="mt-1 flex items-center space-x-4 text-sm">
                    <span className="text-blue-700">
                      Predicted Category: <strong>{suggestion.predictedCategory}</strong>
                    </span>
                    <span className="text-blue-700">
                      Confidence: <strong>{Math.round(suggestion.confidence * 100)}%</strong>
                    </span>
                    {suggestion.autoClosed && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Auto-resolved
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{suggestion.draftReply}</p>
                  {suggestion.articleIds && suggestion.articleIds.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Referenced Articles:</h4>
                      <ul className="space-y-1">
                        {suggestion.articleIds.map((article, index) => (
                          <li key={index} className="text-sm text-blue-600">
                            {article.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conversation */}
            {ticket?.replies && ticket.replies.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Conversation</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {ticket.replies.map((reply, index) => (
                    <div key={index} className={`p-4 rounded-lg ${reply.isAgent ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">
                          {reply.author?.name || 'System'} 
                          {reply.isAgent && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Agent</span>}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Form (for agents) */}
            {hasRole(['agent', 'admin']) && ticket?.status !== 'closed' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Send Reply</h2>
                </div>
                <form onSubmit={handleSubmit(onReplySubmit)} className="px-6 py-4">
                  <div>
                    <textarea
                      {...register('content', { required: 'Reply content is required' })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your reply..."
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={replyLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {replyLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">{ticket?.status?.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 capitalize">{ticket?.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm">{formatDate(ticket?.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm">{formatDate(ticket?.updatedAt)}</p>
                </div>
                {ticket?.assignee && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="mt-1">{ticket.assignee.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Trail */}
            {auditLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {auditLogs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, ' ').toLowerCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.timestamp)} by {log.actor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}
      </div>
    </Layout>
  );
}