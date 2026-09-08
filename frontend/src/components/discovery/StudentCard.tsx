import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  GraduationCap,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import type { DiscoveryCandidate, SkillProficiency } from '@/types/api';

interface StudentCardProps {
  candidate: DiscoveryCandidate;
}

export const StudentCard: React.FC<StudentCardProps> = ({ candidate }) => {
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const { candidate: profile, score, explanation } = candidate;

  const displayName = profile.displayName || 'Student Peer';
  const initial = displayName.charAt(0).toUpperCase();

  const formatYear = (year: string) => {
    switch (year) {
      case 'FIRST_YEAR': return '1st Year';
      case 'SECOND_YEAR': return '2nd Year';
      case 'THIRD_YEAR': return '3rd Year';
      case 'FOURTH_YEAR': return '4th Year';
      default: return 'Student';
    }
  };

  const getScoreColor = (matchScore: number) => {
    if (matchScore >= 80) {
      return {
        badge: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
        ring: 'border-[#10B981]/40 text-[#10B981]',
      };
    }
    if (matchScore >= 50) {
      return {
        badge: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
        ring: 'border-[#38BDF8]/40 text-[#38BDF8]',
      };
    }
    return {
      badge: 'bg-[#1E293B] text-[#94A3B8] border-slate-700',
      ring: 'border-slate-700 text-[#94A3B8]',
    };
  };

  const scoreTheme = getScoreColor(score);
  const displayedExplanations = showAllExplanations ? explanation : explanation.slice(0, 2);

  const formatProficiencyTag = (proficiency: SkillProficiency) => {
    switch (proficiency) {
      case 'EXPERT': return 'Exp';
      case 'ADVANCED': return 'Adv';
      case 'INTERMEDIATE': return 'Int';
      case 'BEGINNER': return 'Beg';
      default: return '';
    }
  };

  return (
    <Card className="glass-card flex flex-col justify-between group">
      <div>
        {/* Header: Avatar, Name, College & Match Score */}
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] font-bold text-lg">
                  {initial}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="text-base font-bold text-[#F8F5ED] tracking-tight truncate font-display">
                  {displayName}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94A3B8] mt-0.5">
                  <span className="flex items-center gap-1 truncate max-w-[140px]" title={profile.collegeName}>
                    <Building className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span className="truncate">{profile.collegeName}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <GraduationCap className="w-3 h-3 text-[#38BDF8] shrink-0" />
                    {formatYear(profile.yearOfStudy)}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Score Badge */}
            <div className="flex flex-col items-end shrink-0">
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${scoreTheme.badge}`}
                title={`Match Compatibility: ${score}%`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{score}% Match</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-5 pb-3 space-y-3.5">
          {/* Bio snippet */}
          {profile.bio && (
            <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed italic bg-[#1E293B]/70 p-2.5 rounded-lg border border-slate-800">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {/* Match Explanation Box */}
          {explanation && explanation.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#1E293B]/50 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#10B981]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  Why this is a good match
                </span>
                {explanation.length > 2 && (
                  <button
                    onClick={() => setShowAllExplanations(!showAllExplanations)}
                    className="text-[10px] text-[#94A3B8] hover:text-[#F8F5ED] flex items-center gap-0.5"
                  >
                    {showAllExplanations ? (
                      <>Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>+{explanation.length - 2} more <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>

              <ul className="space-y-1 text-[11px] text-[#94A3B8] pl-1">
                {displayedExplanations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#10B981] mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teaching Skills */}
          {profile.teachingSkills && profile.teachingSkills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Can Teach You
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.teachingSkills.map((skill) => (
                  <span
                    key={skill.skillId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#10B981]/12 text-[#34D399] border border-[#10B981]/25"
                  >
                    {skill.skillName}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#10B981]/20 font-bold">
                      {formatProficiencyTag(skill.proficiency)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Skills */}
          {profile.learningSkills && profile.learningSkills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Wants to Learn
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.learningSkills.map((skill) => (
                  <span
                    key={skill.skillId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#38BDF8]/12 text-[#38BDF8] border border-[#38BDF8]/25"
                  >
                    {skill.skillName}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#38BDF8]/20 font-bold">
                      {formatProficiencyTag(skill.proficiency)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer CTA */}
      <CardFooter className="pt-2 pb-5 px-5 border-t border-slate-800/80 mt-2">
        <Link to={`/users/${profile.userId}`} className="w-full">
          <Button variant="default" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
            <span>View Profile & Exchange</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
