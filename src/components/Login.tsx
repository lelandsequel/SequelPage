import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../lib/auth';
import { Lock } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError.message || 'Failed to create account');
        setIsLoading(false);
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || 'Invalid email or password');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center px-4">
      <Card className="p-8 w-full max-w-md" glassEffect>
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome to CandlPage'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 C&L Strategy. All rights reserved.</p>
        </footer>
      </Card>
    </div>
  );
}
