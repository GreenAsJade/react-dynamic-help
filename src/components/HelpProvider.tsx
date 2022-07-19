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

import { ApiProvider, TargetItemSetter, HelpController } from "..";

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

    // here we store the target mapper function when it is provided to us by the HelpController...
    // ... for passing on to the Application via context.
    const [targetMapper, setTargetMapper] = React.useState<TargetItemSetter>(
        () => (ir: any, r: any) => {
            // this is a non-null initialiser for the callback, it doesn't matter if it is called,
            // the callback will be re-called after it's initialised
            console.log(
                "Info: target mapper called before initialised:",
                ir,
                r,
            );
        },
    );

    /**
     * The prop passed to the HelpController, which it uses to give us the mapper function,.
     * @param mapperFunction A ref-callback that the App can call to tell us when targets are mounted
     */
    const provideTargetMapper = (mapperFunction: TargetItemSetter) => {
        console.log("provide target mapper called:", mapperFunction);
        setTargetMapper(() => mapperFunction);
    };

    console.log("Help provider render:", targetMapper);
    return (
        <>
            <ApiProvider value={{ registerTargetItem: targetMapper }}>
                {app}
            </ApiProvider>
            <HelpController provideTargetMapper={provideTargetMapper}>
                {helpFlows}
            </HelpController>
        </>
    );
};
