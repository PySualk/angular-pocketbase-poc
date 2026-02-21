migrate(
  (app) => {
    const settings = app.settings();
    settings.meta.appUrl = 'http://localhost:4200';
    settings.smtp.enabled = true;
    settings.smtp.host = 'mailpit';
    settings.smtp.port = 1025;
    settings.smtp.fromAddress = 'noreply@localhost';
    settings.smtp.fromName = 'PocketBase';
    app.save(settings);

    const usersCollection = app.findCollectionByNameOrId('users');
    usersCollection.resetPasswordTemplate.actionUrl = '{APP_URL}/auth/confirm-reset';
    app.save(usersCollection);
  },
  (app) => {
    const settings = app.settings();
    settings.smtp.enabled = false;
    settings.meta.appUrl = 'http://localhost:8080';
    app.save(settings);
  },
);
