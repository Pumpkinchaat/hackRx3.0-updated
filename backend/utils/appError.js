class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
  
      this.isOperational = true;
      // this is for the operational errors (errors except programming errors and package bugs)
  
      Error.captureStackTrace(this, this.constructor); // this class will not pollute the stackTrace
    }
  }
  
  module.exports = AppError;
  