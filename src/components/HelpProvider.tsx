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

import {
    AppApi,
    TargetId,
    AppApiSetter,
    DynamicHelpStorageAPI,
    HelpPopupDictionary,
} from "../DynamicHelpTypes";

import { StorageApi } from "../storage";

import { ApiProvider, log } from "../DynamicHelp";
import { HelpController } from "../components/HelpController";

type HelpProviderProps = {
    dictionary?: HelpPopupDictionary;
    storageApi?: DynamicHelpStorageAPI;
    debug?: boolean;
    children: JSX.Element | JSX.Element[];
};

const DEFAULT_DICTIONARY: HelpPopupDictionary = {
    "Don't show me these": "Don't show me these",
    Skip: "Skip",
};

/**
 * The component that connects the help flows to the app.
 *
 * A callback is provided from the HelpController to the App via AppContext, to let the App register 'target items'
 *
 * The registered target items are provided by SystemContext to the Help System.
 *
 * This component is needed to decouple renders of the help system from renders of the App,
 * which in turn is needed because the help system is updated when refs callbacks are called in the App
 *  => Help system updates must not cause an app re-render.
 *
 */

export const HelpProvider = ({
    storageApi = StorageApi,
    debug = false,
    ...props
}: HelpProviderProps): JSX.Element => {
    const [app, ...helpFlows] = React.Children.toArray(
        props.children,
    ) as React.ReactElement[];

    // Here we store the Contoller API functions on our state, when they provided to us by the HelpController...
    // ... for passing on to the Application via context.

    // In this way, the App is decoupled from the Help System renders, which is important to avoid App ref regeneration loops.

    const [controllerApi, setControllerAPI] = React.useState<AppApi>(
        // This is a non-null initialiser for the API so the client doesn't have to worry if the API is initialised yet.
        // It doesn't matter if these are called: all APIs will be re-called after the API initialised, due to the resulting App re-render.
        // Some will certainly be called before intialisation, due to render sequence.
        // Others... it would be suprising.  They are the "console.warn" ones.
        {
            registerTargetItem: (id: TargetId) => ({
                ref: (target: HTMLElement) => {
                    log(
                        debug,
                        "Info: registration of target before controller initialised:",
                        id,
                        target,
                    );
                },
                used: () => {
                    console.warn(
                        "Warning: a target signalled used before controller initialized",
                        id,
                    );
                },
            }),
            enableFlow: (flow, enabled) => {
                log(
                    debug,
                    "Info: enableFlow called before controller initialized",
                    flow,
                    enabled,
                );
            },
            signalUsed: (target) => {
                console.warn(
                    "Warning: signalUsed called before controller initialized",
                    target,
                );
            },
            getFlowInfo: () => {
                log(
                    debug,
                    "Info: getFlowInfo called before controller initialized.",
                );
                return [];
            },
            enableHelp: (enabled) => {
                log(
                    debug,
                    "Info: enableHelp called before controller initialised",
                    enabled,
                );
            },
            getSystemStatus: () => ({
                enabled: false,
            }),
            resetHelp: () => {
                log(
                    debug,
                    "Info: App signalled help-reset before controller initialized.",
                );
            },
        },
    );

    /**
     * The callback prop passed to the HelpController, which it uses to give us the API object.
     */
    const provideControllerApi: AppApiSetter = (apiObject) => {
        log(debug, "HelpProvider provideController API called:", apiObject);

        setControllerAPI(apiObject);
    };

    return (
        <>
            <ApiProvider value={controllerApi}>{app}</ApiProvider>
            <HelpController
                provideControllerApi={provideControllerApi}
                dictionary={props.dictionary || DEFAULT_DICTIONARY}
                storage={storageApi}
                debug={debug}
            >
                {helpFlows}
            </HelpController>
        </>
    );
};
