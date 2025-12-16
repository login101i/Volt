'use client';

import { useState } from 'react';
import GlobalPopup from '@/components/GlobalPopup';

interface AddRoomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roomName: string) => void;
}

export default function AddRoomPopup({ isOpen, onClose, onConfirm }: AddRoomPopupProps) {
  const [roomName, setRoomName] = useState('');

  const handleConfirm = () => {
    if (roomName.trim()) {
      onConfirm(roomName.trim());
      setRoomName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setRoomName('');
    onClose();
  };

  return (
    <GlobalPopup isOpen={isOpen} onClose={handleCancel} title="Nazwa pomieszczenia">
      <div className="space-y-4">
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
            Podaj nazwę pomieszczenia:
          </label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="np. Kuchnia, Sypialnia..."
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 placeholder-gray-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm();
              }
            }}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            disabled={!roomName.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Potwierdź
          </button>
        </div>
      </div>
    </GlobalPopup>
  );
}

