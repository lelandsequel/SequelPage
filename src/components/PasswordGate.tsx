import { useState, useEffect, ReactNode } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  children: ReactNode;
}

const CORRECT_PASSWORD = 'ILoveTheBrowns333';

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('candlpage_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('candlpage_authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8" glassEffect>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              CandlPage
            </h1>
            <p className="text-gray-600">
              Professional Audit & Content Generation Suite
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="Enter Password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg">
              Access Dashboard
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500">
            For C&L Strategy clients only
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
