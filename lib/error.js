'use strict';

export function createError(name, message) {
    const errObj = new Error(message);
    errObj.name = name;

    return errObj;
}

export function ensureError(err) {
    if (err instanceof Error) {
        return err;
    }

    return createError(err.name, err.message);
}
