import { useState } from 'react';
import { CURRENCY } from '../config/currency';

interface Question {
  q: string;
  options: Array<{ text: string; correct?: boolean }>;
  why: string;
}

const QUESTIONS: Question[] = [
  {
    q: 'How do you win an item?',
    options: [
      { text: 'Have the highest bid when the 5-second timer runs out', correct: true },
      { text: 'Be the first to open the bidding' },
      { text: 'Rate it the highest' },
      { text: 'Have the most Bids left over' },
    ],
    why: 'Each new bid resets a 5-second timer. When it hits zero, the highest bidder wins and pays their bid.',
  },
  {
    q: 'How is your final score calculated?',
    options: [
      { text: 'Total value of items you won, minus 1 per empty slot', correct: true },
      { text: 'The number of items you won' },
      { text: 'How many Bids you have left' },
      { text: 'The average of your own ratings' },
    ],
    why: 'Each item’s value is the average of everyone’s 1–10 ratings. You lose a point for every slot you didn’t fill.',
  },
  {
    q: 'What are your leftover Bids worth at the end?',
    options: [
      { text: 'Nothing — unspent Bids are worth zero', correct: true },
      { text: 'They’re added to your score' },
      { text: 'They carry over to the next round' },
      { text: 'They turn into a bonus item' },
    ],
    why: 'Leftover currency scores nothing, so hoarding Bids doesn’t help — spend them on items you like.',
  },
];

export function HowToPlay({ block = false }: { block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const pick = (qi: number, oi: number) => {
    if (answers[qi] != null) return; // lock after answering
    setAnswers((a) => ({ ...a, [qi]: oi }));
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = QUESTIONS.filter((q, i) => q.options[answers[i]]?.correct).length;
  const done = answeredCount === QUESTIONS.length;

  const reset = () => {
    setAnswers({});
    setOpen(false);
  };

  return (
    <>
      <button
        className={`btn btn-ghost btn-sm${block ? ' btn-block' : ''}`}
        onClick={() => setOpen(true)}
      >
        ❓ How to play
      </button>

      {open && (
        <div className="modal-overlay" onClick={reset}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 6 }}>
              <span className="brand-sub">How to play</span>
              <button className="btn btn-ghost btn-sm" onClick={reset}>
                ✕ Close
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <ul style={{ margin: '0 0 14px', paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                  The host picks a topic; the game finds real items to bid on.
                </li>
                <li>
                  Everyone starts with the same {CURRENCY.label}. Win items by
                  bidding — each bid resets a 5-second timer; high bidder wins.
                </li>
                <li>
                  You have limited {CURRENCY.label} and limited slots, and there
                  are fewer items than everyone could hold — so choose wisely.
                </li>
                <li>
                  After bidding, everyone rates every item 1–10. Item value is
                  the average.
                </li>
                <li>
                  Score = value of your items − 1 per empty slot. Highest wins.
                </li>
              </ul>

              <div className="divider" />
              <p className="brand-sub" style={{ margin: '12px 0 8px' }}>
                Quick check ({correctCount}/{QUESTIONS.length})
              </p>

              <div className="stack" style={{ gap: 16 }}>
                {QUESTIONS.map((q, qi) => {
                  const chosen = answers[qi];
                  const answered = chosen != null;
                  return (
                    <div key={qi} className="stack" style={{ gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>
                        {qi + 1}. {q.q}
                      </span>
                      {q.options.map((o, oi) => {
                        let cls = 'btn btn-ghost btn-sm';
                        if (answered && o.correct) cls = 'btn btn-accent btn-sm';
                        else if (answered && oi === chosen) cls = 'btn btn-danger btn-sm';
                        return (
                          <button
                            key={oi}
                            className={cls}
                            style={{ textAlign: 'left', whiteSpace: 'normal' }}
                            onClick={() => pick(qi, oi)}
                          >
                            {o.text}
                          </button>
                        );
                      })}
                      {answered && (
                        <span className="faint tiny">
                          {q.options[chosen].correct ? '✅ ' : '❌ '}
                          {q.why}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {done && (
                <div
                  className="info-banner"
                  style={{ marginTop: 14, textAlign: 'center' }}
                >
                  {correctCount === QUESTIONS.length
                    ? '🎉 You’ve got it — ready to play!'
                    : `You got ${correctCount}/${QUESTIONS.length}. Skim the rules above and you’re set.`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
