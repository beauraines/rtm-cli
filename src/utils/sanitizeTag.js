'use strict';

// This is used for the Obsidian reformatting


function sanitizeTag(tag) {
  if (typeof tag !== 'string') return tag;
  if (tag.startsWith('@')) {
    return `context/${tag.slice(1)}`;
  }
  return tag;
}

module.exports = sanitizeTag;
