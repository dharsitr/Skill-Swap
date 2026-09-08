import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useCurrentUser } from '@/hooks/useUser';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Loader2, Mail, Bell, ArrowLeftRight, Calendar, MessageSquare, Star, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: appUser } = useCurrentUser();
  const { data: preferences, isLoading: prefsLoading } = useNotificationPreferences();
  const updatePrefsMutation = useUpdateNotificationPreferences();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleTogglePreference = (key: 'exchangeRequests' | 'sessions' | 'messages' | 'reviews', currentValue: boolean) => {
    updatePrefsMutation.mutate({
      [key]: !currentValue,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">Account Settings</h1>
        <p className="text-sm text-[#94A3B8]">
          Manage your student identity session, notification preferences, and security parameters.
        </p>
      </div>

      {/* Notification Preferences Card */}
      <Card className="glass-card shadow-xl border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#F8F5ED]">Notification Preferences</CardTitle>
              <CardDescription className="text-xs text-[#94A3B8]">
                Control which activity alerts and updates you receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          {prefsLoading ? (
            <div className="py-4 text-center text-slate-400">Loading preferences...</div>
          ) : (
            <div className="space-y-2.5">
              {/* Exchange Requests */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Exchange Requests</h4>
                    <p className="text-[11px] text-slate-400">Alerts when someone requests a skill trade with you</p>
                  </div>
                </div>
                <Button
                  variant={preferences?.exchangeRequests !== false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTogglePreference('exchangeRequests', preferences?.exchangeRequests !== false)}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                    preferences?.exchangeRequests !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={preferences?.exchangeRequests !== false}
                >
                  {preferences?.exchangeRequests !== false ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Sessions */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-sky-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Sessions & Schedule</h4>
                    <p className="text-[11px] text-slate-400">Reminders when a learning session starts or is completed</p>
                  </div>
                </div>
                <Button
                  variant={preferences?.sessions !== false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTogglePreference('sessions', preferences?.sessions !== false)}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                    preferences?.sessions !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={preferences?.sessions !== false}
                >
                  {preferences?.sessions !== false ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Direct Messages */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Direct Messages</h4>
                    <p className="text-[11px] text-slate-400">In-app notifications when peers send new chat messages</p>
                  </div>
                </div>
                <Button
                  variant={preferences?.messages !== false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTogglePreference('messages', preferences?.messages !== false)}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                    preferences?.messages !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={preferences?.messages !== false}
                >
                  {preferences?.messages !== false ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Reviews */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-amber-400">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Reviews & Ratings</h4>
                    <p className="text-[11px] text-slate-400">Alerts when a peer leaves you feedback on a session</p>
                  </div>
                </div>
                <Button
                  variant={preferences?.reviews !== false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTogglePreference('reviews', preferences?.reviews !== false)}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg ${
                    preferences?.reviews !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={preferences?.reviews !== false}
                >
                  {preferences?.reviews !== false ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Safety & Security (Protected) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-slate-800 opacity-90">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-rose-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">Safety & Security (Always Active)</h4>
                    <p className="text-[11px] text-slate-400">Critical notifications for account safety, reports, and disputes</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 text-xs px-2 py-0.5">
                  <Check className="w-3 h-3 mr-1" />
                  Required
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card className="glass-card shadow-xl border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#F8F5ED]">Account & Security</CardTitle>
              <CardDescription className="text-xs text-[#94A3B8]">Manage your active session and account status</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#1E293B] border border-slate-800 gap-3">
            <div className="space-y-1">
              <span className="text-[#94A3B8] flex items-center gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                Authenticated Email
              </span>
              <p className="font-semibold text-[#F8F5ED] text-sm">{user?.email || 'N/A'}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[#94A3B8] block text-[11px] mb-1">Account Status</span>
              <Badge variant="success">
                {appUser?.status || 'ACTIVE'}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-slate-800 pt-4">
          <span className="text-xs text-[#94A3B8]">
            Sign out of this browser session
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
