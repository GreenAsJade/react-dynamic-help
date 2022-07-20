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
    ApiProvider,
    HelpController,
    AppApi,
    TargetId,
    AppApiSetter,
} from "..";

type HelpProviderProps = {
    children: JSX.Element | JSX.Element[];
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

export const HelpProvider = (props: HelpProviderProps): JSX.Element => {
    const [app, ...helpFlows] = React.Children.toArray(
        props.children,
    ) as React.ReactElement[];

    // here we store the Contoller API functions when  provided to us by the HelpController...
    // ... for passing on to the Application via context.
    const [controllerApi, setControllerAPI] = React.useState<AppApi>(
        // this is a non-null initialiser for the API so the client doesn't have to worry if the API is initialised yet.
        // It doesn't matter these are called:
        // all APIs will be re-called after the API initialised, due to the resulting App re-render
        {
            registerTargetItem: (id: TargetId) => ({
                ref: (target: HTMLElement) => {
                    console.log(
                        "Info: registration of target before controller initialisation:",
                        id,
                        target,
                    );
                },
                used: () => {
                    console.log(
                        "Info: a target signalled used before controller initialisation",
                        id,
                    );
                },
            }),
        },
    );

    /**
     * The callback prop passed to the HelpController, which it uses to give us the API object.
     */
    const provideControllerApi: AppApiSetter = (apiObject) => {
        console.log("provide controller API called:", apiObject);
        setControllerAPI(apiObject);
    };

    console.log("Help provider render:", controllerApi);
    return (
        <>
            <ApiProvider value={controllerApi}>{app}</ApiProvider>
            <HelpController provideControllerApi={provideControllerApi}>
                {helpFlows}
            </HelpController>
        </>
    );
};
