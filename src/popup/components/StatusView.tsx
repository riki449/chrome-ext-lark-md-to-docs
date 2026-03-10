import { useI18n } from '../i18n';
import { Status } from '../types';

interface StatusViewProps {
  status: Extract<Status, 'loading' | 'converting' | 'success' | 'error'>;
  fileName: string;
  error: string;
  progress: string;
  insertMethod: string;
  onReset: () => void;
}

export function StatusView({ status, fileName, error, progress, insertMethod, onReset }: StatusViewProps) {
  const { t } = useI18n();

  if (status === 'loading') {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p>{t('status.reading', { fileName })}</p>
      </div>
    );
  }

  if (status === 'converting') {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p className="convert-msg">{t('status.converting')}</p>
        {progress && <span className="progress-text">{progress}</span>}
      </div>
    );
  }

  if (status === 'success') {
    const isPaste = insertMethod === 'paste';
    const isClipboard = insertMethod === 'clipboard';
    const isDownload = insertMethod === 'download';

    return (
      <div className="center-state success-state">
        <i className={`fa-solid ${isDownload ? 'fa-download' : isPaste ? 'fa-circle-check' : 'fa-clipboard-check'} status-icon success-icon`} />
        <p>{isDownload ? t('status.downloadSuccess') : isPaste ? t('status.insertSuccess') : t('status.clipboardSuccess')}</p>
        {isPaste && <span className="success-sub">{t('status.successSub', { fileName })}</span>}
        {isDownload && <span className="success-sub">{t('status.downloadSub', { fileName })}</span>}
        {isClipboard && (
          <span className="clipboard-hint">
            {t('status.clipboardHint')}
          </span>
        )}
        <button className="btn btn-p" onClick={onReset} style={{ marginTop: 16 }}>
          <i className="fa-solid fa-rotate" /> {t('status.importAnother')}
        </button>
      </div>
    );
  }

  return (
    <div className="center-state error-state">
      <i className="fa-solid fa-circle-xmark status-icon error-icon" />
      <p>{error}</p>
      <button className="btn btn-p" onClick={onReset} style={{ marginTop: 16 }}>
        <i className="fa-solid fa-rotate-right" /> {t('status.tryAgain')}
      </button>
    </div>
  );
}
