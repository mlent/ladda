import config from './config';

const storage = {
    dummyItem: {
        timestamp: 1212
    }
};
const collectionQueries = {
    dummyItem: {
        timestamp: 1212
    }
};

export function preRead(next, apiName, methodName, methodMeta, args) {
    const typeConfig = getTypeConfig(apiName, methodMeta.entity);
    const key = createKey(apiName, methodName, methodMeta.multipleEntities, args, methodMeta.entity);

    let fromCache;
    if (typeConfig && (fromCache = getFromCache(typeConfig, key))) {
        return new Promise(
            resolve => resolve(fromCache)
        );
    } else {
        return next(args);
    }
}

export function postRead(apiName, methodName, methodMeta, args, promise) {
    const type = methodMeta.entity;

    promise.then((result) => {
        saveToCache(createKey(apiName, methodName, methodMeta.multipleEntities, args, type),
                    { data: result.data });
    });
}

export function preWrite(next, apiName, methodName, methodMeta, args) {
    const methodType = methodMeta.entity;
    const key = createKey(apiName, methodName, methodMeta.multipleEntities, args, methodType);
    saveToCache(key, {
        data: args[0]
    });
    return next(args);
}

export function postWrite(apiName, methodName, methodMeta, args, promise) {
    return promise;
}

function createKey(apiName, methodName, multipleEntities, args, type) {
    if (multipleEntities) {
        return {
            type: 'COLLECTION_KEY',
            value: [apiName, methodName, multipleEntities, args].join('-'),
            entityType: type
        };
    } else {
        return {
            type: 'ENTITY_KEY',
            entityType: type,
            id: args[0].id
        };
    }
}

function getTypeConfig(apiName, typeName) {
    if (config[typeName]) {
        return config[typeName];
    } else {
        return {};
    }
}

function getFromCache(methodConfig, key) {
    let value;

    if (key.type === 'COLLECTION_KEY') {
        value = getCollectionFromCache(key);
    } else {
        value = getEntityFromCache(key);
    }

    if (value && isValid(value, methodConfig, key)) {
        return value;
    } else {
        return false;
    }
}

function getCollectionFromCache(key) {
    if (storage[key.entityType]) {
        return {
            data: Object.keys(storage[key.entityType])
                        .map((x) => storage[key.entityType][x].data)
        };
    } else {
        return false;
    }
}

function getEntityFromCache(key) {
    if (storage[key.entityType][key.id]) {
        return storage[key.entityType][key.id];
    } else {
        return false;
    }
}

function isValid(item, methodConfig, key) {
    if (key.type === 'COLLECTION_KEY') {
        return collectionQueries[key.value].timestamp + methodConfig.ttl * 1000 >= Date.now();
    } else {
        return item.timestamp + methodConfig.ttl * 1000 >= Date.now();
    }
}

function saveToCache(key, val) {
    const type = key.entityType;
    if (!storage[type]) {
        storage[type] = {};
    }

    if (key.type === 'COLLECTION_KEY') {
        saveCollection(key, type, val.data);
    } else {
        saveEntity(type, val.data);
    }
}

function saveCollection(key, type, val) {
    val.forEach((x) => {
        storage[type][x.id] = {
            data: x,
            timestamp: Date.now()
        };
    });
    collectionQueries[key.value] = {
        timestamp: Date.now()
    };
}

function saveEntity(type, val) {
    storage[type][val.id] = {
        data: val,
        timestamp: Date.now()
    };
}