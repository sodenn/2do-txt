use std::str;

use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, AesGcm, Key, Nonce};
use aes_gcm::aead::consts::U12;
use aes_gcm::aes::Aes256;
use keyring::{Entry,Error};
use rand::{distributions::Alphanumeric, Rng, thread_rng};

const NONCE_LENGTH: usize = 12;
static SERVICE: &'static str = "2do.txt Encryption Key";
static USERNAME: &'static str = "2do.txt";

fn retrieve_key() -> String {
  let entry = Entry::new(SERVICE, USERNAME);
  let key = match entry.get_password() {
    Ok(val) => val,
    Err(error) => match error {
      Error::NoEntry => {
        let new_key: String = thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(|x| x as char)
            .collect();
        entry.set_password(&new_key).unwrap();
        return new_key
      },
      other_error => {
        panic!("Problem retrieving key: {:?}", other_error);
      }
    },
  };
  key
}

fn create_cipher() -> AesGcm<Aes256, U12> {
  let raw_key = retrieve_key();
  let key = Key::<Aes256Gcm>::from_slice(&raw_key.as_bytes());
  Aes256Gcm::new(key)
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
