
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const { hasRole } = useAuthStore();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (hasRole(['admin'])) {
      fetchConfig();
    }
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config');
      setConfig(response.data);
      
      // Set form values
      setValue('autoCloseEnabled', response.data.autoCloseEnabled);
      setValue('confidenceThreshold', response.data.confidenceThreshold);
      setValue('slaHours', response.data.slaHours);
    } catch (err) {
      setError('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/config', data);
      setConfig(response.data);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!hasRole(['admin'])) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">
              You don't have permission to access system settings.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white shadow rounded-lg">
              <div className="h-64 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Configure AI triage behavior and system parameters
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">AI Triage Configuration</h3>
              <p className="mt-1 text-sm text-gray-600">
                Control how the AI agent processes and handles support tickets
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
              {/* Auto Close Settings */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      {...register('autoCloseEnabled')}
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">
                      Enable Auto-Close
                    </label>
                    <p className="text-gray-500">
                      Automatically resolve tickets when AI confidence exceeds the threshold
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="confidenceThreshold" className="block text-sm font-medium text-gray-700">
                    Confidence Threshold
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('confidenceThreshold', {
                        required: 'Confidence threshold is required',
                        min: { value: 0, message: 'Threshold must be between 0 and 1' },
                        max: { value: 1, message: 'Threshold must be between 0 and 1' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    AI will auto-close tickets when confidence is above this value (0.0 - 1.0)
                  </p>
                  {errors.confidenceThreshold && (
                    <p className="mt-1 text-sm text-red-600">{errors.confidenceThreshold.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slaHours" className="block text-sm font-medium text-gray-700">
                    SLA Hours
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('slaHours', {
                        required: 'SLA hours is required',
                        min: { value: 1, message: 'SLA must be at least 1 hour' },
                        valueAsNumber: true
                      })}
                      type="number"
                      min="1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Target response time for support tickets (in hours)
                  </p>
                  {errors.slaHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.slaHours.message}</p>
                  )}
                </div>
              </div>

              {/* Current Configuration Display */}
              {config && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Current Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Auto-Close:</span>
                      <p className={`${config.autoCloseEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {config.autoCloseEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Threshold:</span>
                      <p className="text-gray-900">{(config.confidenceThreshold * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">SLA:</span>
                      <p className="text-gray-900">{config.slaHours} hours</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* System Information */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">LLM Provider</h4>
                  <p className="mt-1 text-sm text-gray-900">Stub Mode (Deterministic)</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Model Version</h4>
                  <p className="mt-1 text-sm text-gray-900">1.0</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Background Jobs</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {process.env.NODE_ENV === 'development' ? 'Redis/Immediate' : 'Production'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Environment</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {process.env.NODE_ENV || 'Development'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-blue-900">Configuration Guide</h3>
              <div className="mt-4 text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Auto-Close:</strong> When enabled, tickets with AI confidence above the threshold will be automatically resolved with the AI's suggested response.
                </p>
                <p>
                  <strong>Confidence Threshold:</strong> Higher values (0.8-0.9) are more conservative and will assign more tickets to human agents. Lower values (0.5-0.7) will auto-resolve more tickets.
                </p>
                <p>
                  <strong>SLA Hours:</strong> Used for reporting and escalation triggers (future feature).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}