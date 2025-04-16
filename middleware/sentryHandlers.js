const Sentry = require('@sentry/node');

const sentryRequestHandler =
  (Sentry.Handlers && Sentry.Handlers.requestHandler && Sentry.Handlers.requestHandler()) ||
  ((req, res, next) => next());
const sentryErrorHandler =
  (Sentry.Handlers && Sentry.Handlers.errorHandler && Sentry.Handlers.errorHandler()) ||
  ((err, req, res, next) => next(err));

module.exports = { sentryRequestHandler, sentryErrorHandler };
