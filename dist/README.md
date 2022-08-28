# react-dynamic-help
Create flows of helpful prompts in your react application.

This library is intended to pop up help for the user _while they use the app_.

(In contrast to the common "tour based" help libraries, which "show your user the app in action" while they click "Next".)

---

V 2.3.0 - As integrated with [online-go.com](https://online-go.com).

Demo at https://github.com/GreenAsJade/react-dynamic-help-demo

---

The app interaction is intended to be minimally intrusive in the app codebase.

The app interacts primarily by registering elements as "help targets", and calling a callback to indicate that the target has been used.
```js
function AppWithHelp(): JSX.Element {
   return (
       <DynamicHelp.HelpProvider>
           <App />
           <HelpFlows />
       </DynamicHelp.HelpProvider>
   );
}

export const AComponent = (props: ConfigProps): JSX.Element => {

   const { registerTargetItem } = React.useContext(DynamicHelp.Api);

   const { ref: addStatButton, used: signalAddStatUsed } =
       registerTargetItem("add-stat-button");

   const addStat = () => {
       setNewStatEntryOpen(true);
       signalAddStatUsed();
   };

   return ( // ...
                   <FA
                       ref={addStatButton}
                       icon={faCirclePlus}
                       onClick={addStat}
                   />

```

Help Items and their Flows are specified in a separate JSX tree.

```js
export function HelpFlows(): JSX.Element {
   return (
       <div className="help-flow-container">
           <HelpFlow id="new-user" showInitially={true}>
               <HelpItem target="help-toggle">
                   <div>Click here to see more Dynamic Help</div>
               </HelpItem>
           </HelpFlow>

           <HelpFlow id="basic" showInitially={false}>
               <HelpItem target="add-stat-button">
                   <div>Click to add a stat</div>
               </HelpItem>
               <HelpItem target="stat-name-input" position="bottom-centre">
                   <div>Enter the name for a stat</div>
               </HelpItem>
               <HelpItem target="dice-chooser" position="bottom-center">
                   <div>Choose a dice type</div>
               </HelpItem>
               <HelpItem id="help-for-stat-ok" target="stat-ok">
                   <div>OK?</div>

// …
```

---

Things to do:

 - Make sure that deleted flows (and renamed ones) are removed from stored state.

 - Support a no-op pseudo Item somehow, so you can have a break in a flow, with a resume.
    - Wouldn't this just amount to "start another flow?"
       - It's not the same, because "start another flow" calls for app interaction, this should be doable in the HelpFlow/Item definition.

 - Support showing multiple Help Items at a single step in the flow.

 - Have the standard Help Item layout be more "callout like", so it indicates clearly what the target is.

 - Be able to target items via css selector as an alternative to ref
    - Don't know if it is even possible.
    - Note that this would not support registration based features, but would be even less imact on the app.

 - Fix up the packaging

This library was packaged following https://www.youtube.com/watch?v=vRmLTZyq57U

It turns out this might not have been the best choice of packaging guide.   The current packaging seems to work, but is non-standard (does not include the source) and cumbersome (manually copying CSS for example).
