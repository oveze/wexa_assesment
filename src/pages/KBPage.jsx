import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '../components/Layout';

export default function KBPage() {
  const { hasRole } = useAuthStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(hasRole(['admin']) ? 'all' : 'published'); // 👈 default
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchArticles();
  }, [filterStatus]); // 👈 refetch when status changes

  const fetchArticles = async (query = '') => {
    try {
      setLoading(true);
      const params = {};
      if (query) params.query = query;

      // Only add status if not "all"
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await api.get('/kb', { params });
      setArticles(response.data);
    } catch (error) {
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchTerm);
  };

  const onSubmitArticle = async (data) => {
    try {
      setError('');
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      const articleData = { ...data, tags: tagsArray };

      if (editingArticle) {
        await api.put(`/kb/${editingArticle._id}`, articleData);
      } else {
        await api.post('/kb', articleData);
      }

      reset();
      setShowCreateForm(false);
      setEditingArticle(null);
      fetchArticles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save article');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setShowCreateForm(true);
    setValue('title', article.title);
    setValue('body', article.body);
    setValue('tags', article.tags.join(', '));
    setValue('status', article.status);
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await api.delete(`/kb/${articleId}`);
      fetchArticles();
    } catch (err) {
      setError('Failed to delete article');
    }
  };

  const cancelEdit = () => {
    setShowCreateForm(false);
    setEditingArticle(null);
    reset();
  };

  if (!hasRole(['admin', 'agent'])) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You don't have permission to access the Knowledge Base management.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage articles that help resolve customer issues automatically
            </p>
          </div>
          {hasRole(['admin']) && (
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Add Article
              </button>
            </div>
          )}
        </div>

        {/* Search + Filter */}
        <div className="mt-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchArticles();
              }}
              className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Clear
            </button>

            {/* Status Filter (Admins only) */}
            {hasRole(['admin']) && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            )}
          </form>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingArticle ? 'Edit Article' : 'Create New Article'}
              </h3>
            </div>
            <form onSubmit={handleSubmit(onSubmitArticle)} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                  placeholder="Article title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700">Content *</label>
                <textarea
                  {...register('body', { required: 'Content is required' })}
                  rows={8}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                  placeholder="Article content..."
                />
                {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    placeholder="billing, tech, shipping"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    {...register('status')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Articles ({articles.length})
            </h3>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">{searchTerm ? 'No articles found.' : 'No articles available.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <div key={article._id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900 truncate">{article.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {article.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{article.body.substring(0, 200)}...</p>
                      {article.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Updated {new Date(article.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {hasRole(['admin']) && (
                      <div className="flex-shrink-0 ml-4 flex space-x-2">
                        <button onClick={() => handleEdit(article)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button onClick={() => handleDelete(article._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
