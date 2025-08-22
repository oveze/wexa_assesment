
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '../components/Layout';

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  triaged: 'bg-blue-100 text-blue-800',
  waiting_human: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const categoryColors = {
  billing: 'bg-purple-100 text-purple-800',
  tech: 'bg-red-100 text-red-800',
  shipping: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { hasRole } = useAuthStore();

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const params = {};
      if (filter === 'my') params.my = 'true';
      if (filter !== 'all' && filter !== 'my') params.status = filter;

      const response = await api.get('/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Support Tickets</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and track all support requests
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/tickets/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Create Ticket
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex space-x-4 mb-6">
            {['all', 'my', 'open', 'waiting_human', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li key={ticket._id}>
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ticket.title}
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                              {ticket.status}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[ticket.category]}`}>
                              {ticket.category}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-500 truncate">
                              {ticket.description}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>
                              Created by {ticket.createdBy?.name} • {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            {ticket.assignee && (
                              <span className="ml-4">
                                Assigned to {ticket.assignee.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {tickets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tickets found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}