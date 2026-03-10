import { useI18n } from '../i18n';

const GITHUB_URL = 'https://github.com/riki449/chrome-ext-lark-md-to-docs';
const VERSION = '1.0.0';

interface AboutPanelProps {
  open: boolean;
  onToggle: (open: boolean) => void;
}

export function AboutPanel({ open, onToggle }: AboutPanelProps) {
  const { t } = useI18n();

  if (!open) {
    return (
      <footer className="footer">
        <button className="about-trigger" onClick={() => onToggle(true)}>
          <span>{t('footer.text')}</span>
          <span className="about-ver">v{VERSION}</span>
        </button>
      </footer>
    );
  }

  return (
    <>
      <footer className="footer">
        <button className="about-trigger" onClick={() => onToggle(false)}>
          <span>{t('footer.text')}</span>
          <span className="about-ver">v{VERSION}</span>
        </button>
      </footer>
      <div className="about-overlay" onClick={() => onToggle(false)}>
        <div className="about-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="about-header">
            <img src="../icons/icon-128.png" alt="MD to Lark" className="about-logo" />
            <div>
              <h2 className="about-title">MD → Lark Docs</h2>
              <span className="about-version">v{VERSION}</span>
            </div>
            <button className="about-close" onClick={() => onToggle(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Description */}
          <p className="about-desc">{t('about.desc')}</p>

          {/* Features mini */}
          <div className="about-features">
            <div className="about-feat"><i className="fa-solid fa-file-import" /><span>{t('about.feat1')}</span></div>
            <div className="about-feat"><i className="fa-solid fa-diagram-project" /><span>{t('about.feat2')}</span></div>
            <div className="about-feat"><i className="fa-solid fa-image" /><span>{t('about.feat3')}</span></div>
            <div className="about-feat"><i className="fa-solid fa-language" /><span>{t('about.feat4')}</span></div>
          </div>

          {/* GitHub CTA */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="about-github-btn"
          >
            <i className="fa-brands fa-github" />
            <span>{t('about.starCta')}</span>
            <i className="fa-solid fa-star about-star-icon" />
          </a>

          {/* Links */}
          <div className="about-links">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-github" /> GitHub
            </a>
            <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-bug" /> {t('about.report')}
            </a>
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-scale-balanced" /> MIT License
            </a>
          </div>

          {/* Credits */}
          <p className="about-credits">{t('about.credits')}</p>
        </div>
      </div>
    </>
  );
}
