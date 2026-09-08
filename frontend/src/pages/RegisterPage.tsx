import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !displayName.trim() || !collegeName.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        displayName: displayName.trim(),
        collegeName: collegeName.trim(),
        password,
        confirmPassword,
      });
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1E293B] border border-[#10B981]/40 text-[#10B981] shadow-lg mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">Join SkillSwap</h1>
          <p className="text-sm text-[#94A3B8]">Create your student peer-learning profile</p>
        </div>

        <Card className="glass-card shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Student Registration</CardTitle>
            <CardDescription className="text-xs">Trade knowledge and earn learning credits</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3.5">
              {errorMessage && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs font-semibold text-[#CBD5E1]">Full Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={submitting || isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collegeName" className="text-xs font-semibold text-[#CBD5E1]">College / University</Label>
                <Input
                  id="collegeName"
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  disabled={submitting || isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#CBD5E1]">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || isLoading}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#CBD5E1]">Password (min. 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting || isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#CBD5E1]">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting || isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                variant="default"
                className="w-full gap-2 font-semibold h-10"
                disabled={submitting || isLoading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Account</span>
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-[#94A3B8]">
                Already registered?{' '}
                <Link to="/login" className="text-[#10B981] hover:text-[#34D399] font-medium underline-offset-4 hover:underline">
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
