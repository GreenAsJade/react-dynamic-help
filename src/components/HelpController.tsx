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

import {
    AppTargetsState,
    SystemState,
    SystemContextProvider,
    TargetId,
    ItemId,
    AppApiSetter,
    FlowId,
    TargetItemHelpers,
} from "..";

type HelpControllerProps = {
    provideControllerApi: AppApiSetter;

    children: JSX.Element | JSX.Element[];
};

type HelpControllerState = {
    appTargetsState: AppTargetsState;
    systemState: SystemState;
};

/**
 * The component that connects the help flows to the app.
 *
 * A callback is provided via AppContext to the App to register 'target items'
 *
 * The registered target items are provided by HelpSystemContext to the Help System.
 *
 */

export class HelpController extends React.Component<
    HelpControllerProps,
    HelpControllerState
> {
    // we accumulate multiple updates per render cycle here ... the ultimate value ends up in this.state
    appTargets: AppTargetsState = { targetItems: {} };
    systemState: SystemState = {
        systemEnabled: true,
        flows: {},
        flowMap: {},
        items: {},
        itemMap: {},
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
            enableHelp: this.enableHelp,
        });
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
                this.setState({ systemState: state });
            }
        });
    };

    enableFlow = (flow: FlowId, enabled = true): void => {
        console.log("Turning on flow", flow);
        this.systemState.flows[flow].visible = enabled;
        this.setState({ systemState: this.systemState });
    };

    enableHelp = (enabled: boolean = true): void => {
        this.systemState.systemEnabled = enabled;
        this.setState({ systemState: this.systemState });
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
            this.setState({ systemState: this.systemState });
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
                this.systemState.itemMap[target] = new Set<ItemId>();
            }
            this.systemState.itemMap[target].add(itemId);

            this.setState({ systemState: this.systemState });
        }
    };

    render(): JSX.Element {
        console.log("Help Controller has state", this.state.systemState);
        return (
            <>
                <SystemContextProvider
                    value={{
                        systemState: this.state.systemState,
                        appTargetsState: this.state.appTargetsState,
                        api: {
                            addHelpFlow: this.addHelpFlow,
                            addHelpItem: this.addHelpItem,
                        },
                    }}
                >
                    {this.props.children}
                </SystemContextProvider>
            </>
        );
    }
}
