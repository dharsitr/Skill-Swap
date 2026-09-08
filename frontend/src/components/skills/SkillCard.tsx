import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Tag, Award, Sparkles } from 'lucide-react';
import type { SkillProficiency, UserSkill } from '@/types/api';

interface SkillCardProps {
  userSkill: UserSkill;
  onEdit: (userSkill: UserSkill) => void;
  onDelete: (userSkill: UserSkill) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ userSkill, onEdit, onDelete }) => {
  const getProficiencyBadge = (proficiency: SkillProficiency) => {
    switch (proficiency) {
      case 'EXPERT':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-[11px]">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            Expert
          </Badge>
        );
      case 'ADVANCED':
        return (
          <Badge variant="secondary" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#38BDF8]" />
            Advanced
          </Badge>
        );
      case 'INTERMEDIATE':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#10B981]" />
            Intermediate
          </Badge>
        );
      case 'BEGINNER':
      default:
        return (
          <Badge variant="info" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#38BDF8]" />
            Beginner
          </Badge>
        );
    }
  };

  return (
    <Card className="glass-card flex flex-col justify-between group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold tracking-tight text-[#F8F5ED]">
              {userSkill.skillName}
            </CardTitle>
            {userSkill.categoryName && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                <Tag className="w-3 h-3 text-[#10B981]" />
                {userSkill.categoryName}
              </span>
            )}
          </div>
          <div>{getProficiencyBadge(userSkill.proficiency)}</div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 text-xs text-[#CBD5E1] flex-1">
        {userSkill.description ? (
          <p className="line-clamp-3 italic text-[#CBD5E1] leading-relaxed">
            &ldquo;{userSkill.description}&rdquo;
          </p>
        ) : (
          <p className="text-[#64748B] italic text-[11px]">No specific notes provided.</p>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t border-slate-800/60 flex justify-end gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(userSkill)}
          className="h-7 text-xs px-2.5 text-[#94A3B8] hover:text-[#F8F5ED] gap-1"
          aria-label={`Edit ${userSkill.skillName}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(userSkill)}
          className="h-7 text-xs px-2.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 gap-1"
          aria-label={`Remove ${userSkill.skillName}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </Button>
      </CardFooter>
    </Card>
  );
};
