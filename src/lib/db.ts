import Dexie, { Table } from 'dexie';

export interface LocalKey {
  id: 'me';
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  exportedPublicKey: string; // Base64
}

export interface LocalContact {
  uid: string;
  displayName?: string;
  photoURL?: string;
  publicKey: string;
}

export interface LocalMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface SharedKey {
  chatId: string;
  key: CryptoKey;
}

export class CipherChatDB extends Dexie {
  keys!: Table<LocalKey>;
  contacts!: Table<LocalContact>;
  messages!: Table<LocalMessage>;
  sharedKeys!: Table<SharedKey>;

  constructor() {
    super('CipherChatDB');
    this.version(1).stores({
      keys: 'id',
      contacts: 'uid',
      messages: 'id, chatId, timestamp',
      sharedKeys: 'chatId'
    });
  }
}

export const localDb = new CipherChatDB();
