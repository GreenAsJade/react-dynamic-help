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

A basic interface to local storage to hold HelpFlow state.

*/

import * as HelpTypes from "./DynamicHelpTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HelpDataStore = { [key: HelpTypes.StorageKey]: any }; // we really do offer to store `any`

const store: HelpDataStore = {};

// eslint-disable-next-line
export function set(key: HelpTypes.StorageKey, value: any): any {
    store[key] = value;
    safeLocalStorageSet(`dynamic-help.${key}`, JSON.stringify(value));
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
