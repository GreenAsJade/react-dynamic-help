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

// Basic types for identifiers
export type FlowId = string;
export type ItemId = string;
export type TargetId = string;
export type StorageKey = string;

// Help Item props
export type Position =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-centre"
    | "top-center"
    | "bottom-centre"
    | "bottom-center"
    | "center-left"
    | "centre-left"
    | "center-right"
    | "centre-right";

/**
 * The API for the App on the Help Controller
 */
export type AppApi = {
    registerTargetItem: TargetItemRegisterer;
    enableFlow: FlowSwitch;
    signalUsed: (target: TargetId) => void;
    enableHelp: (enable: boolean) => void;
};

export type TargetItemHelpers = {
    ref: (targetRef: HTMLElement) => void;
    used: () => void;
};
export type TargetItemRegisterer = (id: TargetId) => TargetItemHelpers;

export type FlowSwitch = (flow: FlowId, enabled: boolean) => void;

/**
 * A function passed in on the Controller props,
 * used by the Controller to give the Provider the Controller API,
 * so that the Provider can pass the Controller API on to the App.
 */
export type AppApiSetter = (apiObject: AppApi) => void;

/**
 * Information passed from Controller to Help Flows and Items:
 * includes internal help system state and the API that the Flows and Items can use to update it,
 * plus the information tracked about the state of the app,
 * plus an API for them to talk back to the Controller
 */
export type HelpSystemContext = {
    systemState: SystemState;
    appTargetsState: AppTargetsState;
    api: ControllerApi;
};

export type RegisterFlow = (id: FlowId, showInitially: boolean) => void;
export type RegisterItem = (
    flowId: FlowId,
    itemId: ItemId,
    target: TargetId,
    index: number,
) => void;

export type ControllerApi = {
    addHelpFlow: RegisterFlow;
    addHelpItem: RegisterItem;
};

export type AppTargetsState = {
    targetItems: TargetTable;
};

export type SystemState = {
    systemEnabled: boolean;
    flows: FlowStates;
    flowMap: FlowMap;
    items: ItemStates;
    itemMap: ItemMap;
};

export type ItemState = {
    visible: boolean;
    flow: FlowId;
    target: TargetId;
};

export type FlowState = {
    visible: boolean;
    showInitially: boolean;
    items: ItemId[];
    activeItem: number; // index into items
};

type FlowStates = {
    [id: FlowId]: FlowState;
};

type FlowMap = {
    [item: ItemId]: FlowId;
};

type ItemStates = {
    [item: ItemId]: ItemState;
};

type ItemMap = {
    [target: TargetId]: Set<ItemId>;
};

/**
 * Used by Help Items to find their target based on its id.
 */
export type TargetTable = {
    [target: TargetId]: HTMLElement; // ref to target
};
