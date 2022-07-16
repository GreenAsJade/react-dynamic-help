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

import { getItemState } from "../components/HelpItem";

/**
 * A hook to notify Dynamic Help that a element that is to be the target of a Help Item has become rendered.
 *
 * @param element : The ref to the element that will get the help
 * @param targetItem : The ItemId of the HelpItem that applies.
 */
export const useDynamicHelpTarget = (
    element: React.RefObject<any>,
    targetId: HelpTypes.TargetId,
) => {
    const helpContext = React.useContext(DynamicHelpContext);

    React.useEffect(() => {
        const { helpState, setState } = helpContext;

        console.log(
            "Help going to use Item target...",
            element,
            targetId,
            helpState,
        );

        const targetItems = helpState.itemMap[targetId];

        if (!targetItems) {
            console.warn(
                "useDynamicHelpTarget called with target %s but no HelpItem has that target",
                targetId,
                element,
            );
            return;
        }

        targetItems.forEach((targetItem) => {
            const flow = helpState.flowMap[targetItem];

            if (!flow) {
                console.warn(
                    "useDynamicHelp called for HelpItem %s that doesn't have a flow!",
                    targetItem,
                );
                return;
            }

            const itemState = getItemState(targetItem, helpState);

            itemState.targetRef = element.current;

            helpState.flows[flow].items[targetItem] = itemState;
        });
        console.log("setting help state:", helpState);
        setState({ ...helpState });
    }, []);
};
