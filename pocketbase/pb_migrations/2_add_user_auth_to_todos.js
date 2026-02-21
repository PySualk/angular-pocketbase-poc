migrate(
  (app) => {
    const existing = app.findCollectionByNameOrId('todos');
    app.delete(existing);

    const usersId = app.findCollectionByNameOrId('users').id;

    const collection = new Collection({
      name: 'todos',
      type: 'base',
      fields: [
        { type: 'text', name: 'title', required: true, max: 200 },
        { type: 'bool', name: 'completed' },
        {
          type: 'relation',
          name: 'owner',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false, system: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true, system: true },
      ],
    });
    collection.listRule = 'owner = @request.auth.id';
    collection.viewRule = 'owner = @request.auth.id';
    collection.createRule = '@request.auth.id != ""';
    collection.updateRule = 'owner = @request.auth.id';
    collection.deleteRule = 'owner = @request.auth.id';
    app.save(collection);
  },
  (app) => {
    const existing = app.findCollectionByNameOrId('todos');
    app.delete(existing);

    const collection = new Collection({
      name: 'todos',
      type: 'base',
      fields: [
        { type: 'text', name: 'title', required: true, max: 200 },
        { type: 'bool', name: 'completed' },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false, system: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true, system: true },
      ],
    });
    collection.listRule = '';
    collection.viewRule = '';
    collection.createRule = '';
    collection.updateRule = '';
    collection.deleteRule = '';
    app.save(collection);
  },
);
