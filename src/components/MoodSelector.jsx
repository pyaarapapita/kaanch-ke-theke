import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const MoodSelector = React.memo(function MoodSelector({ playlists = [], activePlaylistId, onSelectPlaylist }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id) => {
    onSelectPlaylist(id);
    closeMenu();
  };

  return (
    <div className="mood-selector-container">
      <button
        ref={buttonRef}
        type="button"
        className={`mood-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="मूड चुनें (Select Mood)"
      >
        मूड
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="mood-dropdown-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mood-dropdown-header">
              <span className="mood-dropdown-title" id="mood-dropdown-title">मूड चुनिए</span>
            </div>

            <div className="mood-options-list" role="listbox" aria-labelledby="mood-dropdown-title">
              {playlists.map((playlist) => {
                const isSelected = playlist.id === activePlaylistId;
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    className={`mood-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(playlist.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="mood-option-title">{playlist.name}</span>
                    <span className="mood-option-desc">{playlist.description}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
