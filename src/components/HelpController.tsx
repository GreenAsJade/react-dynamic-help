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
    AppApiContextSetter,
} from "..";

type HelpControllerProps = {
    provideControllerApi: AppApiContextSetter;

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

    constructor(props: HelpControllerProps) {
        super(props);
        this.state = {
            appTargetsState: {
                targetItems: {},
            },
            systemState: { flows: {}, flowMap: {} },
        };
    }

    componentDidMount = () => {
        console.log("Mounting controller", this.props.provideControllerApi);
        this.props.provideControllerApi({
            registerTargetItem: this.mapTargetCallback,
        });
    };

    /**
     * This callback is provided to the client app as a ref callback generator to register "target items".
     *
     * The resultant ref call back stores the target item's ref in the ItemTable by it's TargetId.
     *
     * That table is passed as context to the Help System in appHelpState.
     */
    mapTargetCallback = (target: TargetId) => {
        console.log("Request to set up ref mapper for", target);

        return (targetRef: any) => {
            // Note that this callback can be called multiple times per render of the App,
            // one for each help item target it is rendering.
            console.log(
                "mapping",
                target,
                targetRef,
                this.appTargetsAccumulator,
            );
            this.appTargetsAccumulator = {
                targetItems: {
                    ...this.appTargetsAccumulator.targetItems,
                    [target]: targetRef,
                },
            };

            this.setState({ appTargetsState: this.appTargetsAccumulator });
        };
    };

    updateStuff = (): void => {
        console.log("updateStuff tbd");
    };

    render() {
        console.log("Help controller sees App state", this.state);

        return (
            <>
                <SystemContextProvider
                    value={{
                        systemState: this.state.systemState,
                        appTargetsState: this.state.appTargetsState,
                        setSystemState: this.updateStuff,
                    }}
                >
                    {this.props.children}
                </SystemContextProvider>
            </>
        );
    }
}
