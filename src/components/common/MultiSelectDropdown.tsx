import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface MultiSelectDropdownProps {
  id?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: string[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  label,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  options,
  selected = [],
  onChange,
  error,
  required = false,
  disabled = false,
  helpText,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (disabled) return;
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeChip = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter((item) => item !== option));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  // Filter options based on search term (case-insensitive)
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="multi-select-container" ref={containerRef}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}

      {/* Selected Chips Area */}
      {selected.length > 0 && (
        <div className="multi-select-chips" aria-label={`Selected ${label || 'options'}`}>
          {selected.map((item) => (
            <span key={item} className="multi-select-chip">
              <span className="multi-select-chip-text">{item}</span>
              <button
                type="button"
                className="multi-select-chip-remove"
                onClick={(e) => removeChip(e, item)}
                aria-label={`Remove ${item}`}
                disabled={disabled}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          {selected.length > 1 && !disabled && (
            <button
              type="button"
              className="multi-select-clear-all"
              onClick={handleClearAll}
              aria-label="Clear all selections"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown Toggle Button */}
      <div
        id={inputId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${inputId}-listbox`}
        tabIndex={disabled ? -1 : 0}
        className={`multi-select-toggle form-input ${isOpen ? 'active' : ''} ${error ? 'is-invalid' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className="multi-select-toggle-text">
          {selected.length === 0 ? (
            <span className="multi-select-placeholder">{placeholder}</span>
          ) : (
            <span className="multi-select-selected-count">
              {selected.length} {selected.length === 1 ? 'selected' : 'selected'}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`multi-select-chevron ${isOpen ? 'open' : ''}`}
          aria-hidden="true"
        />
      </div>

      {/* Dropdown Popover Menu */}
      {isOpen && (
        <div className="multi-select-popover" role="dialog" aria-modal="false">
          {/* Search Input */}
          <div className="multi-select-search-wrap">
            <Search size={14} className="multi-select-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="multi-select-search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={searchPlaceholder}
            />
            {searchTerm && (
              <button
                type="button"
                className="multi-select-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search text"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <ul
            id={`${inputId}-listbox`}
            role="listbox"
            aria-multiselectable="true"
            className="multi-select-options-list"
          >
            {filteredOptions.length === 0 ? (
              <li className="multi-select-no-results">
                No matching options found
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleOption(option)}
                  >
                    <div
                      className={`multi-select-checkbox ${isSelected ? 'checked' : ''}`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="multi-select-option-label">{option}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {helpText && <span className="form-helper">{helpText}</span>}
      {error && (
        <span className="form-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

