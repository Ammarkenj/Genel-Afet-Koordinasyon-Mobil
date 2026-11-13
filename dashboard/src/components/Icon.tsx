import { ICON_PATHS, type IconName } from './iconPaths';

interface Props {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  /** Directional icons (back, next) mirror in RTL. */
  flip?: boolean;
}

/** Decorative icon: the text next to it carries the meaning (rule: every state = icon + text). */
export function Icon({ name, size = 'md', flip }: Props) {
  return (
    <svg
      className={`ic ${size === 'md' ? '' : size}${flip ? ' flip' : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      // Static, trusted path data from our own icon table.
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}

/** Same icon as an HTML string, for Leaflet marker icons. */
export const iconSvg = (name: IconName, size: 'sm' | 'md' | 'lg' = 'sm') =>
  `<svg class="ic ${size === 'md' ? '' : size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
