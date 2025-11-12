import validator from 'validator';

const MAX_LENGTH = 4000;

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    let sanitized = validator.trim(value);
    sanitized = validator.stripLow(sanitized, true);
    sanitized = validator.blacklist(sanitized, "<>`$");
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.slice(0, MAX_LENGTH);
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }

  return value;
};

export const sanitizeObject = (objectValue) => {
  if (!objectValue || typeof objectValue !== 'object') {
    return objectValue;
  }

  const sanitized = Array.isArray(objectValue) ? [] : {};

  Object.entries(objectValue).forEach(([key, val]) => {
    sanitized[key] = sanitizeValue(val);
  });

  return sanitized;
};

export const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  return next();
};
