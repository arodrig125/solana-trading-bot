const Sentry = require('@sentry/node');

const sentryRequestHandler = Sentry.Handlers.requestHandler();
const sentryErrorHandler = Sentry.Handlers.errorHandler();

module.exports = { sentryRequestHandler, sentryErrorHandler };
