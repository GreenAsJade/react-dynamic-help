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

// Help Item prop types
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
 * The API for the App, on the Help Controller
 */
export type AppApi = {
    registerTargetItem: TargetItemRegisterer;
    triggerFlow: (flowId: FlowId) => void;
    signalUsed: (target: TargetId) => void;
    enableHelp: (enable: boolean) => void; // Turn on the help system master switch
    getFlowInfo: () => FlowInfo[];
    enableFlow: FlowSwitch;
    reloadUserState: () => void; // Needed if the user changes
    getSystemStatus: () => HelpSystemStatus;
    resetHelp: () => void; // intended for use in development, not as app functionality
};

export type FlowInfo = {
    id: FlowId;
    description: string;
    visible: boolean;
    seen: boolean;
};

export type HelpSystemStatus = {
    enabled: boolean;
    initialized: boolean;
};

export type TargetItemHelpers = {
    ref: (targetRef: HTMLElement | null) => void;
    active: () => boolean; // If the target is currently in the DOM
    used: () => void; // Tell RDH that this target has been used
};

export type TargetItemRegisterer = (id: TargetId) => TargetItemHelpers;

export type DictionaryProvider = (dict: HelpPopupDictionary) => void;

export type HelpPopupPhrase = "Skip this topic" | "OK";

export type HelpPopupDictionary = {
    [phrase in HelpPopupPhrase]: string;
};

export type FlowSwitch = (flow: FlowId, enabled?: boolean) => void;

export type HelpUserState = {
    systemEnabled: boolean;
    flows: { [id: FlowId]: { seen: boolean } };
};

export type DynamicHelpStorageAPI = {
    saveState: (userState: string) => string;
    getState: (defaultValue?: string) => string;
};

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
    storageReady: boolean;
    api: ControllerApi;
};

export type RegisterFlow = (
    id: FlowId,
    showInitially: boolean,
    description: string,
) => void;
export type RegisterItem = (
    flowId: FlowId,
    itemId: ItemId,
    target: TargetId,
    index: number,
) => void;

export type ControllerApi = {
    addHelpFlow: RegisterFlow;
    addHelpItem: RegisterItem;
    signalItemDismissed: (item: ItemId) => void;
    signalFlowDismissed: (item: ItemId) => void;
    translate: (text: HelpPopupPhrase) => string;
    enableFlow: FlowSwitch;
    enableHelp: (enable: boolean) => void;
    resetHelp: () => void;
};

export type AppTargetsState = {
    targetItems: TargetTable;
};

// The state that is passed to help components in context
export type SystemState = {
    userState: HelpUserState; // this is the state that is persisted in storage
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
    id: FlowId;
    visible: boolean;
    showInitially: boolean;
    items: ItemId[];
    activeItem: number; // index into items
    description: string;
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
    [target: TargetId]: ItemId[]; // targets may have more than one item applicable
};

/**
 * Used by Help Items to find their target based on its id, and track who's highlighting it
 *
 */
export type TargetTable = {
    [target: TargetId]: TargetInfo;
};

// *** Note: transient working store. Not JSON persistable due to Set.
export type TargetInfo = {
    ref: HTMLElement; // the ref to the target, supplied to us on a ref callback
    highlighters: Set<ItemId>; // The HelpItems that think that this target should be highlighted
};

export interface HelpItemProperties {
    target: TargetId; // App element the HelpItem relates to
    position?: Position; // where the HelpItem is placed on the target
    anchor?: Position; // which part of the HelpItem is placed at `position`
    margin?: string; // can be used to offset the HelpItem from the default position
    id?: ItemId; // user can provide this for css targetting
    highlightTarget?: boolean;
    debug?: boolean; // note - this will be overriden by Flow debug, if that is set
    myId?: ItemId; // provided by the containing HelpFlow
    children: React.ReactNode; // The help popup elements
}
