import { Writable } from 'stream'

export class MyWritable extends Writable {
  constructor(writable) {
    super()
    this._writable = writable
  }

  _write(chunk, encoding, callback) {
    // Finally write whatever React tried to write.
    this._writable.write(chunk, encoding, callback)
  }

  flush() {
    if (typeof this._writable.flush === 'function') {
      this._writable.flush()
    }
  }
}
