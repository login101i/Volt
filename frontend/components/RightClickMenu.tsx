'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuOption {
  label?: string | React.ReactNode;
  onClick?: () => void;
  action?: boolean;
  divider?: boolean;
}

export interface MenuContextRightClickProps {
  options: ContextMenuOption[];
  position: { top: number; left: number };
  onClose: () => void;
}

export const MenuContextRightClick: React.FC<MenuContextRightClickProps> = ({
  options,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedTop, setAdjustedTop] = useState(position.top);
  const [adjustedLeft, setAdjustedLeft] = useState(position.left);
  const [ready, setReady] = useState(false);

  const handleClick = (action: () => void) => {
    action();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) return;
    const menuHeight = menuRef.current.offsetHeight;
    const menuWidth = menuRef.current.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    let newTop = position.top;
    let newLeft = position.left;

    if (position.top + menuHeight > viewportHeight) {
      newTop = viewportHeight - menuHeight - 10;
      if (newTop < 0) newTop = 0;
    }
    if (position.left + menuWidth > viewportWidth) {
      newLeft = viewportWidth - menuWidth - 10;
      if (newLeft < 0) newLeft = 0;
    }
    setAdjustedTop(newTop);
    setAdjustedLeft(newLeft);
    setReady(true);
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200"
      style={{
        top: `${adjustedTop}px`,
        left: `${adjustedLeft}px`,
        opacity: ready ? 1 : 0,
        visibility: ready ? 'visible' : 'hidden',
        transition: 'opacity 0.15s ease',
        zIndex: 1001,
        minWidth: '200px',
      }}
    >
      <ul className="py-1">
        {options.map((option, index) => (
          <li key={index}>
            {option.divider ? (
              <hr className="my-1 border-t border-gray-200" />
            ) : (
              <div
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                  option.action ? 'font-semibold text-gray-900' : 'text-gray-700'
                }`}
                onClick={() => option.onClick && handleClick(option.onClick)}
              >
                {option.label}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};



















