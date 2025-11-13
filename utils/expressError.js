class ExpressError extends Error {
    constructor(message, statusCode = 500) {
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = { ExpressError };
