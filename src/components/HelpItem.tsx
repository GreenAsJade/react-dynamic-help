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
import * as ReactDOM from "react-dom";

import * as HelpTypes from "../DynamicHelpTypes";
import { SystemContext } from "../DynamicHelp";

const defaultAnchors: {
    [position in HelpTypes.Position as string]: HelpTypes.Position;
} = {
    "top-left": "bottom-right",
    "top-right": "bottom-left",
    "bottom-left": "top-right",
    "bottom-right": "top-left",
    "top-centre": "bottom-left",
    "top-center": "bottom-left",
    "bottom-centre": "top-left",
    "bottom-center": "top-left",
    "center-left": "bottom-right",
    "centre-left": "bottom-right",
    "center-right": "bottom-left",
    "centre-right": "bottom-left",
};

type HelpItemProperties = {
    target: HelpTypes.TargetId; // App element the HelpItem relates to
    position?: HelpTypes.Position; // where the HelpItem is placed on the target
    anchor?: HelpTypes.Position; // which part of the HelpItem is placed at `position`
    margin?: string; // can be used to offset the HelpItem from the default position
    layout?: "left" | "right"; // which side is the dismiss button
    id?: HelpTypes.ItemId; // user can provide this for css targetting
    highlightTarget?: boolean;
    debug?: boolean; // note - this will be overriden by Flow debug, if that is set.

    // provided by the containing HelpFlow:
    state?: HelpTypes.ItemState;
    flowState?: HelpTypes.FlowState;
    systemEnabled?: boolean;
    signalDismissed?: () => void;

    children: React.ReactNode; // The help popup elements.
};

/**
 * A display element in a Dynamic Help Flow - one "step" of the flow.
 *
 */

export function HelpItem({
    position = "bottom-right",
    debug = false,
    highlightTarget = true,
    ...props
}: HelpItemProperties): JSX.Element {
    const { appTargetsState } = React.useContext(SystemContext);
    const initialWidth = React.useRef(0);

    const thisItem = React.useRef<HTMLDivElement>(null);

    const target = appTargetsState.targetItems[props.target];

    // we need to know the width prior to adding ourselves, so we can
    // detect whether we fell off to the right.
    initialWidth.current = window.innerWidth;

    React.useEffect(() => {
        if (thisItem.current) {
            const disp = thisItem.current;
            console.log(
                "HELP ITEM post render",
                disp.getBoundingClientRect(),
                window.innerWidth,
            );
            // Here we try to make sure that we ended up on the screen, and if not then
            // reposition to a sensible place
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const { top, bottom, left, right } = disp.getBoundingClientRect();
            const width = right - left;
            const height = bottom - top;

            if (left < 0) {
                disp.style.left = "0px";
                const newRight = vw - width;
                disp.style.right = `${newRight}px`;
            } else if (right > initialWidth.current) {
                disp.style.right = "0px";
                const newLeft = initialWidth.current - width;
                disp.style.left = `${newLeft}px`;
            }

            if (top < 0) {
                disp.style.top = "0px";
                const newBottom = vh - height;
                disp.style.bottom = `${newBottom}px`;
            }
            // we don't try to move it up from below the bottom, because if it is down there,
            // then so is the element it refers to.
        }
    });

    if (
        target &&
        props.flowState?.visible &&
        props.state?.visible &&
        props.systemEnabled
    ) {
        // We need to render ourselves.

        // What follows is maths to attach the `anchor` corner of this element (itemPosition) to
        // the `position` corner of the target, taking into accound that bottom and right are measured
        // from the bottom and right of the windown respectively for css absolute position, but they are measured
        // from the top and left respectively for getBoundingClientRect (FFS).

        const {
            top: targetTop,
            bottom: targetBottom,
            left: targetLeft,
            right: targetRight,
        } = target.getBoundingClientRect();

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let itemPosition = {};

        const anchor = props.anchor || defaultAnchors[position];

        const yAnchor = anchor.includes("top") ? "top" : "bottom";
        const xAnchor = anchor.includes("left") ? "left" : "right";

        const yAnchorTargetBottom =
            yAnchor === "top" ? targetBottom : vh - targetBottom;
        const yAnchorTargetTop =
            yAnchor === "bottom" ? vh - targetTop : targetTop;
        const xAnchorTargetLeft =
            xAnchor === "right" ? vw - targetLeft : targetLeft;
        const xAnchorTargetRight =
            xAnchor === "left" ? targetRight : vw - targetRight;

        const yAnchorTargetCentre =
            yAnchor === "top"
                ? (targetTop + targetBottom) / 2
                : vh - (targetTop + targetBottom) / 2;

        const xAnchorTargetCentre =
            xAnchor === "left"
                ? (targetRight + targetLeft) / 2
                : vw - (targetRight + targetLeft) / 2;

        if (position === "bottom-right") {
            itemPosition = {
                [yAnchor]: yAnchorTargetBottom,
                [xAnchor]: xAnchorTargetRight,
            };
        } else if (position === "top-left") {
            itemPosition = {
                [yAnchor]: yAnchorTargetTop,
                [xAnchor]: xAnchorTargetLeft,
            };
        } else if (position === "bottom-left") {
            itemPosition = {
                [yAnchor]: yAnchorTargetBottom,
                [xAnchor]: xAnchorTargetLeft,
            };
        } else if (position === "top-right") {
            itemPosition = {
                [yAnchor]: yAnchorTargetTop,
                [xAnchor]: xAnchorTargetRight,
            };
        } else if (["bottom-centre", "bottom-center"].includes(position)) {
            itemPosition = {
                [yAnchor]: yAnchorTargetBottom,
                [xAnchor]: xAnchorTargetCentre,
            };
        } else if (["top-centre", "top-center"].includes(position)) {
            itemPosition = {
                [yAnchor]: yAnchorTargetTop,
                [xAnchor]: xAnchorTargetCentre,
            };
        } else if (["centre-left", "center-left"].includes(position)) {
            itemPosition = {
                [xAnchor]: xAnchorTargetLeft,
                [yAnchor]: yAnchorTargetCentre,
            };
        } else if (["centre-right", "center-right"].includes(position)) {
            itemPosition = {
                [xAnchor]: xAnchorTargetRight,
                [yAnchor]: yAnchorTargetCentre,
            };
        }

        // make sure we have a bit of margin
        let itemMargin = props.margin;

        if (!itemMargin) {
            if (position.includes("left")) {
                itemMargin = "0 3px 0 0";
            } else if (position.includes("right")) {
                itemMargin = "0 0 0 3px";
            } else if (position.includes("bottom")) {
                itemMargin = "3px 0 0 0";
            } else {
                itemMargin = "0 0 3px 0";
            }
        }
        // Now we make sure that the dismiss button is in a sensible place, with a sensible margin,
        // unless they specified it...

        let layout = "right";

        if (props.layout) {
            layout = props.layout;
        } else if (position.includes("left")) {
            layout = "left";
        }

        const dismissStyle =
            layout === "right"
                ? "rdh-dismiss-margin-left"
                : "rdh-dismiss-margin-right";

        // final niceties...
        if (highlightTarget) {
            target.style.boxShadow = "0px 0px 5px rgb(251 153 170)";
        }

        if (debug) {
            console.log(
                "rendering HelpItem",
                initialWidth.current,
                props.children,
            );
        }

        // Render...

        return ReactDOM.createPortal(
            <div
                className={
                    /* the -custom piece allows the app to be more specific and hence override our css */
                    "rdh-help-item rdh-help-item-custom"
                }
                ref={thisItem}
                id={props.id}
                style={{
                    position: "absolute",
                    margin: itemMargin,
                    flexDirection: layout === "right" ? "row" : "row-reverse",
                    ...itemPosition,
                }}
            >
                <div className="rdh-help-item-content">{props.children}</div>
                <sup
                    className={`rdh-help-item-dismiss ${dismissStyle}`}
                    onClick={props.signalDismissed}
                >
                    ☒
                </sup>
            </div>,
            document.body,
        );
    } else {
        // we're not visible
        if (highlightTarget && target) {
            target.style.boxShadow = ""; // note that this _does_ allow the css-specified value to return (phew)
        }
        return <></>;
    }
}

type ItemStateInfo = [
    flow: HelpTypes.FlowState,
    itemState: HelpTypes.ItemState,
];

// Currently not used because we receive this info on props.

export const getItemState = (
    item: HelpTypes.ItemId,
    helpState: HelpTypes.SystemState,
): ItemStateInfo => {
    const flowId = helpState.flowMap[item];
    const flow = helpState.flows[flowId];
    return [flow, helpState.items[item]];
};
