import { useApp } from '../../contexts/useApp';

/**
 * Toggle button that switches between Thousands View and Full Value View.
 * Styled as a two-option pill matching the language toggle in TopBar.
 *
 * Thousands: "عرض بالألف" / "Thousands"  — SAR values shown as ألف ريال
 * Full:      "عرض كامل"  / "Full Value"  — actual SAR amounts
 */
export default function DisplayModeToggle() {
  const { displayMode, toggleDisplayMode, t } = useApp();
  const isThousands = displayMode === 'thousands';

  return (
    <button
      className="lang-btn"
      onClick={toggleDisplayMode}
      title={isThousands ? t('dmFullTitle') : t('dmThousandsTitle')}
      style={{ minWidth: 0 }}
    >
      <span
        style={{
          color:      isThousands ? 'var(--rasf-primary)' : 'var(--text-muted)',
          fontWeight: isThousands ? 700 : 400,
        }}
      >
        {isThousands ? '✓ ' : ''}{t('dmThousands')}
      </span>
      <span style={{ color: 'var(--border-mid)' }}>|</span>
      <span
        style={{
          color:      !isThousands ? 'var(--rasf-primary)' : 'var(--text-muted)',
          fontWeight: !isThousands ? 700 : 400,
        }}
      >
        {!isThousands ? '✓ ' : ''}{t('dmFull')}
      </span>
    </button>
  );
}
