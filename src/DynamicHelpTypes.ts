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

import React from "react";

export type FlowId = string;
export type ItemId = string;
export type TargetId = string;
export type StorageKey = string;

export type ItemState = {
    visible: boolean;
    seq: number;
    flow: FlowId;
    targetRef: JSX.Element | null;
};

type ItemStates = {
    [id: ItemId]: ItemState;
};

export type FlowState = {
    visible: boolean;
    showInitially: boolean;
    items: ItemStates;
};

type FlowStates = {
    [id: FlowId]: FlowState;
};

type FlowMap = {
    [item: ItemId]: FlowId;
};

// Many Help Items may target a particular UI element
type ItemMap = {
    [target: TargetId]: Set<ItemId>;
};

type StateSetter = React.Dispatch<React.SetStateAction<State>>;

export type HelpContext = {
    helpState: State;
    setState: StateSetter;
};

type AddFlowFunction = (
    helpContext: HelpContext,
    id: FlowId,
    showInitially: boolean,
) => void;

type AddItemFunction = (
    helpContext: HelpContext,
    flow: FlowId,
    item: ItemId,
    target: TargetId,
    seq: number,
) => void;

export type State = {
    flows: FlowStates;
    flowMap: FlowMap;
    itemMap: ItemMap;
    addHelpFlow: AddFlowFunction;
    addHelpItem: AddItemFunction;
};
