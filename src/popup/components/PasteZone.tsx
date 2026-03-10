import { RefObject, useCallback, useRef } from 'react';
import { useI18n } from '../i18n';

interface PasteZoneProps {
  textRef: RefObject<HTMLTextAreaElement>;
  onContent?: (text: string) => void;
}

export function PasteZone({ textRef, onContent }: PasteZoneProps) {
  const { t } = useI18n();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fireContent = useCallback(() => {
    const text = textRef.current?.value?.trim();
    if (text && onContent) onContent(text);
  }, [textRef, onContent]);

  const handleBlur = () => fireContent();

  const handleInput = () => {
    // Debounce input so we don't fire on every keystroke
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fireContent, 300);
  };

  const handlePaste = () => {
    // On native paste, fire immediately after value updates
    clearTimeout(debounceRef.current);
    setTimeout(fireContent, 0);
  };

  return (
    <div className="paste-zone">
      <textarea
        ref={textRef}
        className="paste-input"
        placeholder={t('paste.placeholder')}
        onBlur={handleBlur}
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
}
