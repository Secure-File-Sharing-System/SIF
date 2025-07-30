import React, { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import { Search, File, Clock, Download, Shield, MoreVertical, Trash2, Eye, EyeOff, Copy, AlertCircle, RefreshCw } from 'lucide-react';

// --- Type Definitions ---
interface FileData {
  _id: string;
  name: string;
  size: number;
  downloads: number;
  maxDownloads: number;
  status: 'active' | 'expired' | 'disabled';
  passwordProtected: boolean;
  isPublic: boolean;
  fileType: string;
  createdAt: string;
  expiresAt: string;
  expiresIn: string;
  uploadedBy: string;
  downloadHistory: Array<{
    downloadedAt: string;
    ip: string;
    country: string;
    userAgent: string;
  }>;
  shareStats: {
    totalViews: number;
    uniqueVisitors: number;
    peakDownloads: number;
  };
}

interface Summary {
  totalFiles: number;
  activeFiles: number;
  totalDownloads: number;
  protectedFiles: number;
}

interface FilterState {
  searchTerm: string;
  status: string;
  fileType: string;
  sortBy: string;
  sortOrder: string;
}

type FilterAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_FILE_TYPE'; payload: string }
  | { type: 'SET_SORT'; payload: { sortBy: string; sortOrder: string } };

// --- Utility Functions (moved outside component) ---

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const formatExpiryTime = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffInMs = expiry.getTime() - now.getTime();

  if (diffInMs <= 0) return 'Expired';

  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) return `${diffInDays}d`;
  if (diffInHours > 0) return `${diffInHours}h`;
  return `${Math.floor(diffInMs / (1000 * 60))}m`;
};

const getFileIcon = (type: string): string => {
  const iconMap: { [key: string]: string } = {
    'PDF': '📄',
    'Document': '📝',
    'Text': '📄',
    'Image': '🖼️',
    'Video': '🎬',
    'Audio': '🎵',
    'Archive': '📦',
    'Code': '💻',
    'Other': '📄'
  };
  return iconMap[type] || '📄';
};

// --- Custom Hooks ---
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// --- Reducer for Filters ---
const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_FILE_TYPE':
      return { ...state, fileType: action.payload };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    default:
      return state;
  }
};

const initialState: FilterState = {
  searchTerm: '',
  status: 'all',
  fileType: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// --- Main Component ---
const RecentShares: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalFiles: 0, activeFiles: 0, totalDownloads: 0, protectedFiles: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const [filters, dispatch] = useReducer(filterReducer, initialState);
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.fileType !== 'all') params.append('fileType', filters.fileType);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/files/metadata?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();
      setFiles(data.files || []);
      setSummary(data.summary || { totalFiles: 0, activeFiles: 0, totalDownloads: 0, protectedFiles: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters.status, filters.fileType, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMutation = useCallback(async (apiCall: Promise<Response>) => {
    try {
      const response = await apiCall;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Action failed');
      }
      setActionMenu(null);
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [fetchFiles]);

  const deleteFile = useCallback((fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
        handleMutation(fetch(`/api/files/${fileId}`, { method: 'DELETE' }));
    }
  }, [handleMutation]);

  const toggleFileStatus = useCallback((fileId: string) => {
    handleMutation(fetch(`/api/files/${fileId}/toggle-status`, { method: 'PUT' }));
  }, [handleMutation]);

  const copyShareLink = useCallback((fileId: string) => {
    const shareUrl = `${window.location.origin}/files/${fileId}`;
    navigator.clipboard.writeText(shareUrl);
    setActionMenu(null);
  }, []);

  const fileTypes = useMemo(() => {
    const types = [...new Set(files.map(f => f.fileType))];
    return types.filter(Boolean).sort();
  }, [files]);

  const stats = useMemo(() => [
    { label: 'Total Files', value: summary.totalFiles.toString(), icon: File },
    { label: 'Active Links', value: summary.activeFiles.toString(), icon: Clock },
    { label: 'Total Downloads', value: summary.totalDownloads.toString(), icon: Download },
    { label: 'Protected', value: summary.protectedFiles.toString(), icon: Shield },
  ], [summary]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Recent Shares</h1>
          <p className="text-gray-400">Manage your shared files and download links</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="btn-ghost text-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">
            {summary.totalFiles} Files
          </div>
        </div>
      </div>

      <div className="py-6 border-b border-gray-700">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={filters.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => dispatch({ type: 'SET_STATUS', payload: e.target.value })}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>

          <select
            value={filters.fileType}
            onChange={(e) => dispatch({ type: 'SET_FILE_TYPE', payload: e.target.value })}
            className="input-field"
          >
            <option value="all">All Types</option>
            {fileTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
            }}
            className="input-field"
          >
            <option value="createdAt-desc">Latest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="downloads-desc">Most Downloads</option>
            <option value="downloads-asc">Least Downloads</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 pt-6 overflow-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Shared Files ({files.length})</h2>
          <p className="text-sm text-gray-400">All your shared files and their download statistics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-400">Loading files...</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-700 px-6 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
              <div className="col-span-4">File</div>
              <div className="col-span-2">Downloads</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Expires</div>
              <div className="col-span-1">Created</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-700">
              {files.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400">
                  No files found matching your criteria.
                </div>
              ) : (
                files.map((file) => (
                  <div key={file._id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-700/50 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                        <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                        <div className="truncate">
                            <div className="font-medium truncate" title={file.name}>{file.name}</div>
                            <div className="text-sm text-gray-400">{formatFileSize(file.size)}</div>
                        </div>
                    </div>

                    <div className="col-span-2">
                      <span className="font-medium">{file.downloads}</span>
                      {file.maxDownloads > 0 && (
                        <span className="text-gray-400"> / {file.maxDownloads}</span>
                      )}
                    </div>

                    <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          file.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : file.status === 'expired'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-600 text-gray-400'
                        }`}>
                          {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                        </span>
                        {file.passwordProtected && (
                          <span className="mt-1 block px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                            Protected
                          </span>
                        )}
                    </div>

                    <div className="col-span-2">
                      <span className={new Date(file.expiresAt) <= new Date() ? 'text-red-400' : 'text-gray-300'}>
                        {formatExpiryTime(file.expiresAt)}
                      </span>
                    </div>

                    <div className="col-span-1 text-gray-400">
                      {formatTimeAgo(file.createdAt)}
                    </div>

                    <div className="col-span-1 text-right relative" ref={actionMenu === file._id ? actionMenuRef : null}>
                      <button
                        onClick={() => setActionMenu(actionMenu === file._id ? null : file._id)}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenu === file._id && (
                        <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px] text-left">
                          <button
                            onClick={() => copyShareLink(file._id)}
                            className="w-full px-4 py-2 hover:bg-gray-600 flex items-center gap-2 text-sm"
                          >
                            <Copy className="w-4 h-4" /> Copy Link
                          </button>

                          <button
                            onClick={() => toggleFileStatus(file._id)}
                            className="w-full px-4 py-2 hover:bg-gray-600 flex items-center gap-2 text-sm"
                          >
                            {file.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {file.status === 'active' ? 'Disable' : 'Enable'}
                          </button>

                          <div className="border-t border-gray-600 my-1"></div>

                          <button
                            onClick={() => deleteFile(file._id)}
                            className="w-full px-4 py-2 hover:bg-gray-600 flex items-center gap-2 text-sm text-red-400"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentShares;