

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';

const categoryOptions = [
  { value: 'other', label: 'Other', icon: '❓', description: 'General inquiries and other issues' },
  { value: 'billing', label: 'Billing', icon: '💳', description: 'Payment, invoicing, and account billing' },
  { value: 'tech', label: 'Technical', icon: '🔧', description: 'Technical problems and bugs' },
  { value: 'shipping', label: 'Shipping', icon: '📦', description: 'Delivery and shipping related issues' }
];

export default function CreateTicketPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      category: 'other'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const watchedCategory = watch('category');
  const watchedTitle = watch('title', '');
  const watchedDescription = watch('description', '');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/tickets', data);
      navigate(`/tickets/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categoryOptions.find(cat => cat.value === watchedCategory);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="text-4xl">🎫</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Create Support Ticket
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your issue and our AI-powered system will help route it to the right team for quick resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <span>📝</span>
                  <span>Ticket Details</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Title Field */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <div className="relative">
                    <input
                      {...register('title', { required: 'Title is required' })}
                      type="text"
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Brief description of your issue"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-lg">💡</span>
                    </div>
                  </div>
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.title.message}</span>
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryOptions.map((category) => (
                      <label
                        key={category.value}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          watchedCategory === category.value
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <input
                          {...register('category')}
                          type="radio"
                          value={category.value}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{category.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{category.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                          </div>
                        </div>
                        {watchedCategory === category.value && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="Please provide detailed information about your issue. Include any error messages, steps to reproduce, and relevant context..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.description.message}</span>
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {watchedDescription.length}/2000 characters
                  </div>
                </div>

                {/* Attachment URLs */}
                <div>
                  <label htmlFor="attachmentUrls" className="block text-sm font-semibold text-gray-700 mb-2">
                    Attachment URLs
                  </label>
                  <div className="relative">
                    <textarea
                      {...register('attachmentUrls')}
                      rows={3}
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter URLs of attachments, one per line&#10;https://example.com/screenshot.png&#10;https://example.com/document.pdf"
                    />
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <span className="text-gray-400 text-lg">📎</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    🔗 Enter URLs to relevant screenshots, documents, or files that help explain your issue
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2">
                    <span className="text-red-500 text-lg">❌</span>
                    <div className="text-red-700 text-sm font-medium">{error}</div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/tickets')}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Ticket ✨
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span>👀</span>
                  <span>Preview</span>
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</div>
                  <div className="text-sm font-medium text-gray-900">
                    {watchedTitle || 'Your ticket title...'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{selectedCategory?.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{selectedCategory?.label}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</div>
                  <div className="text-sm text-gray-700">
                    {watchedDescription.substring(0, 100) || 'Your detailed description...'}
                    {watchedDescription.length > 100 && '...'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant Info */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="text-lg font-bold">AI Assistant</h3>
                  <p className="text-purple-100 text-sm">Smart triage system</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-purple-100">Automatically categorizes tickets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                  <span className="text-purple-100">Suggests solutions from knowledge base</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                  <span className="text-purple-100">Routes to appropriate agents</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span>💡</span>
                  <span>Quick Tips</span>
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Be specific</div>
                    <div className="text-gray-600">Include error messages, steps to reproduce, and expected behavior</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Choose the right category</div>
                    <div className="text-gray-600">This helps our AI route your ticket to the right team</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Include attachments</div>
                    <div className="text-gray-600">Screenshots and documents help us understand your issue better</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time Estimate */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-2xl">⏱️</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Response Time</h3>
                  <p className="text-xs text-gray-500">Estimated based on category</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Initial Response:</span>
                  <span className="font-medium text-green-600">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Human Follow-up:</span>
                  <span className="font-medium text-blue-600">
                    {selectedCategory?.value === 'tech' ? '2-4 hours' :
                     selectedCategory?.value === 'billing' ? '1-2 hours' :
                     selectedCategory?.value === 'shipping' ? '4-8 hours' :
                     '6-12 hours'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success States */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating your ticket...</h3>
              <p className="text-gray-600 mb-4">Our AI is analyzing your request</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}