const mem = new Map<string, string>()

const storage: Storage = {
  getItem: (key) => mem.get(key) ?? null,
  setItem: (key, value) => {
    mem.set(key, value)
  },
  removeItem: (key) => {
    mem.delete(key)
  },
  clear: () => mem.clear(),
  key: (index) => [...mem.keys()][index] ?? null,
  get length() {
    return mem.size
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
})
