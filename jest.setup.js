// Eagerly resolve all lazy getters installed by expo/src/winter/installGlobal.ts
// before tests run. This prevents a Jest 30 "import outside of test scope" error
// that occurs when lazy getters fire during module teardown.
const WINTER_GLOBALS = [
  '__ExpoImportMetaRegistry',
  'structuredClone',
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
];

for (const key of WINTER_GLOBALS) {
  try {
    // Accessing the property triggers the lazy getter, which runs the require()
    // inside the active Jest environment scope and caches the resolved value.
    void global[key];
  } catch (_) {
    // If resolution fails, install a safe stub so later accesses don't throw.
    if (!(key in global)) {
      Object.defineProperty(global, key, {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  }
}
