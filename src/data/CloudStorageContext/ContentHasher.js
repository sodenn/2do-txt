import cryptoJS from "crypto-js";

/**
 * Computes a hash using the same algorithm that the Dropbox API uses for the
 * the "content_hash" metadata field.
 *
 * The `digest()` method returns a hexadecimal-encoded version
 * of the digest of the hash.
 * The "content_hash" field in the Dropbox API is a hexadecimal-encoded version
 * of the digest.
 *
 * Example:
 *
 *     import DropboxContentHasher from 'dropboxContentHasher'
 *
 *     let hasher = new DropboxContentHasher()
 *     hasher.update(content) // content is some string or CryptoJS.lib.WordArray
 *     return hasher.digest()
 */

const BLOCK_SIZE = 4 * 1024 * 1024;

class DropboxContentHasher {
  constructor() {
    this._overallHasher = cryptoJS.algo.SHA256.create();
    this._blockHasher = cryptoJS.algo.SHA256.create();
    this._blockPos = 0;
  }

  update(data) {
    let offset = 0;
    while (offset < data.length) {
      if (this._blockPos === BLOCK_SIZE) {
        this._overallHasher.update(this._blockHasher.finalize());
        this._blockHasher = cryptoJS.algo.SHA256.create();
        this._blockPos = 0;
      }
      let spaceInBlock = BLOCK_SIZE - this._blockPos;
      let inputPartEnd = Math.min(data.length, offset + spaceInBlock);
      let inputPartLength = inputPartEnd - offset;
      this._blockHasher.update(data.slice(offset, inputPartEnd));
      this._blockPos += inputPartLength;
      offset = inputPartEnd;
    }
  }

  digest() {
    if (this._blockPos > 0) {
      this._overallHasher.update(this._blockHasher.finalize());
      this._blockHasher = null;
    }
    let r = this._overallHasher.finalize().toString();
    this._overallHasher = null; // Make sure we can't use this object anymore.
    return r;
  }
}

/**
 *
 * @param text {string}
 * @returns {string}
 */
export default function generateContentHash(text) {
  const hasher = new DropboxContentHasher();
  hasher.update(text);
  return hasher.digest();
}
