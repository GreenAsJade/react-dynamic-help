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

import * as React from "react";
import * as ReactDOM from "react-dom";

import {
    AppTargetsState,
    SystemState,
    TargetId,
    ItemId,
    AppApiSetter,
    FlowId,
    TargetItemHelpers,
    DynamicHelpStorageAPI,
    HelpPopupDictionary,
    HelpPopupPhrase,
    FlowInfo,
    HelpUserState,
} from "../DynamicHelpTypes";

import { SystemContextProvider, SystemContext, log } from "../DynamicHelp";

/** A handy component when debugging
 * ... because the state gets saved, making it hard to repeat tests!
 */

function FloatingStateReset(): JSX.Element {
    const api = React.useContext(SystemContext).api;

    const resetHelp = () => {
        console.log("Clicked debug reset"); // note: this is a debug component, so it is expected to log!
        api.resetHelp();
    };

    return ReactDOM.createPortal(
        <div
            className="rdh-floating-state-reset"
            style={{
                position: "absolute",
                bottom: "5px",
                left: "5px",
                color: "red",
                fontSize: "x-large",
                zIndex: "1000",
                cursor: "default",
            }}
            onClick={resetHelp}
        >
            ⟳ rdh
        </div>,
        document.body,
    );
}

type HelpControllerProps = {
    provideControllerApi: AppApiSetter;
    dictionary: HelpPopupDictionary;
    storage: DynamicHelpStorageAPI;
    debug: boolean;
    children: JSX.Element | JSX.Element[];
};

type HelpControllerState = {
    appTargetsState: AppTargetsState;
    systemState: SystemState;
};

const __resetUserState = {
    systemEnabled: true,
    flows: {},
};

const __resetState: SystemState = {
    userState: __resetUserState,
    flows: {},
    flowMap: {},
    items: {},
    itemMap: {},
};

/**
 * The component that
 * - connects the help flows to the app,
 * - implements the API that the app uses, which updates Help System state
 *
 * The HelpItems respond to the changes in state in a fairly dumb way to either display themselves or not.
 *
 * The API is provided to the controller by calling `props.provideControllerApi(ourApiObject)`
 *
 */

export class HelpController extends React.Component<
    HelpControllerProps,
    HelpControllerState
> {
    // Here we track which flows have definitely registered, and therefore are present in the current
    // JSX of the application (as opposed to flows that were once present, saved in storage, but removed from the application)
    registeredFlows = new Set<FlowId>();

    // we accumulate multiple updates to state per render cycle (due to refs changing on render) here.
    // .. the ultimate value of these ends up in this.state (and storage) when react finally updates the state,
    // to be passed out on the Context.
    appTargets: AppTargetsState = { targetItems: {} };
    systemState: SystemState = { ...__resetState };

    propagateSystemState = (): void => {
        log(this.props.debug, "HelpController state update:", this.systemState);
        const stringified = JSON.stringify(this.systemState.userState);
        this.props.storage.saveState(stringified);
        this.setState({ systemState: this.systemState });
    };

    constructor(props: HelpControllerProps) {
        super(props);
        this.state = {
            appTargetsState: this.appTargets,
            systemState: this.systemState,
        };
    }

    componentDidMount = (): void => {
        log(
            this.props.debug,
            "**** Mounting HelpController: Help System initialization underway...",
        );
        this.props.provideControllerApi({
            registerTargetItem: this.registerTargetCallback,
            triggerFlow: this.triggerFlow,
            signalUsed: this.signalTargetIsUsed,
            enableHelp: this.enableHelp,
            getFlowInfo: this.getFlowInfo,
            enableFlow: this.enableFlow,
            getSystemStatus: () => ({
                enabled: this.systemState.userState.systemEnabled,
            }),

            resetHelp: this.resetHelp,
        });

        this.reloadUserState();
    };

    //
    // API for the App to use.
    //

    /**
     * This callback is provided to the client app as a ref callback generator to register "target items".
     *
     * It provides back a ref call back stores the target item's ref in the ItemTable by it's TargetId,
     * and a "signal used" function to signal when the target has been used.
     */

    registerTargetCallback = (target: TargetId): TargetItemHelpers => {
        //console.log("Request to register", target);

        return {
            ref: (targetRef: HTMLElement) => this.mapTarget(target, targetRef),
            used: () => this.signalTargetIsUsed(target),
        };
    };

    private mapTarget = (target: TargetId, targetRef: HTMLElement): void => {
        // Note that this callback can be called multiple times per render of the App,
        // one for each help item target that the app rendering.
        log(
            this.props.debug,
            "target registration",
            target,
            targetRef,
            this.appTargets,
        );

        this.appTargets = {
            targetItems: {
                ...this.appTargets.targetItems,
                [target]: {
                    ref: targetRef,
                    highlighters: new Set<ItemId>(),
                },
            },
        };
        this.setState({ appTargetsState: this.appTargets });
    };

    signalTargetIsUsed = (target: TargetId): void => {
        log(this.props.debug, "seeing target used:", target);

        const state = this.systemState; // just alias for ease of reading

        state.itemMap[target].forEach((itemId) => {
            const flowId = state.flowMap[itemId];
            const flow = state.flows[flowId];
            //console.log("checking", itemId, flow);
            if (flow.items[flow.activeItem] === itemId) {
                state.items[itemId].visible = false;
                if (++flow.activeItem === flow.items.length) {
                    // turn off the flow and reset it
                    flow.activeItem = 0;
                    flow.visible = false;
                    const initialItemId = flow.items[0];
                    state.items[initialItemId].visible = true;
                    log(this.props.debug, "Finished flow", flowId);
                } else {
                    const nextItem = flow.items[flow.activeItem];
                    state.items[nextItem].visible = true;
                    log(this.props.debug, "stepped flow", flowId, nextItem);
                }
                state.flows[flowId] = flow;
                this.propagateSystemState();
            }
        });
    };

    enableFlow = (flowId: FlowId, enable = true): void => {
        log(this.props.debug, "Enabling flow:", flowId, enable);

        const flow = this.systemState.flows[flowId];
        const initialItem = flow.items[0];

        flow.visible = enable;
        this.systemState.items[initialItem].visible = enable;
        flow.activeItem = 0;
        if (enable) {
            this.systemState.userState.flows[flowId].seen = true;
        }

        this.propagateSystemState();
    };

    triggerFlow = (flowId: FlowId): void => {
        log(this.props.debug, "Trigger flow:", flowId);
        if (!this.systemState.userState.flows[flowId].seen) {
            this.enableFlow(flowId, true);
        }
    };

    enableHelp = (enabled: boolean = true): void => {
        console.log("Enable help", enabled);
        if (enabled) {
            this.reloadUserState();
        }
        this.systemState.userState.systemEnabled = enabled;
        this.propagateSystemState();
    };

    reloadUserState = (): void => {
        log(this.props.debug, "Info: reloading user help state");
        const stored = JSON.parse(this.props.storage.getState("{}"));
        // Allow for new insertions from __resetUserState into older stored state,
        // and remove cruft from older stored state
        const newUserState: HelpUserState = { ...__resetUserState };
        Object.keys(__resetUserState).forEach((field) => {
            if (typeof stored[field] !== undefined) {
                newUserState[field as keyof HelpUserState] = stored[field];
            }
        });

        this.systemState.userState = newUserState;

        log(this.props.debug, "Initial user state loaded:", this.systemState);
        this.setState({ systemState: this.systemState });
    };

    resetHelp = (): void => {
        log(this.props.debug, "Info: resetting help system state");
        this.systemState = { ...__resetState };
        this.propagateSystemState();
    };

    // Only share registered flows with the app.
    // The other flows we might have from stored state is presumably out of date and therefore irrelevant
    getFlowInfo = (): FlowInfo[] => {
        const info = Array.from(this.registeredFlows).map((flowId) => ({
            id: flowId,
            description: this.systemState.flows[flowId].description,
            visible: this.systemState.flows[flowId].visible,
            seen: this.systemState.userState.flows?.[flowId].seen,
        }));
        return info;
    };

    //
    // API for Help Flows and Help Items to interact with systemState.
    //

    // Registration....
    addHelpFlow = (
        flowId: FlowId,
        showInitially: boolean,
        description: string,
    ): void => {
        log(this.props.debug, "Flow registration:", flowId, showInitially);

        this.registeredFlows.add(flowId);

        const desc = description || flowId;

        if (!(flowId in this.systemState.flows)) {
            this.systemState.flows[flowId] = {
                id: flowId,
                visible:
                    showInitially &&
                    !this.systemState.userState.flows?.[flowId]?.seen,
                showInitially,
                items: [],
                activeItem: 0,
                description: desc,
            };

            if (!(flowId in this.systemState.userState.flows)) {
                log(this.props.debug, "First ever registration for", flowId);
                this.systemState.userState.flows[flowId] = {
                    seen: showInitially,
                };
            }
        } else {
            this.systemState.flows[flowId].description = desc;
        }
        this.propagateSystemState();
    };

    addHelpItem = (flowId: FlowId, itemId: ItemId, target: TargetId): void => {
        log(this.props.debug, "Item registration:", flowId, itemId, target);

        if (!(itemId in this.systemState.items)) {
            this.systemState.items[itemId] = {
                visible: this.systemState.flows[flowId].items.length === 0,
                flow: flowId,
                target: target,
            };

            this.systemState.flows[flowId].items.push(itemId);
            this.systemState.flowMap[itemId] = flowId;

            if (!this.systemState.itemMap[target]) {
                this.systemState.itemMap[target] = [];
            }
            if (!this.systemState.itemMap[target].includes(itemId)) {
                this.systemState.itemMap[target].push(itemId);
            }

            this.propagateSystemState();
        }
    };

    // ... operation

    signalItemDismissed = (itemId: ItemId): void => {
        log(this.props.debug, "signal dismissed called for", itemId);

        const state = this.systemState; // just alias for ease of reading

        const flowId = state.flowMap[itemId];
        const flow = state.flows[flowId];
        state.items[itemId].visible = false;

        // turn off the flow and reset it
        flow.activeItem = 0;
        flow.visible = false;
        const initialItemId = flow.items[0];
        state.items[initialItemId].visible = true;

        log(this.props.debug, "Flow reset to inactive", flowId);

        state.flows[flowId] = flow;
        this.propagateSystemState();
    };

    translate = (phrase: HelpPopupPhrase): string => {
        return this.props.dictionary[phrase];
    };

    render(): JSX.Element {
        //console.log("Help Controller has state", this.state.systemState);
        return (
            <>
                <SystemContextProvider
                    value={{
                        systemState: this.state.systemState,
                        appTargetsState: this.state.appTargetsState,
                        api: {
                            addHelpFlow: this.addHelpFlow,
                            addHelpItem: this.addHelpItem,
                            signalItemDismissed: this.signalItemDismissed,
                            translate: this.translate,
                            enableFlow: this.enableFlow,
                            enableHelp: this.enableHelp,
                            resetHelp: this.resetHelp,
                        },
                    }}
                >
                    {this.props.children}
                    {this.props.debug && <FloatingStateReset />}
                </SystemContextProvider>
            </>
        );
    }
}
