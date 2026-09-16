import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const MoodSelector = React.memo(function MoodSelector({ playlists = [], activePlaylistId, onSelectPlaylist }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (id) => {
    onSelectPlaylist(id);
    closeMenu();
  };

  return (
    <div className="mood-selector-container">
      <button
        type="button"
        className={`nav-link nav-link-btn mood-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="मूड चुनें (Select Mood)"
      >
        मूड
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="mood-dropdown-backdrop"
              onClick={closeMenu}
              style={{ position: 'fixed', inset: 0, zIndex: 190 }}
            />
            <motion.div
              className="mood-dropdown-menu"
              style={{ zIndex: 200 }}
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
                  const isUpcoming = Boolean(playlist.isUpcoming);
                  return (
                    <button
                      key={playlist.id}
                      type="button"
                      className={`mood-option-item ${isSelected ? 'selected' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                      onClick={() => !isUpcoming && handleSelect(playlist.id)}
                      role="option"
                      aria-selected={isSelected}
                      disabled={isUpcoming}
                    >
                      <div className="mood-option-header-row">
                        <span className="mood-option-title">{playlist.name}</span>
                        {isUpcoming && <span className="mood-upcoming-badge">शीघ्र</span>}
                      </div>
                      <span className="mood-option-desc">{playlist.description}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
