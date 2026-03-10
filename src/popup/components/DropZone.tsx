import { RefObject } from 'react';
import { useI18n } from '../i18n';

interface DropZoneProps {
  isDragging: boolean;
  fileRef: RefObject<HTMLInputElement>;
  onDragStateChange: (dragging: boolean) => void;
  onFile: (file: File) => void;
}

export function DropZone({ isDragging, fileRef, onDragStateChange, onFile }: DropZoneProps) {
  const { t } = useI18n();

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); onDragStateChange(true); }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragStateChange(false);
        if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      onClick={() => fileRef.current?.click()}
    >
      <div className="drop-icon"><i className="fa-solid fa-cloud-arrow-up" /></div>
      <p className="drop-title">{t('drop.title')}</p>
      <span className="drop-sub">{t('drop.sub')}</span>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
        hidden
      />
    </div>
  );
}
