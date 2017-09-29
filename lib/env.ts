'use strict';

function getBrowserAPI(...variants: string[]): any {
    for (let variant of variants) {
        const obj = (window as any)[variant];

        if (obj) {
            return obj;
        }
    }
}

// service workers don't have access to window
const isBrowserUI = (typeof window !== 'undefined');

export const indexedDbRef = isBrowserUI
    ? getBrowserAPI('indexedDB', 'mozIndexedDB', 'webkitIndexedDB', 'msIndexedDB') as IDBFactory
    : indexedDB;

// tslint:disable-next-line:variable-name
export const IDBKeyRangeRef = isBrowserUI
    ? getBrowserAPI('IDBKeyRange', 'mozIDBKeyRange', 'webkitIDBKeyRange', 'msIDBKeyRange') as IDBKeyRange
    : IDBKeyRange;

export const TRANSACTION_READONLY = isBrowserUI
    ? (window as any).IDBTransaction.READ_ONLY || 'readonly'
    : 'readonly';

export const TRANSACTION_READWRITE = isBrowserUI
    ? (window as any).IDBTransaction.READ_WRITE || 'readwrite'
    : 'readwrite';

export const SORT_ASC = isBrowserUI
    ? (window as any).IDBCursor.NEXT || 'next'
    : 'next';

export const SORT_ASC_UNIQUE = isBrowserUI
    ? (window as any).IDBCursor.NEXT_NO_DUPLICATE || 'nextunique'
    : 'nextunique';

export const SORT_DESC = isBrowserUI
    ? (window as any).IDBCursor.PREV || 'prev'
    : 'prev';

export const SORT_DESC_UNIQUE = isBrowserUI
    ? (window as any).IDBCursor.PREV_NO_DUPLICATE || 'prevunique'
    : 'prevunique';
