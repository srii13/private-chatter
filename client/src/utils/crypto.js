import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

export const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(keyPair.publicKey),
    privateKey: util.encodeBase64(keyPair.secretKey)
  };
};

export const encryptMessage = (message, receiverPublicKeyBase64, senderPrivateKeyBase64) => {
  const receiverPublicKey = util.decodeBase64(receiverPublicKeyBase64);
  const senderPrivateKey = util.decodeBase64(senderPrivateKeyBase64);
  
  const nonce = nacl.randomBytes(24);
  const messageUint8 = util.decodeUTF8(message);
  
  const encrypted = nacl.box(messageUint8, nonce, receiverPublicKey, senderPrivateKey);
  
  return {
    encryptedMessage: util.encodeBase64(encrypted),
    nonce: util.encodeBase64(nonce)
  };
};

export const decryptMessage = (encryptedMessageBase64, nonceBase64, senderPublicKeyBase64, receiverPrivateKeyBase64) => {
  try {
    const encryptedMessage = util.decodeBase64(encryptedMessageBase64);
    const nonce = util.decodeBase64(nonceBase64);
    const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
    const receiverPrivateKey = util.decodeBase64(receiverPrivateKeyBase64);
    
    const decrypted = nacl.box.open(encryptedMessage, nonce, senderPublicKey, receiverPrivateKey);
    
    if (!decrypted) {
      throw new Error('Could not decrypt message');
    }
    
    return util.encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted Message]';
  }
};
