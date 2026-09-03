import localforage from 'localforage';

localforage.config({
  name: 'ClimaCanarias',
  storeName: 'appData'
});

export const storage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await localforage.getItem<T>(key);
      return value !== null ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await localforage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await localforage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};
