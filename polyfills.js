import 'react-native-get-random-values';
import { Readable } from 'readable-stream';
import { TextEncoder, TextDecoder } from 'text-encoding';

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Create a basic ReadableStream polyfill based on readable-stream
if (typeof global.ReadableStream === 'undefined') {
    global.ReadableStream = class ReadableStream {
        constructor(underlyingSource) {
            this._readable = new Readable({
                read: () => {},
                objectMode: true
            });

            if (underlyingSource && typeof underlyingSource.start === 'function') {
                const controller = {
                    enqueue: (chunk) => {
                        this._readable.push(chunk);
                    },
                    close: () => {
                        this._readable.push(null);
                    },
                    error: (err) => {
                        this._readable.destroy(err);
                    }
                };
                
                Promise.resolve().then(() => {
                    underlyingSource.start(controller);
                });
            }
        }

        getReader() {
            const stream = this._readable;
            let reading = false;

            return {
                read() {
                    if (reading) {
                        throw new Error('Cannot read from reader until previous read operation completes');
                    }
                    reading = true;

                    return new Promise((resolve) => {
                        stream.once('readable', () => {
                            const chunk = stream.read();
                            reading = false;
                            resolve({ value: chunk, done: chunk === null });
                        });
                    });
                },
                releaseLock() {
                    // No-op for this simple implementation
                },
                cancel() {
                    stream.destroy();
                    return Promise.resolve();
                }
            };
        }
    };
}