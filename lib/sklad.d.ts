interface Sklad {
    readonly ASC: string;
    readonly ASC_UNIQUE: string;
    readonly DESC: string;
    readonly DESC_UNIQUE: string;

    open(dbName: string, options: any): any;
    deleteDatabase(dbName: string): Promise<void>;
    keyValue(key: string, value: any): any;
}

declare var Sklad: {
    prototype: Sklad;
    new(): Sklad;
};

interface SkladKeyValueContainer {
    readonly key: string;
    readonly value: string;
}

declare var SkladKeyValueContainer: {
    prototype: SkladKeyValueContainer;
    new(): SkladKeyValueContainer;
};

interface NamedError extends Error {
    name: string;
}

declare var NamedError: NamedError;

interface LikeError {
    name: string;
    message: string;
}

declare var LikeError: LikeError;
