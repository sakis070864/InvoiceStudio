import React, { useState } from 'react';
import { X, Shield, Server, GitBranch, Globe, Database, Code2, Lock, Terminal, Folder } from 'lucide-react';
import { version as reactVersion } from 'react';

interface SystemInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SystemInfoDialog: React.FC<SystemInfoDialogProps> = ({ isOpen, onClose }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Using main app passwords for convenience
    if (password === 'sakis1964' || password === 'admin') { 
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 text-secondary">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs sm:text-sm text-accent font-mono bg-accent/5 px-2 py-1 rounded border border-accent/10 truncate max-w-[200px]">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-sidebar border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-sidebar/50">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Terminal className="w-5 h-5 text-secondary" />
            System Infrastructure
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-border rounded text-secondary hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!isUnlocked ? (
            <form onSubmit={handleUnlock} className="space-y-6 py-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mx-auto ring-1 ring-border">
                    <Lock className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <h3 className="text-primary font-medium">Restricted Access</h3>
                  <p className="text-sm text-secondary mt-1">Enter administrative password to view stack details.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-center tracking-widest"
                  autoFocus
                />
                {error && <p className="text-xs text-danger text-center font-medium animate-pulse">Incorrect password</p>}
              </div>

              <button type="submit" className="w-full bg-primary text-background rounded-lg py-2.5 font-bold hover:bg-white transition-colors">
                Unlock System Info
              </button>
            </form>
          ) : (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-secondary/70 uppercase tracking-widest flex items-center gap-2">
                  <Code2 className="w-3 h-3" /> Frontend Stack
                </h3>
                <div className="bg-background/30 rounded-lg border border-border/50 px-4">
                    <InfoRow icon={Globe} label="Framework" value={`React v${reactVersion}`} />
                    <InfoRow icon={Server} label="Build Tool" value="Vite" />
                    <InfoRow icon={Code2} label="Language" value="TypeScript 5.x" />
                    <InfoRow icon={Code2} label="Styling" value="Tailwind CSS 3.4" />
                    <InfoRow icon={Code2} label="Icons" value="Lucide React" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-secondary/70 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-3 h-3" /> Backend & Data
                </h3>
                <div className="bg-background/30 rounded-lg border border-border/50 px-4">
                    <InfoRow icon={Database} label="Database" value="Firebase (InvoiceStudio)" />
                    <InfoRow icon={Shield} label="Auth Provider" value="Custom / Firestore" />
                    <InfoRow icon={Server} label="Hosting" value="Vercel (InvoiceStudio)" />
                    <InfoRow icon={Code2} label="AI Model" value="Gemini 2.5 Flash" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-secondary/70 uppercase tracking-widest flex items-center gap-2">
                  <GitBranch className="w-3 h-3" /> Version Control
                </h3>
                <div className="bg-background/30 rounded-lg border border-border/50 px-4">
                    <InfoRow icon={GitBranch} label="Platform" value="GitHub" />
                    <InfoRow icon={GitBranch} label="Repository" value="InvoiceStudio" />
                    <InfoRow icon={Folder} label="Local Folder" value="InvoiceStudio" />
                    <InfoRow icon={GitBranch} label="Branch" value="main" />
                    <InfoRow icon={Globe} label="Deployment" value="Automatic (CI/CD)" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-secondary">
                 <span>v1.0.2 Stable</span>
                 <span className="font-mono">ID: {Math.random().toString(36).substring(7)}</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemInfoDialog;