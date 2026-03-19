import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { EncryptionUtils } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';

export function useEncryption() {
  const { userProfile, updateUserProfile } = useUserStore();
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      if (!userProfile?.id) return;

      const keyPair = await EncryptionUtils.getOrCreateKeys();
      
      if (keyPair) {
        setKeys(keyPair);

        // Sync public key to profile if missing
        if (!userProfile.public_key || userProfile.public_key !== keyPair.publicKey) {
          try {
            await updateUserProfile({ public_key: keyPair.publicKey } as any);
          } catch (e) {
            console.error("PUB_KEY_SYNC_ERROR:", e);
          }
        }
      }
      
      setIsInitializing(false);
    }

    init();
  }, [userProfile?.id]);

  return {
    keys,
    isInitializing,
    encrypt: EncryptionUtils.encryptMessage,
    decrypt: EncryptionUtils.decryptMessage,
  };
}
