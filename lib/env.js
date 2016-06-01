'use strict';

// service workers don't have access to window
const isBrowserUI = (typeof window !== 'undefined');

export const indexedDbRef = isBrowserUI
    ? window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    : indexedDB;

export const IDBKeyRangeRef = isBrowserUI
    ? window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
    : IDBKeyRange;

export const TRANSACTION_READONLY = isBrowserUI
    ? window.IDBTransaction.READ_ONLY || 'readonly'
    : 'readonly';

export const TRANSACTION_READWRITE = isBrowserUI
    ? window.IDBTransaction.READ_WRITE || 'readwrite'
    : 'readwrite';

export const SORT_ASC = isBrowserUI
    ? window.IDBCursor.NEXT || 'next'
    : 'next';

export const SORT_ASC_UNIQUE = isBrowserUI
    ? globalNs.IDBCursor.NEXT_NO_DUPLICATE || 'nextunique'
    : 'nextunique';

export const SORT_DESC = isBrowserUI
    ? globalNs.IDBCursor.PREV || 'prev'
    : 'prev';

export const SORT_DESC_UNIQUE = isBrowserUI
    ? globalNs.IDBCursor.PREV_NO_DUPLICATE || 'prevunique'
    : 'prevunique';
