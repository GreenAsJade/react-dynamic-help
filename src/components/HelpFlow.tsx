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

/**
 * A container component for Dynamic Help Flows.
 *
 * It defines the `id` of the Help Flow, and sequences the display of the `HelpItems`
 *
 */

export const HelpFlow = (props: HelpFlowProps): JSX.Element => {
    const helpContext = React.useContext(SystemContext);
    const helpState = helpContext.systemState;

    console.log("Helpflow sees state", helpState);

    // Initialize help flow state, checking local storage on the way
    React.useEffect(() => {
        //console.log("Help Flow - adding self... (tbd)", props.id);
    });

    return <>{props.children}</>;
};
