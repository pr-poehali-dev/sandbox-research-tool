import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const QUICK_COMMANDS = [
  'id',
  'whoami',
  'pwd',
  'ls -la /function/runtime',
  'cat /proc/self/environ',
  'curl -v http://169.254.169.254/latest/meta-data/',
  'ping -c 1 169.254.169.254',
  'python3 --version',
  'uname -a',
];

const Index = () => {
  const [result, setResult] = useState<string>('{"status": "ready", "message": "Click any button to start diagnostics or enter shell command"}');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [shellCommand, setShellCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

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

  const executeShellCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    setLoading(true);
    setActiveEndpoint('shell');
    setCommandHistory(prev => [cmd, ...prev].slice(0, 10));
    
    try {
      const response = await fetch(`${FUNCTION_URL}?cmd=${encodeURIComponent(cmd)}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(JSON.stringify({ error: String(error) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleShellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeShellCommand(shellCommand);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#9b87f5]">Poehali.dev Sandbox Explorer</h1>
          <p className="text-gray-400">Internal diagnostic tool for environment testing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#2A2F3C] p-4 rounded-lg border border-[#3A3F4C]">
              <h3 className="text-sm font-semibold mb-3 text-[#9b87f5] flex items-center gap-2">
                <Icon name="Terminal" size={16} />
                Shell Command
              </h3>
              <form onSubmit={handleShellSubmit} className="space-y-3">
                <Input
                  value={shellCommand}
                  onChange={(e) => setShellCommand(e.target.value)}
                  placeholder="Enter shell command..."
                  className="bg-[#1A1F2C] border-[#3A3F4C] text-white font-mono text-sm"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !shellCommand.trim()}
                  className="w-full bg-[#9b87f5] hover:bg-[#8b77e5]"
                >
                  <Icon name="Play" size={16} className="mr-2" />
                  Execute
                </Button>
              </form>
              
              <div className="mt-4">
                <h4 className="text-xs font-semibold mb-2 text-gray-400">Quick Commands:</h4>
                <div className="space-y-1">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => {
                        setShellCommand(cmd);
                        executeShellCommand(cmd);
                      }}
                      disabled={loading}
                      className="w-full text-left text-xs px-2 py-1 rounded bg-[#1A1F2C] hover:bg-[#252a38] text-gray-300 font-mono transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
              
              {commandHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold mb-2 text-gray-400">History:</h4>
                  <div className="space-y-1">
                    {commandHistory.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShellCommand(cmd);
                          executeShellCommand(cmd);
                        }}
                        disabled={loading}
                        className="w-full text-left text-xs px-2 py-1 rounded bg-[#1A1F2C] hover:bg-[#252a38] text-gray-400 font-mono transition-colors truncate"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
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
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#0D1117] rounded-lg border border-[#30363d] h-[calc(100vh-200px)] overflow-hidden flex flex-col">
              <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Terminal" size={18} />
                  <span className="font-mono text-sm">Response</span>
                </div>
                <div className="flex items-center gap-3">
                  {loading && (
                    <div className="flex items-center gap-2 text-[#9b87f5]">
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-gray-400 hover:text-white"
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
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