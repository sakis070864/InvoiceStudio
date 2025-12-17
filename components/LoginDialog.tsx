import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginDialogProps {
  onLogin: (success: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sakis1964') {
      onLogin(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-accent/10">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Καλωσήρθατε</h2>
          <p className="text-secondary text-sm mt-2 text-center">
            Εισάγετε τον κωδικό πρόσβασης για να συνεχίσετε στο InvoiceStudio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider ml-1">
              Κωδικός Πρόσβασης
            </label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-background border rounded-xl px-4 py-3 text-primary outline-none transition-all duration-200
                  ${error 
                    ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/10' 
                    : 'border-border focus:border-accent focus:ring-4 focus:ring-accent/10'
                  }
                `}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-danger font-medium ml-1 animate-pulse">
                Λανθασμένος κωδικός πρόσβασης
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
          >
            <span>Είσοδος</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <div className="mt-6 text-center">
           <p className="text-xs text-secondary/50">
             InvoiceStudio v1.0 &copy; {new Date().getFullYear()}
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginDialog;