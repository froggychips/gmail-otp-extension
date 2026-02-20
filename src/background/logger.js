class BufferedLogger {
    constructor() {
        this.buffer = [];
        this.bufferSize = 10; // number of logs to keep in the buffer
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${message}`;
        this.buffer.push(logEntry);
        this.checkBuffer();
    }

    checkBuffer() {
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    }

    flush() {
        console.log(this.buffer.join('\n'));
        this.buffer = [];
    }
}

// Export the BufferedLogger class
module.exports = BufferedLogger;