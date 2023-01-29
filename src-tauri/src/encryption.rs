use std::str;

use aes_gcm::aead::consts::U12;
use aes_gcm::aes::Aes256;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, AesGcm, Key, Nonce,
};
use keyring::Entry;
use rand::{distributions::Alphanumeric, thread_rng, Rng};

const NONCE_LENGTH: usize = 12;
static SERVICE: &'static str = "2do.txt Encryption Key";
static USERNAME: &'static str = "2do.txt";

fn retrieve_key() -> Result<String, keyring::Error> {
    let entry = Entry::new(SERVICE, USERNAME);
    match entry.get_password() {
        Ok(val) => Ok(val),
        Err(error) => match error {
            keyring::Error::NoEntry => {
                let new_key: String = thread_rng()
                    .sample_iter(&Alphanumeric)
                    .take(32)
                    .map(|x| x as char)
                    .collect();
                match entry.set_password(&new_key) {
                    Ok(_) => Ok(new_key),
                    Err(err) => Err(err),
                }
            }
            other_error => Err(other_error),
        },
    }
}

fn create_cipher() -> Result<AesGcm<Aes256, U12>, keyring::Error> {
    let raw_key = retrieve_key()?;
    let key = Key::<Aes256Gcm>::from_slice(&raw_key.as_bytes());
    Ok(Aes256Gcm::new(key))
}

pub fn encrypt(plaintext: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let cipher = create_cipher()?;
    let rnd: [u8; NONCE_LENGTH] = thread_rng().gen();
    let nonce = Nonce::from_slice(&rnd);
    let encrypted = cipher
        .encrypt(nonce, plaintext)
        .map_err(|err| err.to_string())?;
    let mut ciphertext = Vec::new();
    ciphertext.extend_from_slice(&rnd);
    ciphertext.extend(encrypted);
    Ok(ciphertext)
}

pub fn decrypt(encrypted: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    let cipher = create_cipher()?;
    let nonce = Nonce::from_slice(&encrypted[0..NONCE_LENGTH]);
    let decrypted = cipher
        .decrypt(nonce, &encrypted[NONCE_LENGTH..])
        .map_err(|err| err.to_string())?;
    let decrypted_str = String::from_utf8(decrypted.clone())?;
    Ok(decrypted_str)
}
