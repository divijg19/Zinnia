// @ts-check

import { isLocaleAvailable } from '../translations.js';
import { setErrorCacheHeaders } from './cache.js';
import { renderError } from './utils.js';

export const extractErrorMessages = (err) => {
  const hasMessage = err && typeof err === 'object' && 'message' in err && err.message;
  const hasSecondary = err && typeof err === 'object' && 'secondaryMessage' in err && err.secondaryMessage;
  const message = hasMessage ? String(err.message) : 'Something went wrong';
  const secondaryMessage = hasSecondary ? String(err.secondaryMessage) : undefined;
  return { message, secondaryMessage };
};

export const handleApiError = ({ res, err, title_color, text_color, bg_color, border_color, theme }) => {
  setErrorCacheHeaders(res);
  const { message, secondaryMessage } = extractErrorMessages(err);
  return res.send(renderError({ message, secondaryMessage, renderOptions: { title_color, text_color, bg_color, border_color, theme } }));
};

export const validateLocale = ({ locale, res, title_color, text_color, bg_color, border_color, theme }) => {
  if (locale && !isLocaleAvailable(locale)) {
    res.send(renderError({ message: 'Something went wrong', secondaryMessage: 'Language not found', renderOptions: { title_color, text_color, bg_color, border_color, theme } }));
    return true;
  }
  return false;
};

export const toNum = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? undefined : n;
};

export const setSvgHeaders = (res) => {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};
