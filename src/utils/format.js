'use strict';

const { RRule } = require('rrule');
const { parse: parseIso } = require('iso8601-duration');

/**
 * Convert an ISO8601 duration string (e.g. "PT1H30M") into a human-readable string.
 * @param {string} iso
 * @returns {string}
 */
function humanizeDuration(iso) {
  if (typeof iso !== 'string') return '';
  let dur;
  try {
    dur = parseIso(iso);
  } catch (e) {
    return iso;
  }
  const parts = [];
  if (dur.years) parts.push(`${dur.years} year${dur.years > 1 ? 's' : ''}`);
  if (dur.months) parts.push(`${dur.months} month${dur.months > 1 ? 's' : ''}`);
  if (dur.days) parts.push(`${dur.days} day${dur.days > 1 ? 's' : ''}`);
  if (dur.hours) parts.push(`${dur.hours} hour${dur.hours > 1 ? 's' : ''}`);
  if (dur.minutes) parts.push(`${dur.minutes} minute${dur.minutes > 1 ? 's' : ''}`);
  if (dur.seconds) parts.push(`${dur.seconds} second${dur.seconds > 1 ? 's' : ''}`);
  return parts.length ? parts.join(' ') : iso;
}

/**
 * Convert a recurrence rule object with property $t (RFC5545 string) into a human-readable string.
 * @param {object} rawRule
 * @returns {string}
 */
function humanizeRecurrence(rawRule) {
  if (!rawRule || typeof rawRule.$t !== 'string') return '';
  try {
    return RRule.fromString(rawRule.$t).toText();
  } catch (e) {
    return rawRule.$t;
  }
}

module.exports = { humanizeDuration, humanizeRecurrence };