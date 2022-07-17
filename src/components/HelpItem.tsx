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
import { DynamicHelpContext } from "../DynamicHelp";

type ItemStateInfo = [
    flow: HelpTypes.FlowState,
    itemState: HelpTypes.ItemState,
];

export const getItemState = (
    item: HelpTypes.ItemId,
    helpState: HelpTypes.State,
): ItemStateInfo => {
    const flowId = helpState.flowMap[item];
    const flow = helpState.flows[flowId];
    return [flow, flow?.items[item]];
};

type HelpItemProperties = {
    id: HelpTypes.ItemId;
    target: HelpTypes.TargetId;
    children: React.ReactNode;
};

type HelpItemState = {
    target: any;
};

/**
 * A display element in a Dynamic Help Flow - one "step" of the flow.
 *
 */

export class HelpItem extends React.PureComponent<
    HelpItemProperties,
    HelpItemState
> {
    static contextType = DynamicHelpContext;

    constructor(props: HelpItemProperties) {
        super(props);
        this.state = { target: null };
    }

    componentDidMount = () => {
        const { helpState, setState } = this.context as HelpTypes.HelpContext;

        if (!helpState.itemMap[this.props.target]) {
            helpState.itemMap[this.props.target] =
                new Set<HelpTypes.HelpItemElement>();
        }
        helpState.itemMap[this.props.target].add(this);

        setState({ ...helpState });
    };

    setTarget = (value: Element): void => {
        console.log("Setting Help Item target:", this.props.id, value);
        this.setState({ target: value });
    };

    render() {
        const { helpState } = this.context as HelpTypes.HelpContext;

        const [flowState, itemState] = getItemState(this.props.id, helpState);

        console.log("HelpItem render", this.props.id, flowState, itemState);

        if (flowState?.visible && itemState?.visible && !!this.state?.target) {
            const { bottom, right } = this.state.target.getBoundingClientRect();

            const itemTop = bottom;
            const itemLeft = right;

            return ReactDOM.createPortal(
                <div
                    className="rdh-help-item"
                    style={{
                        position: "absolute",
                        top: itemTop,
                        left: itemLeft,
                    }}
                >
                    {this.props.children}
                </div>,
                document.body,
            );
        } else {
            return <></>;
        }
    }
}
