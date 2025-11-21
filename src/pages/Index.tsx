import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const FUNCTION_URL = 'https://functions.poehali.dev/f7e112c1-7d08-4c83-a874-b1e27006db16';

const ENDPOINTS = [
  { path: 'help', label: 'Help', icon: 'CircleHelp', color: 'bg-blue-500' },
  { path: 'ping', label: 'Ping', icon: 'Activity', color: 'bg-green-500' },
  { path: 'env', label: 'Environment', icon: 'Settings', color: 'bg-purple-500' },
  { path: 'db', label: 'Database', icon: 'Database', color: 'bg-orange-500' },
  { path: 'meta', label: 'Metadata', icon: 'Cloud', color: 'bg-cyan-500' },
  { path: 'vsock', label: 'VSOCK', icon: 'Zap', color: 'bg-yellow-500' },
  { path: 'files', label: 'Filesystem', icon: 'FolderOpen', color: 'bg-pink-500' },
];

const Index = () => {
  const [result, setResult] = useState<string>('{"status": "ready", "message": "Click any button to start diagnostics"}');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);

  const fetchEndpoint = async (path: string) => {
    setLoading(true);
    setActiveEndpoint(path);
    
    try {
      const response = await fetch(`${FUNCTION_URL}?path=${path}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(JSON.stringify({ error: String(error) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#9b87f5]">Poehali.dev Sandbox Explorer</h1>
          <p className="text-gray-400">Internal diagnostic tool for environment testing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {ENDPOINTS.map((endpoint) => (
              <Button
                key={endpoint.path}
                onClick={() => fetchEndpoint(endpoint.path)}
                disabled={loading}
                className={`w-full justify-start text-left h-auto py-4 px-5 ${
                  activeEndpoint === endpoint.path 
                    ? 'bg-[#9b87f5] hover:bg-[#8b77e5]' 
                    : 'bg-[#2A2F3C] hover:bg-[#3A3F4C]'
                } transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${endpoint.color} p-2 rounded-lg`}>
                    <Icon name={endpoint.icon} size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{endpoint.label}</div>
                    <div className="text-xs text-gray-400">?path={endpoint.path}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#0D1117] rounded-lg border border-[#30363d] h-[calc(100vh-200px)] overflow-hidden flex flex-col">
              <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Terminal" size={18} />
                  <span className="font-mono text-sm">Response</span>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-[#9b87f5]">
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>
              <pre className="flex-1 p-4 overflow-auto text-sm font-mono">
                <code className="text-[#c9d1d9]">{result}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
