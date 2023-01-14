use std::str;

use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, AesGcm, Key, Nonce};
use aes_gcm::aead::consts::U12;
use aes_gcm::aes::Aes256;
use keyring::Entry;
use rand::{distributions::Alphanumeric, Rng, thread_rng};

const NONCE_LENGTH: usize = 12;
static SERVICE: &'static str = "2do.txt Secure Storage";
static USERNAME: &'static str = "2do.txt";

fn create_cipher() -> AesGcm<Aes256, U12> {
  let cipher: AesGcm<Aes256, U12>;
  let entry = Entry::new(SERVICE, USERNAME);
  let key_str = entry.get_password().unwrap_or_else(|_error| {
    return String::from("");
  });
  if key_str.is_empty() {
    let raw_key: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(|x| x as char)
        .collect();
    let key = Key::<Aes256Gcm>::from_slice(&raw_key.as_bytes());
    cipher = Aes256Gcm::new(&key);
    entry.set_password(&raw_key).unwrap();
  } else {
    let slice = key_str.as_bytes();
    let key = Key::<Aes256Gcm>::from_slice(&slice);
    cipher = Aes256Gcm::new(key);
  }
  cipher
}

pub fn encrypt(plaintext: &[u8]) -> Vec<u8> {
  let cipher = create_cipher();
  let rnd: [u8; NONCE_LENGTH] = thread_rng().gen();
  let nonce = Nonce::from_slice(&rnd);
  let encrypted = cipher.encrypt(nonce, plaintext).unwrap();
  let mut ciphertext = Vec::new();
  ciphertext.extend_from_slice(&rnd);
  ciphertext.extend(encrypted);
  ciphertext
}

pub fn decrypt(encrypted: &[u8]) -> String {
  let cipher = create_cipher();
  let nonce = Nonce::from_slice(&encrypted[0..NONCE_LENGTH]);
  let decrypted = cipher.decrypt(nonce, &encrypted[NONCE_LENGTH..]).unwrap();
  String::from_utf8(decrypted.clone()).unwrap()
}
