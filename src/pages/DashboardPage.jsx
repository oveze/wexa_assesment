

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '../components/Layout';

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedToday: 0,
    avgResponseTime: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ticketsResponse = await api.get('/tickets');
      const tickets = ticketsResponse.data;
      
      const today = new Date().toDateString();
      const resolvedToday = tickets.filter(t => 
        t.status === 'resolved' && 
        new Date(t.updatedAt).toDateString() === today
      ).length;

      setStats({
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => ['open', 'waiting_human'].includes(t.status)).length,
        resolvedToday,
        avgResponseTime: 2.3
      });

      setRecentTickets(tickets.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = "blue", icon, trend }) => (
    <div className="group relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50">
      <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" style={{
        background: `linear-gradient(135deg, ${color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : color === 'yellow' ? '#F59E0B' : '#8B5CF6'} 0%, ${color === 'blue' ? '#1D4ED8' : color === 'green' ? '#059669' : color === 'yellow' ? '#D97706' : '#7C3AED'} 100%)`
      }}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br ${
                color === 'blue' ? 'from-blue-500 to-blue-600' :
                color === 'green' ? 'from-green-500 to-green-600' :
                color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                'from-purple-500 to-purple-600'
              }`}>
                <span className="text-white">{icon}</span>
              </div>
              {trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span>{trend.direction === 'up' ? '↗️' : '↘️'}</span>
                  <span>{trend.value}</span>
                </div>
              )}
            </div>
            <dt className="text-sm font-medium text-gray-600 mb-1">{title}</dt>
            <dd className="text-3xl font-bold text-gray-900 mb-1">{value}</dd>
            {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/50 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/50 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="text-4xl">👋</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Welcome back, {user?.name}!
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Here's what's happening with your support tickets today. Your AI assistant is working hard to help resolve issues automatically.
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Tickets" 
            value={stats.totalTickets}
            icon="📊"
            color="blue"
            trend={{ direction: 'up', value: '+12%' }}
          />
          <StatCard 
            title="Open Tickets" 
            value={stats.openTickets}
            subtitle="Need attention"
            icon="⚠️"
            color="yellow"
            trend={{ direction: 'down', value: '-5%' }}
          />
          <StatCard 
            title="Resolved Today" 
            value={stats.resolvedToday}
            subtitle="Great progress!"
            icon="✅"
            color="green"
            trend={{ direction: 'up', value: '+8%' }}
          />
          <StatCard 
            title="Avg Response Time" 
            value={`${stats.avgResponseTime}h`}
            subtitle="Getting faster"
            icon="⚡"
            color="purple"
            trend={{ direction: 'down', value: '-15%' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Recent Tickets */}
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <span>🎫</span>
                  <span>Recent Tickets</span>
                </h2>
                <Link 
                  to="/tickets" 
                  className="text-blue-100 hover:text-white transition-colors text-sm font-medium bg-white/20 px-3 py-1 rounded-full"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      to={`/tickets/${ticket._id}`}
                      className="block group"
                    >
                      <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                              {ticket.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {ticket.createdBy?.name}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.status}
                            </span>
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                              →
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-500">No recent tickets</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Actions</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link
                  to="/tickets/create"
                  className="flex items-center p-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                      ➕
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">Create New Ticket</p>
                    <p className="text-xs text-gray-500">Submit a support request</p>
                  </div>
                  <div className="text-blue-500 group-hover:text-blue-700">→</div>
                </Link>

                {hasRole(['agent', 'admin']) && (
                  <Link
                    to="/kb"
                    className="flex items-center p-4 rounded-xl border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 group transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        📚
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Manage Knowledge Base</p>
                      <p className="text-xs text-gray-500">Add or edit help articles</p>
                    </div>
                    <div className="text-green-500 group-hover:text-green-700">→</div>
                  </Link>
                )}

                {hasRole(['admin']) && (
                  <Link
                    to="/settings"
                    className="flex items-center p-4 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 group transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        ⚙️
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">System Settings</p>
                      <p className="text-xs text-gray-500">Configure AI triage settings</p>
                    </div>
                    <div className="text-purple-500 group-hover:text-purple-700">→</div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced AI Triage Status */}
        <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-white/10 backdrop-blur-sm p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <span className="text-3xl">🤖</span>
              <span>AI Triage System Status</span>
              <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-100 text-sm font-medium">ACTIVE</span>
              </div>
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 group-hover:bg-white/30 transition-all duration-200">
                  <div className="text-4xl font-bold text-white mb-2">Active</div>
                  <div className="text-blue-100">System Status</div>
                  <div className="mt-2 text-xs text-blue-200">Running smoothly ✨</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 group-hover:bg-white/30 transition-all duration-200">
                  <div className="text-4xl font-bold text-white mb-2">85%</div>
                  <div className="text-blue-100">Confidence Threshold</div>
                  <div className="mt-2 text-xs text-blue-200">Optimal performance 🎯</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 group-hover:bg-white/30 transition-all duration-200">
                  <div className="text-4xl font-bold text-white mb-2">12</div>
                  <div className="text-blue-100">Auto-resolved Today</div>
                  <div className="mt-2 text-xs text-blue-200">Great efficiency 🚀</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}