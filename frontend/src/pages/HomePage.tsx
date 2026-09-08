import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Coins,
  Video,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Star,
  CheckCircle2,
  Code,
  Palette,
  Briefcase,
  Atom,
  Music,
  Globe,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const categories = [
    {
      icon: Code,
      title: 'Coding & Tech',
      skills: ['Python', 'React', 'Data Structures', 'Machine Learning'],
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Palette,
      title: 'Design & Creative',
      skills: ['UI/UX Design', 'Figma', 'Video Editing', '3D Modeling'],
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Atom,
      title: 'STEM & Academics',
      skills: ['Calculus', 'Organic Chemistry', 'Physics', 'Statistics'],
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Briefcase,
      title: 'Career & Business',
      skills: ['Resume Review', 'Public Speaking', 'Marketing', 'Consulting Prep'],
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: Globe,
      title: 'Languages',
      skills: ['Spanish', 'Mandarin', 'Japanese', 'German'],
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: Music,
      title: 'Music & Arts',
      skills: ['Guitar', 'Piano', 'Audio Mixing', 'Digital Art'],
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Deterministic Matchmaking',
      description:
        'Our algorithm instantly pairs you with students whose teaching offerings match your learning wishlist with verified academic alignment.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Coins,
      title: 'Credit-Based Economy',
      description:
        'No cash required. Earn Skill Credits by sharing what you know, and spend credits to book 1-on-1 mentorship with peers.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Video,
      title: 'Built-in Video & Screen Sharing',
      description:
        'Hop into real-time WebRTC audio/video workshops with low-latency screen capture and interactive teaching tools built right into your browser.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat & Negotiations',
      description:
        'Exchange real-time direct messages, discuss custom syllabi, send counter-proposals, and coordinate sessions effortlessly.',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
    },
    {
      icon: Calendar,
      title: 'Structured Session Lifecycle',
      description:
        'Automated booking, mutual completion confirmation, secure credit escrow, and calendar reminders protect both teachers and learners.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Student Safety & Ratings',
      description:
        'Authentic peer reviews, 1–5 star performance ratings, community moderation, and mutual blocking keep learning safe and high-quality.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'List Your Skills',
      description: 'Create your student profile and list what you are confident teaching and what skills you want to learn.',
    },
    {
      step: '02',
      title: 'Discover & Match',
      description: 'Search by category or let our matching engine connect you with campus peers ready for an exchange.',
    },
    {
      step: '03',
      title: 'Swap Knowledge & Level Up',
      description: 'Schedule a live session, collaborate via video or chat, earn credits, and grow your mastery together.',
    },
  ];

  const testimonials = [
    {
      quote:
        'I taught Python algorithms to a junior and earned enough credits to learn Figma from a design student. It completely leveled up my portfolio project!',
      name: 'Alex Rivera',
      role: 'Computer Science, Class of ’26',
      badge: 'Software Track',
      rating: 5,
    },
    {
      quote:
        'SkillSwap made finding study mentors on campus effortless. The video calling and screen sharing works right inside the browser without installing anything.',
      name: 'Samantha Chen',
      role: 'Data Science & Statistics',
      badge: 'STEM Peer',
      rating: 5,
    },
    {
      quote:
        'The credit escrow system makes every session respectful and structured. It feels great to help freshmen while mastering Spanish conversation.',
      name: 'Marcus Vance',
      role: 'Business & International Relations',
      badge: 'Language Mentor',
      rating: 5,
    },
  ];

  return (
    <div className="space-y-24 py-4 sm:py-8">
      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative text-center max-w-4xl mx-auto space-y-8 px-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[250px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#10B981]/12 text-[#34D399] border border-[#10B981]/30 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
          <span>The #1 Peer-to-Peer Skill Exchange Network for Students</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] text-[#F8F5ED] font-display">
          Trade Knowledge. Master Any Skill.{' '}
          <span className="bg-gradient-to-r from-[#34D399] via-[#10B981] to-[#6EE7B7] bg-clip-text text-transparent">
            Level Up Together.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-normal">
          SkillSwap is a student-first collaborative platform where undergraduates and graduates barter practical
          skills, earn session credits by mentoring, and book interactive 1-on-1 workshops.
        </p>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link to="/app" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm font-bold gap-2 px-8 h-12 shadow-lg shadow-emerald-500/20">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm font-bold gap-2 px-8 h-12 shadow-lg shadow-emerald-500/25">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-semibold px-6 h-12 border-slate-700 bg-[#1E293B]/50 hover:bg-[#1E293B] text-[#CBD5E1]"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}

          <Link to="/discover" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-sm font-semibold px-6 h-12 text-[#94A3B8] hover:text-[#F8F5ED]"
            >
              Explore Skills Catalog
            </Button>
          </Link>
        </div>

        {/* Trust Badges / Stats Bar */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: 'Verified Skills', value: '150+' },
            { label: 'Campus Students', value: '1,200+' },
            { label: 'Credits Exchanged', value: '10,000+' },
            { label: 'Average Rating', value: '4.9 / 5.0 ★' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#111827]/80 border border-slate-800 backdrop-blur-sm flex flex-col items-center justify-center text-center shadow-sm"
            >
              <span className="text-xl sm:text-2xl font-black text-[#F8F5ED] tracking-tight font-display">
                {stat.value}
              </span>
              <span className="text-[11px] sm:text-xs text-[#94A3B8] font-medium mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* HOW IT WORKS */}
      {/* ========================================================================= */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 px-3 py-1">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8F5ED] tracking-tight font-display">
            How SkillSwap Works
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8]">
            Master new subjects and build meaningful campus connections in three easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((item, idx) => (
            <Card
              key={idx}
              className="glass-card relative overflow-hidden border-slate-800 bg-[#111827]/60 hover:border-[#10B981]/40 transition-all duration-300 group"
            >
              <div className="absolute top-4 right-4 text-4xl font-black text-slate-800 group-hover:text-emerald-500/20 transition-colors font-mono">
                {item.step}
              </div>
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold mb-3">
                  {idx + 1}
                </div>
                <CardTitle className="text-lg font-bold text-[#F8F5ED]">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SKILL CATEGORIES EXPLORATION */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 px-3 py-1">
              Top Disciplines
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8F5ED] tracking-tight font-display">
              Popular Skills on Campus
            </h2>
            <p className="text-sm text-[#94A3B8]">
              From hard engineering competencies to creative arts and language practice.
            </p>
          </div>
          <Link to="/discover">
            <Button variant="outline" size="sm" className="gap-2 text-xs border-slate-700 hover:border-emerald-500">
              Browse Full Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card
                key={idx}
                className="glass-card border-slate-800 bg-[#111827]/70 hover:border-slate-700 transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${cat.bg} ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-[#F8F5ED]">{cat.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1E293B] border border-slate-800 text-[#CBD5E1]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* POWERFUL PLATFORM CAPABILITIES */}
      {/* ========================================================================= */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-sky-400 border-sky-500/30 px-3 py-1">
            Feature-Rich Architecture
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8F5ED] tracking-tight font-display">
            Built for Serious Peer Collaboration
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8]">
            Everything students need for friction-free learning, scheduling, and verified reputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card
                key={idx}
                className="glass-card border-slate-800 bg-[#111827]/70 hover:border-[#10B981]/30 transition-all duration-200"
              >
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center ${feat.color} mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-[#F8F5ED]">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    {feat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STUDENT TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-purple-400 border-purple-500/30 px-3 py-1">
            Student Stories
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8F5ED] tracking-tight font-display">
            Loved by Campus Learners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="glass-card border-slate-800 bg-[#111827]/70 p-5 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#CBD5E1] italic leading-relaxed">"{t.quote}"</p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8F5ED]">{t.name}</h4>
                  <p className="text-[11px] text-[#94A3B8]">{t.role}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {t.badge}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10B981]/20 via-[#111827] to-[#0B1220] border border-[#10B981]/30 p-8 sm:p-14 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-[#F8F5ED] tracking-tight font-display">
            Ready to Unlock Your Skill Potential?
          </h2>
          <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
            Join thousands of college students leveling up their resumes, mastering coursework, and mentoring peers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link to="/discover">
              <Button size="lg" className="text-sm font-bold gap-2 px-8 h-12 shadow-lg">
                Discover Mentors Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="text-sm font-bold gap-2 px-8 h-12 shadow-lg shadow-emerald-500/25">
                  Create Your Free Account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-sm font-semibold px-6 h-12 border-slate-700 bg-[#1E293B]/60 text-[#CBD5E1]"
                >
                  Browse Campus Skills
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to Join
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Student Network
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Matching
          </span>
        </div>
      </section>
    </div>
  );
};
