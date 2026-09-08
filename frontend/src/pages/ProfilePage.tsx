import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/auth/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FriendsCard } from '@/components/profile/FriendsCard';
import {
  User,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Mail,
  BookOpen,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import type { YearOfStudy } from '@/types/api';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useCurrentProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>('FIRST_YEAR');

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAvatarUrl(profile.avatarUrl || '');
      setCollegeName(profile.collegeName || '');
      setDepartment(profile.department || '');
      setBio(profile.bio || '');
      setYearOfStudy(profile.yearOfStudy || 'FIRST_YEAR');
    }
  }, [profile]);

  // Compress & convert selected image to lightweight WebP/JPEG data URL
  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPEG, WebP, or GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be smaller than 10MB.');
      return;
    }

    setIsProcessingImage(true);
    setErrorMessage(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 320;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to process image.'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            resolve(compressed);
          };
          img.onerror = () => reject(new Error('Failed to load image file.'));
          img.src = readerEvent.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      setAvatarUrl(dataUrl);
      setSuccessMessage('Profile picture ready! Click "Save Profile" to apply.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('Display name is required.');
      return;
    }

    if (!collegeName.trim()) {
      setErrorMessage('College name is required.');
      return;
    }

    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
        collegeName: collegeName.trim(),
        department: department.trim() || null,
        bio: bio.trim() || null,
        yearOfStudy,
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile. Please try again.');
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
        <p className="text-sm font-medium">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Sub-navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">Student Profile</h1>
          <p className="text-sm text-[#94A3B8]">
            Manage your personal details, profile picture, and academic affiliation visible to peer learners.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Button variant="default" size="sm" className="h-8 text-xs gap-1.5 font-semibold">
            <User className="w-3.5 h-3.5" />
            Personal Info
          </Button>
          <Link to="/profile/skills">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-[#94A3B8] hover:text-[#F8F5ED]">
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF6A]" />
              Skills Profile
            </Button>
          </Link>
        </div>
      </div>

      {profileError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-xs">
            {profileError instanceof Error ? profileError.message : 'Error loading profile.'}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription className="text-xs">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* PROFILE PICTURE UPLOAD CARD */}
        {/* ========================================================================= */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#10B981]" />
              Profile Picture
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a clear photo to help fellow students recognize you during peer sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Circular Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#1E293B] border-2 border-slate-700/80 flex items-center justify-center text-[#10B981] font-bold text-3xl shadow-lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'Profile preview'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{displayName ? displayName.charAt(0).toUpperCase() : 'S'}</span>
                  )}
                </div>

                {/* Hover Camera Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage || isUpdating}
                  className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs gap-1 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  title="Upload profile picture"
                >
                  <Camera className="w-5 h-5 text-[#10B981]" />
                  <span className="font-semibold text-[11px]">Change</span>
                </button>
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8F5ED]">Upload your photo</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Supports PNG, JPG, GIF, or WebP. Automatically optimized for fast loading.
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                  disabled={isProcessingImage || isUpdating}
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage || isUpdating}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {isProcessingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10B981]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                    {avatarUrl ? 'Choose Different Photo' : 'Upload Photo'}
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                      disabled={isProcessingImage || isUpdating}
                      className="h-8 gap-1.5 text-xs text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* STUDENT DETAILS FORM CARD */}
        {/* ========================================================================= */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Student Information</CardTitle>
            <CardDescription className="text-xs">Your verified academic and profile details.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="flex items-center gap-1 text-xs text-[#CBD5E1]">
                  <User className="w-3.5 h-3.5 text-[#10B981]" />
                  Display Name *
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isUpdating}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1 text-xs text-[#CBD5E1]">
                  <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="opacity-70 bg-[#1E293B] cursor-not-allowed text-[#94A3B8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="collegeName" className="flex items-center gap-1 text-xs text-[#CBD5E1]">
                  <Building className="w-3.5 h-3.5 text-[#10B981]" />
                  College / University *
                </Label>
                <Input
                  id="collegeName"
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. Stanford University"
                  disabled={isUpdating}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs text-[#CBD5E1]">Department / Major</Label>
                <Input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="yearOfStudy" className="flex items-center gap-1 text-xs text-[#CBD5E1]">
                <GraduationCap className="w-3.5 h-3.5 text-[#38BDF8]" />
                Year of Study *
              </Label>
              <Select
                id="yearOfStudy"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value as YearOfStudy)}
                disabled={isUpdating}
              >
                <option value="FIRST_YEAR">1st Year Undergraduate (Freshman)</option>
                <option value="SECOND_YEAR">2nd Year Undergraduate (Sophomore)</option>
                <option value="THIRD_YEAR">3rd Year Undergraduate (Junior)</option>
                <option value="FOURTH_YEAR">4th Year Undergraduate (Senior)</option>
                <option value="OTHER">Graduate Student / Other</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs text-[#CBD5E1]">About Me & Skills Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic interests, subjects you're good at, or topics you are eager to learn from peers..."
                rows={4}
                disabled={isUpdating}
                maxLength={1000}
              />
              <span className="text-[11px] text-[#94A3B8] block text-right">
                {bio.length} / 1000 characters
              </span>
            </div>
          </CardContent>

              <CardFooter className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="default"
                  className="gap-2 px-6"
                  disabled={isUpdating || isProcessingImage}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Campus Friends & Connections Section */}
          <FriendsCard />
        </div>
      );
    };
