/** Shared tooltip props for icon buttons (styled CSS tooltip via data-tip).
 *  @param {string} label
 *  @param {'below'|'right'} [pos] — use for top-edge controls so the tip isn’t clipped
 */
export function tipProps(label, pos) {
  return {
    'aria-label': label,
    'data-tip': label,
    ...(pos ? { 'data-tip-pos': pos } : {}),
  }
}
