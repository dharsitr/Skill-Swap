import React, { useState } from 'react';
import { useCreateExchangeRequest } from '@/hooks/useExchangeRequests';
import { useMySkills } from '@/hooks/useSkills';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import type { PublicProfile, ExchangeRequest } from '@/types/api';

interface RequestExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: PublicProfile;
  onSuccess?: (request: ExchangeRequest) => void;
}

export const RequestExchangeModal: React.FC<RequestExchangeModalProps> = ({
  isOpen,
  onClose,
  recipient,
  onSuccess,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: mySkills } = useMySkills();
  const { mutateAsync: createRequest, isPending: isSubmitting } = useCreateExchangeRequest();

  if (!isOpen) return null;

  const myLearningSkillIds = new Set(mySkills?.learning.map((s) => s.skillId) || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSkillId) {
      setErrorMessage('Please select a skill you want to learn.');
      return;
    }

    if (message.length > 500) {
      setErrorMessage('Message cannot exceed 500 characters.');
      return;
    }

    try {
      const result = await createRequest({
        recipientId: recipient.userId,
        skillId: selectedSkillId,
        message: message.trim() || undefined,
      });

      setSuccessMessage('Exchange request sent successfully!');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result);
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send exchange request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[rgba(212,175,106,0.22)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0E1522]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8F5ED] font-display">Request Skill Exchange</h2>
              <p className="text-[11px] text-[#94A3B8]">
                Exchange with <span className="font-semibold text-[#F8F5ED]">{recipient.displayName}</span> ({recipient.collegeName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription className="text-xs">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Skill Selector List */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#F8F5ED]">
              Select skill to learn from {recipient.displayName} *
            </Label>

            {recipient.teachingSkills.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic p-3 rounded-lg bg-[#1E293B] border border-slate-800">
                This student has not listed any teaching skills yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recipient.teachingSkills.map((skill) => {
                  const isMatch = myLearningSkillIds.has(skill.skillId);
                  const isSelected = selectedSkillId === skill.skillId;

                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.skillId)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-[#10B981] bg-[#10B981]/10 shadow-sm'
                          : 'border-slate-800 bg-[#1E293B]/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F8F5ED]">{skill.skillName}</span>
                          {isMatch && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              Matches your goal
                            </Badge>
                          )}
                        </div>
                        {skill.categoryName && (
                          <p className="text-[10px] text-[#94A3B8]">{skill.categoryName}</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E293B] border border-slate-700 text-[#CBD5E1]">
                          {skill.proficiency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="message" className="text-xs font-semibold text-[#F8F5ED]">
              Introductory Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to learn this topic with you. What times work for an initial session?"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
              <span>Polite messages receive 2x faster responses</span>
              <span>{message.length} / 500</span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting || !selectedSkillId}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Proposal</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
