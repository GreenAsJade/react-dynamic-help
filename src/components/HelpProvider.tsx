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
  storageReady?: boolean;
  debug?: boolean;
  children: React.ReactElement | React.ReactElement[];
};

const DEFAULT_DICTIONARY: HelpPopupDictionary = {
  "Skip this topic": "Skip this topic",
  OK: "OK",
};

const uninitMsg = (functionName: string) =>
  `Info: ${functionName} called before controller initialized`;
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
  storageReady = true,
  debug = false,
  ...props
}: HelpProviderProps): React.ReactElement => {
  const [app, ...helpFlows] = React.Children.toArray(
    props.children,
  ) as React.ReactElement[];

  // Here we store the Controller API functions on our state, when they provided to us by the HelpController...
  // ... for passing on to the Application via context.

  // In this way, the App is decoupled from the Help System renders, which is important to avoid App ref regeneration loops.

  const [controllerApi, setControllerAPI] = React.useState<AppApi>(
    // This is a non-null initialiser for the API so the client doesn't have to worry if the API is initialised yet.
    // It doesn't matter if these are called: all APIs will be re-called after the API initialised, due to the resulting App re-render.
    // Some will certainly be called before intialisation, due to render sequence, and depending what is on the initial page
    {
      registerTargetItem: (id: TargetId) => ({
        ref: (target: HTMLElement | null) => {
          log(debug, uninitMsg("registration of target"), id, target);
        },
        active: () => {
          log(debug, uninitMsg("returned that target is not active"), id);
          return false;
        },
        used: () => {
          log(debug, uninitMsg("target used"), id);
        },
      }),
      triggerFlow: (flowId) => {
        log(debug, uninitMsg("triggerFlow"), flowId);
      },
      enableFlow: (flow, enabled) => {
        log(debug, uninitMsg("enableFlow"), flow, enabled);
      },
      reloadUserState: () => {
        log(debug, uninitMsg("reloadUserState"));
      },
      signalUsed: (target) => {
        log(debug, uninitMsg("signalUsed"), target);
      },
      getFlowInfo: () => {
        log(debug, uninitMsg("getFlowInfo"));
        return [];
      },
      enableHelp: (enabled) => {
        log(debug, uninitMsg("enableHelp"), enabled);
      },
      getSystemStatus: () => ({
        enabled: false,
        initialized: false,
      }),
      resetHelp: () => {
        log(debug, uninitMsg("helpReset"));
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
      <ApiProvider value={controllerApi}>
        {app}
        <HelpController
          provideControllerApi={provideControllerApi}
          dictionary={props.dictionary || DEFAULT_DICTIONARY}
          storage={storageApi}
          storageReady={storageReady}
          debug={debug}
        >
          {helpFlows}
        </HelpController>
      </ApiProvider>
    </>
  );
};
