import { Theme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { DiagramMode } from '../types';
import { SettingsPanel } from './SettingsPanel';

interface HeaderProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  diagramMode: DiagramMode;
  onDiagramModeChange: (mode: DiagramMode) => void;
  useFirstLineTitle: boolean;
  onUseFirstLineTitleChange: (v: boolean) => void;
  onShowAbout: () => void;
}

export function Header({
  theme, onThemeChange,
  diagramMode, onDiagramModeChange,
  useFirstLineTitle, onUseFirstLineTitleChange,
  onShowAbout,
}: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className="header">
      <div className="h-left">
        <div className="logo"><img src="../icons/icon-48.png" alt="MD to Lark" className="logo-img" /></div>
        <div>
          <h1 className="title">{t('header.title')}</h1>
          <p className="subtitle">{t('header.subtitle')}</p>
        </div>
      </div>
      <div className="h-right">
        <SettingsPanel
          theme={theme}
          onThemeChange={onThemeChange}
          diagramMode={diagramMode}
          onDiagramModeChange={onDiagramModeChange}
          useFirstLineTitle={useFirstLineTitle}
          onUseFirstLineTitleChange={onUseFirstLineTitleChange}
          onShowAbout={onShowAbout}
        />
        <button className="close-btn" onClick={() => {
          if (window.parent !== window) {
            window.parent.postMessage({ source: 'md2lark', type: 'CLOSE_SIDEBAR' }, '*');
          } else {
            window.close();
          }
        }} title="Close panel">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </header>
  );
}
