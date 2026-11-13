import { useTranslation } from 'react-i18next';
import { ALL_DAYS, WEEKDAYS, dayName, isEveryDay, isWeekdaysOnly, toggleDay, type IsoDay } from '../domain/workdays';
import { FieldError } from '../features/admin/forms';

interface Props {
  days: IsoDay[];
  onChange: (days: IsoDay[]) => void;
  /** Legend of the group. */
  label: string;
  hint: string;
  /** i18n key of the error shown under the group. */
  error?: string;
  /** Unique within the page (links the hint and the error to the group). */
  id: string;
}

/** Seven day chips plus "weekdays" / "every day" shortcuts. Used for a person's and for a crew's working days. */
export function DaysPicker({ days, onChange, label, hint, error, id }: Props) {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  return (
    <fieldset className="group" aria-describedby={error ? `${id}-err` : `${id}-hint`}>
      <legend>{label}</legend>
      <p className="hint" id={`${id}-hint`} style={{ marginBlockEnd: 8 }}>{hint}</p>
      <div className="layer-toggles" role="group" aria-label={label}>
        {ALL_DAYS.map((d) => (
          <button key={d} type="button" className="chip" aria-pressed={days.includes(d)} aria-label={dayName(d, i18n.language, 'long')} title={dayName(d, i18n.language, 'long')} onClick={() => onChange(toggleDay(days, d))}>
            {dayName(d, i18n.language)}
          </button>
        ))}
      </div>
      <div className="flags" style={{ marginBlockStart: 8 }}>
        <button type="button" className="btn" aria-pressed={isWeekdaysOnly(days)} onClick={() => onChange([...WEEKDAYS])}>{t('st.daysWeekdays')}</button>
        <button type="button" className="btn" aria-pressed={isEveryDay(days)} onClick={() => onChange([...ALL_DAYS])}>{t('st.daysEvery')}</button>
      </div>
      <FieldError id={`${id}-err`} k={error} />
    </fieldset>
  );
}
