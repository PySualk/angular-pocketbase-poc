migrate(
  (app) => {
    const email = $os.getenv('TEST_USER_EMAIL') || 'test@example.com';
    const password = $os.getenv('TEST_USER_PASSWORD') || 'testpassword123';

    // Idempotent: skip if the test user already exists
    try {
      app.findAuthRecordByEmail('users', email);
      return;
    } catch (_) {
      // user does not exist — create it
    }

    const collection = app.findCollectionByNameOrId('users');
    const record = new Record(collection);
    record.set('email', email);
    record.set('password', password);
    record.set('passwordConfirm', password);
    app.save(record);
  },
  (app) => {
    const email = $os.getenv('TEST_USER_EMAIL') || 'test@example.com';
    try {
      const user = app.findAuthRecordByEmail('users', email);
      app.delete(user);
    } catch (_) {
      // already gone
    }
  },
);
