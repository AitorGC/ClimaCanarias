const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix handleFirestoreError args
code = code.replace(
  'const msg = handleFirestoreError(error, OperationType.READ);',
  'const msg = handleFirestoreError(error, OperationType.GET, null);'
);

// Fix NotificationMessage type
code = code.replace(
  `const handleAddNotificationMessage = (title: string, message: string, type: 'info' | 'warning' | 'error') => {`,
  `const handleAddNotificationMessage = (title: string, message: string, type: 'info' | 'storm' | 'alert') => {`
);

fs.writeFileSync('src/App.tsx', code);
