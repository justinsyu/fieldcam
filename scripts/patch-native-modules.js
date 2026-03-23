// Patches native modules that are missing c++_shared link on NDK 27+
// Run automatically via postinstall in package.json
const fs = require('fs');
const path = require('path');

function patchFile(relPath, description) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('c++_shared')) {
    console.log(`  [skip] ${relPath} (already patched)`);
    return;
  }
  // Add c++_shared to every target_link_libraries block that has 'android' but not 'c++_shared'
  content = content.replace(
    /(\btarget_link_libraries\b[^)]*\bandroid\b)(\s*\))/g,
    '$1\n        c++_shared$2'
  );
  fs.writeFileSync(filePath, content);
  console.log(`  [patch] ${relPath} - ${description}`);
}

patchFile(
  'node_modules/react-native-worklets/android/CMakeLists.txt',
  'add c++_shared for NDK 27 compatibility'
);
patchFile(
  'node_modules/react-native-screens/android/CMakeLists.txt',
  'add c++_shared for NDK 27 compatibility'
);

console.log('Native module patches applied.');
