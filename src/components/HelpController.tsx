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
    TargetItemSetter,
    AppApiSetter,
    RegisterFlow,
    RegisterItem,
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
    appTargetsAccumulator: AppTargetsState = { targetItems: {} };
    systemStateAccumulator: SystemState = {
        flows: {},
        flowMap: {},
        items: {},
    };

    constructor(props: HelpControllerProps) {
        super(props);
        this.state = {
            appTargetsState: this.appTargetsAccumulator,
            systemState: this.systemStateAccumulator,
        };
    }

    componentDidMount = () => {
        console.log("Mounting controller", this.props.provideControllerApi);
        this.props.provideControllerApi({
            registerTargetItem: this.registerTargetCallback,
        });
    };

    /**
     * This callback is provided to the client app as a ref callback generator to register "target items".
     *
     * It provides back a ref call back stores the target item's ref in the ItemTable by it's TargetId,
     * and a "signal used" callback to signal when the target has been used.
     */

    registerTargetCallback: TargetItemSetter = (target: TargetId) => {
        console.log("Request to register", target);

        return {
            ref: (targetRef: HTMLElement) => this.mapTarget(target, targetRef),
            used: () => this.signalTargetIsUsed(target),
        };
    };

    mapTarget = (target: TargetId, targetRef: HTMLElement) => {
        // Note that this callback can be called multiple times per render of the App,
        // one for each help item target it is rendering.
        console.log("mapping", target, targetRef, this.appTargetsAccumulator);

        this.appTargetsAccumulator = {
            targetItems: {
                ...this.appTargetsAccumulator.targetItems,
                [target]: targetRef,
            },
        };
        this.setState({ appTargetsState: this.appTargetsAccumulator });
    };

    signalTargetIsUsed = (target: TargetId) => {
        console.log("seeing target used:", target);
    };

    // API for Help Flows and Help Items to interact with systenState.

    addHelpFlow: RegisterFlow = (id, showInitially) => {
        console.log("Flow registration:", id, showInitially);
        if (!(id in this.systemStateAccumulator.flows)) {
            this.systemStateAccumulator.flows[id] = {
                visible: showInitially,
                showInitially,
            };
            this.setState({ systemState: this.systemStateAccumulator });
        }
    };

    addHelpItem: RegisterItem = (flowId, itemId, target, index) => {
        console.log("Item registration:", flowId, itemId, target, index);
        if (!(itemId in this.systemStateAccumulator.items)) {
            this.systemStateAccumulator.items[itemId] = {
                visible: index === 0,
                seq: index,
                flow: flowId,
                target: target,
            };
            this.setState({ systemState: this.systemStateAccumulator });
        }
    };

    render() {
        console.log("Help controller sees App state", this.state);

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
