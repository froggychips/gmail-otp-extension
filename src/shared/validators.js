export const VALIDATORS = {
  gmailQuery: (val) => {
    const str = String(val || "").trim();
    if (str.length > 500) throw new Error("Query too long");
    // Basic injection check
    const dangerous = ['script', 'eval', 'fetch', '<', '>'];
    if (dangerous.some(word => str.toLowerCase().includes(word))) throw new Error("Invalid characters");
    return str;
  },
  threshold: (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) throw new Error("Threshold out of range");
    return num;
  }
};
