/**
 * Generates UUIDs for objects without keys set
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
 */
export const uuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
        const r = Math.floor(Math.random() * 16);
        // tslint:disable-next-line:no-bitwise
        const v = (c === 'x') ? r : (r&0x3|0x8);

        return v.toString(16);
    });
};

export const createError = (name: string, message: string): NamedError => {
    const errObj = new Error(message);
    errObj.name = name;

    return errObj;
};

export const ensureError = (err: Error | LikeError) => {
    return (err instanceof Error)
        ? err
        : createError(err.name, err.message);
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

export class KeyValueContainer implements SkladKeyValueContainer {
    readonly key: string;
    readonly value: any;

    constructor(key: string, value: any) {
        this.key = key;
        this.value = value;
    }
}

export const idbRequestToPromise = (request: IDBRequest, resolveHandlers: string[], rejectHandlers: string[]): Promise<Event> => {
    return new Promise((resolve, reject) => {
        for (let handlerName of resolveHandlers) {
            request[handlerName] = resolve;
        }

        for (let handlerName of rejectHandlers) {
            request[handlerName] = reject;
        }
    });
};
