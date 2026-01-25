function saveValueByKey(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readValueByKey(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeValueByKey(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export { saveValueByKey, readValueByKey, removeValueByKey };
