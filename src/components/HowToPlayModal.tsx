import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'Secret Role Assignment',
      desc: 'At the start of the match, every player privately receives their role. Crew Members receive the exact same secret word (e.g. "Elephant", "Pizza"). One player becomes the Imposter and receives NO word.',
    },
    {
      num: '02',
      title: 'Turn-Based Drawing',
      desc: 'Players take turns sketching on the shared canvas. Crew Members must draw clues to prove they know the word, but without making it so obvious that the Imposter figures it out! The Imposter must observe, bluff, and doodle carefully.',
    },
    {
      num: '03',
      title: 'Accusations & Voting',
      desc: 'Once everyone has contributed to the canvas, players debate and cast their votes. Who drew something suspiciously generic? Who hesitated? Vote to eliminate the player you believe is the Imposter.',
    },
    {
      num: '04',
      title: 'Elimination & Final Guess',
      desc: 'If the group correctly votes out the Imposter, the Imposter gets one final opportunity to guess the secret word. If they guess correctly, they steal the victory!',
    },
  ];

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
            <HelpCircle size={20} className="text-[#FFB800]" />
            <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">How to Play Suspecto</h2>
          </div>
          <p className="text-xs text-[#9AA0AD]">
            A fast-paced social deduction drawing game where one subtle brushstroke can reveal the truth.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((s) => (
            <div key={s.num} className="p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F] flex gap-3.5 items-start">
              <span className="font-mono font-bold text-[#FFB800] text-sm mt-0.5">{s.num}.</span>
              <div>
                <h3 className="text-sm font-semibold text-[#E6E8EC] mb-1">{s.title}</h3>
                <p className="text-xs text-[#9AA0AD] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl text-xs text-[#FFB800] mb-4">
          <span className="font-semibold block mb-1">Pro Tip for Imposters:</span>
          Observe the first few lines drawn by other players. Try drawing generic structural lines (circles, stems, handles) that fit multiple everyday objects before committing!
        </div>

        <div className="text-center text-[11px] text-[#7B8290]">
          <span>Suspecto · Created & Developed by </span>
          <span className="text-[#FFB800] font-semibold">Arham Ahmad Khan</span>
        </div>
      </div>
    </div>
  );
};
