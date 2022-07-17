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

/**
 * A hook to notify Dynamic Help that an element that is to be the target of a Help Item has become rendered.
 *
 * @param targetId : The Help TargedId of the item to bne set up
 */
export const useDynamicHelpTarget = (targetId: HelpTypes.TargetId) => {
    console.log("setting up help targetting ", targetId);

    const helpState = React.useContext(DynamicHelpContext).helpState;

    const setRefCallback = (targetRef: any) => {
        console.log(
            "Help Target node update...",
            targetId,
            targetRef,
            helpState,
        );

        const targetItems = helpState.itemMap[targetId];

        if (!targetItems) {
            console.warn(
                "Help Target node update called with target %s but no HelpItem has that target",
                targetId,
            );
            return;
        }

        targetItems.forEach((targetItem) => {
            console.log("At change check:", targetItem);

            targetItem?.setTargetPresent(!!targetRef);
        });
    };

    return setRefCallback;
};
