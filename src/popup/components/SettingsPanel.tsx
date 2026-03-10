import { useEffect, useRef, useState } from 'react';
import { Theme } from '../hooks/useTheme';
import { Locale, LOCALE_FLAGS, LOCALE_LABELS, useI18n } from '../i18n';
import { DiagramMode } from '../types';

interface SettingsPanelProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  diagramMode: DiagramMode;
  onDiagramModeChange: (mode: DiagramMode) => void;
  useFirstLineTitle: boolean;
  onUseFirstLineTitleChange: (v: boolean) => void;
  onShowAbout: () => void;
}

const THEME_ICONS: Record<Theme, string> = {
  light: 'fa-sun',
  dark: 'fa-moon',
  system: 'fa-desktop',
};

const LOCALES: Locale[] = ['en', 'vi', 'zh'];

export function SettingsPanel({
  theme, onThemeChange,
  diagramMode, onDiagramModeChange,
  useFirstLineTitle, onUseFirstLineTitleChange,
  onShowAbout,
}: SettingsPanelProps) {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<'none' | 'appearance' | 'language'>('none');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubMenu('none');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const closeAll = () => { setOpen(false); setSubMenu('none'); };

  // --- Sub-menu: Appearance ---
  if (open && subMenu === 'appearance') {
    return (
      <div className="settings-toggle" ref={ref}>
        <button className="settings-btn active" onClick={closeAll} title="Settings">
          <i className="fa-solid fa-gear" />
        </button>
        <div className="settings-dropdown">
          <button className="settings-back" onClick={() => setSubMenu('none')}>
            <i className="fa-solid fa-arrow-left" /> {t('settings.appearance')}
          </button>
          {(['light', 'dark', 'system'] as Theme[]).map((v) => (
            <button
              key={v}
              className={`settings-option ${theme === v ? 'active' : ''}`}
              onClick={() => onThemeChange(v)}
            >
              <i className={`fa-solid ${THEME_ICONS[v]} settings-opt-icon`} />
              <span>{t(`settings.${v}`)}</span>
              {theme === v && <i className="fa-solid fa-check settings-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Sub-menu: Language ---
  if (open && subMenu === 'language') {
    return (
      <div className="settings-toggle" ref={ref}>
        <button className="settings-btn active" onClick={closeAll} title="Settings">
          <i className="fa-solid fa-gear" />
        </button>
        <div className="settings-dropdown">
          <button className="settings-back" onClick={() => setSubMenu('none')}>
            <i className="fa-solid fa-arrow-left" /> {t('settings.language')}
          </button>
          {LOCALES.map((l) => (
            <button
              key={l}
              className={`settings-option ${locale === l ? 'active' : ''}`}
              onClick={() => setLocale(l)}
            >
              <span className="settings-opt-icon settings-flag">{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
              {locale === l && <i className="fa-solid fa-check settings-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Main menu ---
  return (
    <div className="settings-toggle" ref={ref}>
      <button className="settings-btn" onClick={() => setOpen(!open)} title="Settings">
        <i className="fa-solid fa-gear" />
      </button>
      {open && (
        <div className="settings-dropdown">
          <button className="settings-option" onClick={() => setSubMenu('appearance')}>
            <i className="fa-solid fa-palette settings-opt-icon" />
            <span>{t('settings.appearance')}</span>
            <span className="settings-value">{t(`settings.${theme}`)}</span>
            <i className="fa-solid fa-chevron-right settings-chevron" />
          </button>

          <button className="settings-option" onClick={() => setSubMenu('language')}>
            <i className="fa-solid fa-globe settings-opt-icon" />
            <span>{t('settings.language')}</span>
            <span className="settings-value">{LOCALE_LABELS[locale]}</span>
            <i className="fa-solid fa-chevron-right settings-chevron" />
          </button>

          <div className="settings-divider" />

          <div className="settings-label">{t('settings.diagrams')}</div>
          <button
            className={`settings-option ${diagramMode === 'image' ? 'active' : ''}`}
            onClick={() => onDiagramModeChange('image')}
          >
            <i className="fa-regular fa-image settings-opt-icon" />
            <span>{t('settings.renderImage')}</span>
            {diagramMode === 'image' && <i className="fa-solid fa-check settings-check" />}
          </button>
          <button
            className={`settings-option ${diagramMode === 'code' ? 'active' : ''}`}
            onClick={() => onDiagramModeChange('code')}
          >
            <i className="fa-solid fa-code settings-opt-icon" />
            <span>{t('settings.keepCode')}</span>
            {diagramMode === 'code' && <i className="fa-solid fa-check settings-check" />}
          </button>

          <div className="settings-divider" />

          <button
            className="settings-option"
            onClick={() => onUseFirstLineTitleChange(!useFirstLineTitle)}
          >
            <i className="fa-solid fa-heading settings-opt-icon" />
            <span>{t('settings.firstLineTitle')}</span>
            <div className={`settings-switch ${useFirstLineTitle ? 'on' : ''}`}>
              <div className="settings-switch-dot" />
            </div>
          </button>

          <div className="settings-divider" />

          <button
            className="settings-option"
            onClick={() => { closeAll(); onShowAbout(); }}
          >
            <i className="fa-solid fa-circle-info settings-opt-icon" />
            <span>{t('about.info')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
