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

import * as HelpTypes from "DynamicHelpTypes";

function addHelpFlow(
    helpContext: HelpTypes.HelpContext,
    id: HelpTypes.FlowId,
    showInitially: boolean,
) {
    console.log("Use Help Flow");

    const { helpState, setState } = helpContext;

    console.log("addflow", helpState, id, showInitially);

    if (!(id in helpState.flows)) {
        helpState.flows[id] = {
            visible: showInitially,
            showInitially: showInitially,
            items: {},
        };
        setState({ ...helpState });
    } else {
        console.log("(already added)");
    }
}

function addHelpItem(
    helpContext: HelpTypes.HelpContext,
    flow: HelpTypes.FlowId,
    item: HelpTypes.ItemId,
    target: HelpTypes.TargetId,
    seq: number,
) {
    const { helpState, setState } = helpContext;

    console.log("additem", helpState, flow, item, target);

    if (!(flow in helpState.flows)) {
        console.warn(
            "Can't add help item %s to non-existent flow %s",
            flow,
            item,
        );
        return;
    }

    console.log("the flow state:", helpState.flows[flow]);

    if (!(item in helpState.flows[flow].items)) {
        helpState.flows[flow].items[item] = {
            visible: false,
            seq: seq,
            flow: flow,
        };
        helpState.itemMap[item] = flow;
        setState({ ...helpState });
    } else {
        console.log("(already added)");
    }
}

/**
 * Sets up, and provides functions to maintain, Dynamic Help state.
 * @returns {DynamicHelpType.State} The composite state of the Dynamic Help system, intended for distrubution by DynamicHelpProvider.
 */

export const useDynamicHelpState = (): HelpTypes.HelpContext => {
    const [helpState, setHelpState] = React.useState<HelpTypes.State>({
        flows: {},
        itemMap: {},
        addHelpFlow: addHelpFlow,
        addHelpItem: addHelpItem,
    });

    console.log("Context initializer returning", helpState);
    return { helpState: helpState, setState: setHelpState };
};
