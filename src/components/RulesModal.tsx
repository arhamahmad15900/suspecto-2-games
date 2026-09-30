import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-[#FFB800]" />
            <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">Suspecto Official Rules</h2>
          </div>
          <p className="text-xs text-[#9AA0AD]">Fair play and social deduction guidelines</p>
        </div>

        <div className="space-y-4 text-xs text-[#9AA0AD]">
          <div className="p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F]">
            <h3 className="font-semibold text-[#E6E8EC] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
              1. No Writing Words or Letters
            </h3>
            <p className="text-[#9AA0AD] leading-relaxed">
              Players are strictly forbidden from writing actual letters, numbers, or spelling out the secret word on the canvas. Drawings must consist of pictorial symbols and shapes only.
            </p>
          </div>

          <div className="p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F]">
            <h3 className="font-semibold text-[#E6E8EC] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
              2. Single Turn Discipline
            </h3>
            <p className="text-[#9AA0AD] leading-relaxed">
              Each player can draw only during their designated turn window. When your turn timer ends or you submit your stroke, controls automatically freeze and pass to the next participant.
            </p>
          </div>

          <div className="p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F]">
            <h3 className="font-semibold text-[#E6E8EC] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
              3. Secret Role Confidentiality
            </h3>
            <p className="text-[#9AA0AD] leading-relaxed">
              Do not screen share your private role screen or speak your secret word aloud during the drawing phase. Social deduction is won on the canvas.
            </p>
          </div>

          <div className="p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F]">
            <h3 className="font-semibold text-[#E6E8EC] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
              4. Win Conditions
            </h3>
            <ul className="text-[#9AA0AD] space-y-1 list-disc list-inside">
              <li><strong className="text-[#E6E8EC]">Crew Victory:</strong> The Imposter is identified and eliminated, and fails their final word guess.</li>
              <li><strong className="text-[#E6E8EC]">Imposter Victory:</strong> The Imposter survives uneliminated, or successfully guesses the secret word during the final guessing phase!</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#28303F] text-center text-[11px] text-[#7B8290]">
          <span>Suspecto Official Rules · Authored by </span>
          <span className="text-[#FFB800] font-semibold">Arham Ahmad Khan</span>
        </div>
      </div>
    </div>
  );
};
