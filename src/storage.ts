/*
Copyright (c) 2022 Martin Gregory.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*

A basic interface to local storage to hold HelpController state.

*/

import * as HelpTypes from "./DynamicHelpTypes";

export type DynamicHelpStorageAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (key: HelpTypes.StorageKey, value: any) => any;
    remove: (key: HelpTypes.StorageKey) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: (key: HelpTypes.StorageKey, default_value?: any) => any;
};

export const StorageApi: DynamicHelpStorageAPI = {
    set: set,
    remove: remove,
    get: get,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HelpDataStore = { [key: HelpTypes.StorageKey]: any }; // we really do offer to store `any`

const store: HelpDataStore = {};

// eslint-disable-next-line
export function set(key: HelpTypes.StorageKey, value: any): any {
    //console.log("storing:", value);
    store[key] = value;
    //const savedValue = JSON.stringify(value);
    //console.log("JSON:", savedValue);
    safeLocalStorageSet(
        `dynamic-help.${key}`,
        JSON.stringify(value, (_key, value) =>
            value instanceof Set ? [...value] : value,
        ),
    );
    return value;
}

export function remove(key: HelpTypes.StorageKey): void {
    delete store[key];
    safeLocalStorageRemove(`dynamic-help.${key}`);
}

// eslint-disable-next-line
export function get(key: HelpTypes.StorageKey, default_value?: any): any {
    if (key in store) {
        return store[key];
    }
    const fromStorage = localStorage.getItem(`dynamic-help.${key}`);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    return default_value;
}

function safeLocalStorageSet(key: HelpTypes.StorageKey, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Warn in the console, so the user can be helped if they report problems, but otherwise is not distracted.
        console.warn(
            `Failed to save setting ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`,
        );
    }
}

function safeLocalStorageRemove(key: HelpTypes.StorageKey) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        // Warn in the console, so the user can be helped if they report problems, but otherwise is not distracted.
        console.warn(
            `Failed to remove ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`,
        );
    }
}
