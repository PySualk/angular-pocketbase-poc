migrate(
  (app) => {
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
  (app) => {
    const collection = app.findCollectionByNameOrId('todos');
    app.delete(collection);
  },
);
