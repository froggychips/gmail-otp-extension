export const storageGet = (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve));
export const storageSet = (values) => new Promise(resolve => chrome.storage.local.set(values, resolve));
export const storageRemove = (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve));
export const storageClear = () => new Promise(resolve => chrome.storage.local.clear(resolve));
