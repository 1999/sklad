'use strict';

/**
 * Generates UUIDs for objects without keys set
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
 */
export const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = (c === 'x') ? r : (r&0x3|0x8);

        return v.toString(16);
    });
};

export const createError = (name, message) => {
    const errObj = new Error(message);
    errObj.name = name;

    return errObj;
};

export const ensureError = (err) => {
    if (err instanceof Error) {
        return err;
    }

    return createError(err.name, err.message);
};

export const resolveAllPromises = async (promises) => {
    const promisesList = [];

    for (let key in promises) {
        promisesList.push(promises[key]);
    }

    const data = await Promise.all(promisesList);
    const output = {};
    let index = 0;

    for (let key in promises) {
        output[key] = data[index];
        index++;
    }

    return output;
};
