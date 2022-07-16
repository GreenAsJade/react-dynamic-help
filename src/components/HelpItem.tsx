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
import { DynamicHelpContext } from "../DynamicHelp";

type HelpItemProps = {
    id: HelpTypes.ItemId;
    target: HelpTypes.TargetId;
    children: React.ReactNode;
};

export const getItemState = (
    item: HelpTypes.ItemId,
    helpState: HelpTypes.State,
): HelpTypes.ItemState => {
    const flow = helpState.flowMap[item];

    return helpState.flows[flow]?.items[item];
};

/**
 * A display element in a Dynamic Help Flow - one "step" of the flow.
 *
 * (currently just renders its children, if `visible`: other functionality TBD!)
 */

export const HelpItem = (props: HelpItemProps): JSX.Element => {
    const { helpState } = React.useContext(DynamicHelpContext);

    const state: HelpTypes.ItemState = getItemState(props.id, helpState);

    const showSelf = state?.visible && !!state?.targetRef;

    console.log("Help Item render:", props.id, showSelf, state, helpState);

    return <>{showSelf ? props.children : ""}</>;
};
