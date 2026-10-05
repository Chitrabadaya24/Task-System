const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Server error',
    code: err.code || 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;
