# react-dynamic-help
Create flows of helpful prompts in your react application.

This library is intended to pop up help for the user _while they use the app_.

(In contrast to the common "tour based" help libraries, which "show your user the app in action" while they click "Next".)

The app interaction is intended to be minimally intrusive in the app codebase.

The app interacts primarily by registering elements as "help targets", and calling a callback to indicate that the target has been used.

Help Items and their Flows are specified in a separate JSX tree.

---

V 0.3.2 - Basic implementation of the concept.

Demo at https://github.com/GreenAsJade/react-dynamic-help-demo

---

Things to do:

 - Make HelpItem id's optional props ... not really clear why we need those exposed, until we get a feature that would use id.
 
 - Support a no-op pseudo Item somehow, so you can have a break in a flow, with a resume.
    - Wouldn't this just amount to "start another flow?"
    - Maybe, logically, but for ease of understanding - not clear!

 - Support showing multiple Help Items at a single step in the flow.

 - Have the standard Help Item layout be more "callout like", so it indicates clearly what the target is.

 - Be able to style the target to show that it is the target (drop-shadow or similar)

 But: https://stackoverflow.com/questions/73059467/how-do-you-set-the-style-of-an-element-obtained-from-a-callback-ref-in-typescrip

 - Fix up the packaging

This library was packaged following https://www.youtube.com/watch?v=vRmLTZyq57U

It turns out this might not have been the best choice of packaging guide.   The current packaging seems to work, but is non-standard (does not include the source) and cumbersome (manually copying CSS for example).