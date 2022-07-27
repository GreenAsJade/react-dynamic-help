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
} from "../DynamicHelpTypes";

import { SystemContextProvider, Api } from "../DynamicHelp";

/** A handy component when debugging
 * ... because the state gets saved, making it hard to repeat tests!
 */

function FloatingStateReset(): JSX.Element {
    const api = React.useContext(Api);

    return ReactDOM.createPortal(
        <div
            className="rdh-floating-state-reset"
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                zIndex: 1000,
            }}
            onClick={api.resetHelp}
        >
            ⟳
        </div>,
        document.body,
    );
}

type HelpControllerProps = {
    provideControllerApi: AppApiSetter;
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
    // we accumulate multiple updates per render cycle (due to refs changing on render) here .
    // .. the ultimate value of these ends up in this.state (and storage) when react finally updates the state,
    // to be passed out on the Context.
    appTargets: AppTargetsState = { targetItems: {} };
    systemState: SystemState = _resetState;

    propagateSystemState = (): void => {
        console.log("HelpController state update:", this.systemState);
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
        console.log(
            "**** Mounting HelpController: Help System initialization underway...",
        );
        this.props.provideControllerApi({
            registerTargetItem: this.registerTargetCallback,
            enableFlow: this.enableFlow,
            signalUsed: this.signalTargetIsUsed,
            enableHelp: this.enableHelp,
            resetHelp: this.resetHelp,
        });

        this.systemState = this.props.storage.get(
            "system-state",
            _resetState,
        ) as SystemState;

        console.log("Initial state loaded:", this.systemState);
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

    mapTarget = (target: TargetId, targetRef: HTMLElement): void => {
        // Note that this callback can be called multiple times per render of the App,
        // one for each help item target it is rendering.
        console.log("target registration", target, targetRef, this.appTargets);

        this.appTargets = {
            targetItems: {
                ...this.appTargets.targetItems,
                [target]: targetRef,
            },
        };
        this.setState({ appTargetsState: this.appTargets });
    };

    signalTargetIsUsed = (target: TargetId): void => {
        console.log("seeing target used:", target);

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
                    console.log("Finished flow", flowId);
                } else {
                    const nextItem = flow.items[flow.activeItem];
                    state.items[nextItem].visible = true;
                    console.log("stepped flow", flowId, nextItem);
                }
                state.flows[flowId] = flow;
                this.propagateSystemState();
            }
        });
    };

    enableFlow = (flow: FlowId, enabled = true): void => {
        console.log("Turning on flow", flow);
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
        console.log("Info: resetting help system state");
        this.systemState = _resetState;
        this.propagateSystemState();
    };

    //
    // API for Help Flows and Help Items to interact with systemState.
    //

    // Registration.  These should check local storage for state: TBD

    addHelpFlow = (id: FlowId, showInitially: boolean): void => {
        console.log("Flow registration:", id, showInitially);
        if (!(id in this.systemState.flows)) {
            this.systemState.flows[id] = {
                visible: showInitially,
                showInitially,
                items: [],
                activeItem: 0,
            };
            this.propagateSystemState();
        }
    };

    addHelpItem = (flowId: FlowId, itemId: ItemId, target: TargetId): void => {
        console.log("Item registration:", flowId, itemId, target);
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

    signalItemDismissed = (itemId: ItemId): void => {
        console.log("signal dismissed called for", itemId);
        const state = this.systemState; // just alias for ease of reading

        const flowId = state.flowMap[itemId];
        const flow = state.flows[flowId];
        state.items[itemId].visible = false;

        // turn off the flow and reset it
        flow.activeItem = 0;
        flow.visible = false;
        const initialItemId = flow.items[0];
        state.items[initialItemId].visible = true;
        console.log("Reset flow", flowId);

        state.flows[flowId] = flow;
        this.propagateSystemState();
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
                        },
                    }}
                >
                    {this.props.children}
                </SystemContextProvider>
                {this.props.debug && <FloatingStateReset />}
            </>
        );
    }
}
