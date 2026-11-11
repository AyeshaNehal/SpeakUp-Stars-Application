import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Lock, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useParentAuth } from '../../context/ParentAuthContext';
import { ChildRecord } from '../../services/auth/parentAuthService';

export const ChildChooserPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    childrenList,
    activeChild,
    selectActiveChild,
    deleteChildProfile,
    enterParentMode,
  } = useParentAuth();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<'add' | 'delete' | 'edit'>('add');
  const [targetChild, setTargetChild] = useState<ChildRecord | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSelectChild = (child: ChildRecord) => {
    selectActiveChild(child);
    navigate('/');
  };

  const handleAddChildClick = () => {
    setPinAction('add');
    setTargetChild(null);
    setPinInput('');
    setPinError(null);
    setIsPinModalOpen(true);
  };

  const handleDeleteChildClick = (child: ChildRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinAction('delete');
    setTargetChild(child);
    setPinInput('');
    setPinError(null);
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const pinRes = await enterParentMode(pinInput);
    if (!pinRes.success) {
      setPinError(pinRes.message || 'Incorrect PIN.');
      return;
    }

    setIsPinModalOpen(false);

    if (pinAction === 'add') {
      // Create new fresh child wizard profile and route to onboarding/child
      navigate('/onboarding/child');
    } else if (pinAction === 'delete' && targetChild) {
      await deleteChildProfile(targetChild.id, pinInput);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-sunny text-amber-900 items-center justify-center text-3xl shadow-md border-3 border-white">
            ⭐
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-slate-800">
            Who's practicing today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-md mx-auto">
            Choose your profile to step into your speaking adventure!
          </p>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {childrenList.map((child) => {
            const isCurrentActive = activeChild?.id === child.id;
            return (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child)}
                className={`group relative p-6 rounded-4xl bg-white border-3 cursor-pointer transition-all duration-200 hover:scale-102 hover:shadow-xl flex flex-col items-center text-center space-y-3 min-h-[160px] ${
                  isCurrentActive
                    ? 'border-amber-400 shadow-md ring-4 ring-amber-200'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sunny-100 to-amber-200 flex items-center justify-center text-4xl shadow-inner border-2 border-white">
                  {child.avatarId === 'lion' ? '🦁' : child.avatarId === 'sparky' ? '⭐' : '🌟'}
                </div>

                <div>
                  <h3 className="font-heading font-black text-xl text-slate-800 group-hover:text-amber-600">
                    {child.nickname}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Ages {child.ageBand} Tier
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-heading font-bold text-amber-700 bg-sunny-100 px-3 py-1 rounded-full">
                    {child.comfortLevel || 'Ready to speak'}
                  </span>
                </div>

                {/* Delete button (PIN protected) */}
                {childrenList.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteChildClick(child, e)}
                    aria-label={`Delete child ${child.nickname}`}
                    className="absolute top-3 right-3 p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Another Child Tile */}
          <div
            onClick={handleAddChildClick}
            className="p-6 rounded-4xl bg-white/70 border-3 border-dashed border-slate-300 hover:border-amber-400 hover:bg-white cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group"
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-100 group-hover:bg-sunny-100 flex items-center justify-center text-slate-400 group-hover:text-amber-700 transition-colors">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-700 group-hover:text-amber-700">
                Add Another Child
              </h3>
              <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5" /> Parent PIN Required
              </p>
            </div>
          </div>
        </div>

        {/* Parent Gate PIN Modal */}
        <Modal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          title="Parent Security Gate"
          icon={<Lock className="w-6 h-6 text-purple-600" />}
        >
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Please enter your 4-6 digit Parent PIN to {pinAction === 'add' ? 'add a new child profile' : 'delete this profile'}.
            </p>

            {pinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {pinError}
              </div>
            )}

            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter Parent PIN"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-center text-xl font-mono tracking-widest min-h-[56px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 min-h-[48px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="purple"
                size="md"
                className="flex-1 min-h-[48px]"
              >
                Verify PIN
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
