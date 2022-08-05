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
    FlowState,
    HelpPopupDictionary,
    HelpPopupPhrase,
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

const _resetState: SystemState = {
    systemEnabled: true,
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
    // we accumulate multiple updates to state per render cycle (due to refs changing on render) here.
    // .. the ultimate value of these ends up in this.state (and storage) when react finally updates the state,
    // to be passed out on the Context.
    appTargets: AppTargetsState = { targetItems: {} };
    systemState: SystemState = _resetState;

    propagateSystemState = (): void => {
        log(this.props.debug, "HelpController state update:", this.systemState);
        this.props.storage.set("system-state", this.systemState);
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
            enableFlow: this.enableFlow,
            signalUsed: this.signalTargetIsUsed,
            enableHelp: this.enableHelp,
            resetHelp: this.resetHelp,
            getFlowInfo: this.getFlowInfo,
            getSystemStatus: () => ({
                enabled: this.systemState.systemEnabled,
            }),
        });

        this.systemState = this.props.storage.get(
            "system-state",
            _resetState,
        ) as SystemState;

        log(this.props.debug, "Initial state loaded:", this.systemState);
        this.setState({ systemState: this.systemState });
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

    enableFlow = (flow: FlowId, enabled = true): void => {
        log(this.props.debug, "Enable flow:", flow, enabled);
        const initialItem = this.systemState.flows[flow].items[0];
        this.systemState.flows[flow].visible = enabled;
        this.systemState.items[initialItem].visible = enabled;
        this.systemState.flows[flow].activeItem = 0;
        this.propagateSystemState();
    };

    enableHelp = (enabled: boolean = true): void => {
        this.systemState.systemEnabled = enabled;
        this.propagateSystemState();
    };

    resetHelp = (): void => {
        log(this.props.debug, "Info: resetting help system state");
        this.systemState = _resetState;
        this.propagateSystemState();
    };

    getFlowInfo = (): FlowState[] => Object.values(this.systemState.flows);

    //
    // API for Help Flows and Help Items to interact with systemState.
    //

    // Registration....
    addHelpFlow = (
        id: FlowId,
        showInitially: boolean,
        description: string,
    ): void => {
        log(this.props.debug, "Flow registration:", id, showInitially);

        const desc = description || id;
        if (!(id in this.systemState.flows)) {
            this.systemState.flows[id] = {
                id: id,
                visible: showInitially,
                showInitially,
                items: [],
                activeItem: 0,
                description: desc,
            };
        } else {
            this.systemState.flows[id].description = desc;
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
