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

import * as HelpTypes from "../DynamicHelpTypes";
import { SystemContext, log } from "../DynamicHelp";

type HelpFlowProps = {
    id: HelpTypes.FlowId;
    description?: string; // passed to the app if it asks "what flows are there?"
    showInitially?: boolean;
    debug?: boolean; // if this is turned on it sets debug on the children as well, _overriding_ their debug prop.
    children: JSX.Element | JSX.Element[];
};

function defaultId(
    flow: HelpTypes.FlowId,
    target: HelpTypes.TargetId,
    index: number,
): HelpTypes.ItemId {
    return `help-for-${target}-in-${flow}-${index}`;
}

/**
 * A container component for Dynamic Help Flows.
 *
 * It defines the `id` of the Help Flow, and provides the JSX structure for the App writer
 * to tell us which Help Items are in that flow.
 *
 * It reads Help System State from the context, and passes the appropriate item state to each
 * HelpItem child.
 */

export const HelpFlow = ({
    showInitially = false,
    debug = false,
    description = "",
    ...props
}: HelpFlowProps): JSX.Element => {
    const helpContext = React.useContext(SystemContext);
    const { api, systemState, storageReady } = helpContext;

    const flowId = props.id; // alias for clearer code

    React.useEffect(() => {
        log(
            debug,
            "HelpFlow UseEffect",
            flowId,
            "with storage ready:",
            storageReady,
        );

        if (!systemState.flows[props.id] && storageReady) {
            log(debug, "Help Flow registering:", flowId);

            api.addHelpFlow(flowId, showInitially, description);

            log(debug, "Help Flow - adding children...");

            React.Children.toArray(props.children).forEach(
                // item is a HelpItem, with known props, but it's hard to tell Typescript this!
                // eslint-disable-next-line
                (item: any, index) => {
                    let [id, target] = [item.props.id, item.props.target];

                    if (!id) {
                        id = defaultId(flowId, target, index);
                    }
                    api.addHelpItem(flowId, id, target, index);
                },
            );
        }
    });

    // The reason for this chicanery is to allow the user to not have to provide a unique id for the HelpItems.
    // It's also the place that "if the flow has debug then the Items do too" is implemented

    const children = React.useMemo(
        () => React.Children.toArray(props.children) as JSX.Element[],
        [props.children],
    );

    const childrenWithIds = children.map((child, index) => {
        const childProps = child.props as {
            id?: string;
            target: HelpTypes.TargetId;
        };
        const id = childProps.id || defaultId(flowId, childProps.target, index);
        return React.cloneElement(child, {
            ...childProps,
            myId: id,
            ...(debug ? { debug } : {}),
        } as any);
    });

    log(debug, "HelpFlow render", flowId, "with storage ready:", storageReady);
    return <>{childrenWithIds}</>;
};
