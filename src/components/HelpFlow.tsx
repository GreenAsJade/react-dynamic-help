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
import { SystemContext } from "../DynamicHelp";

type HelpFlowProps = {
    id: HelpTypes.FlowId;
    showInitially: boolean;
    children: JSX.Element | JSX.Element[];
};

function defaultId(
    flow: HelpTypes.FlowId,
    target: HelpTypes.TargetId,
    index: number,
) {
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

export const HelpFlow = (props: HelpFlowProps): JSX.Element => {
    const helpContext = React.useContext(SystemContext);
    const { api, systemState } = helpContext;

    const flowId = props.id; // alias for clearer code

    React.useEffect(() => {
        if (!systemState.flows[props.id]) {
            console.log("Help Flow registration:", props.id);

            api.addHelpFlow(flowId, props.showInitially);

            console.log("Help Flow - adding children...");

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

    // The primary reason for this chicanery is to allow the user to not have to provide an id for the HelpItems,
    // while also providing for the future when they will want to (to address it in an api).

    // A side effect is that we have to provide the Item's state to it via its props, because it doesn't necessarily
    // know it's own id, and hence it can't look up its own state in the context via that id.

    // It doesn't work to try naievly to provide the id to the child by inserting it on props, because we are using the
    // absence of it on props to recognise we need to default it!  (I guess we could add a separate prop for
    // 'actualId' that info, if that sort of refactor becomes necessary)

    const children = React.useMemo(
        () => React.Children.toArray(props.children) as JSX.Element[],
        [props.children],
    );

    const childrenWithState = children.map((child, index) => {
        const id =
            child.props.id || defaultId(flowId, child.props.target, index);
        return React.cloneElement(child, {
            ...child.props,
            state: systemState?.items[id],
            flowState: systemState?.flows[flowId],
            systemEnabled: systemState?.systemEnabled,
        });
    });

    return <>{childrenWithState}</>;
};
