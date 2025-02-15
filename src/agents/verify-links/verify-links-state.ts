import { Annotation } from "@langchain/langgraph";

export const VerifyLinksGraphSharedAnnotation = Annotation.Root({
  /**
   * The links to verify.
   */
  links: Annotation<string[]>,
});

const sharedLinksReducer = (
  state: string[] | undefined,
  update: string[] | undefined,
) => {
  if (update === undefined) return undefined;
  // Use a set to ensure no duplicate links are added.
  const stateSet = new Set(state || []);
  update.forEach((link) => stateSet.add(link));
  return Array.from(stateSet);
};

export const VerifyLinksResultAnnotation = Annotation.Root({
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      return (state || []).concat(update);
    },
    default: () => [],
  }),
  /**
   * Relevant links found in the message.
   */
  relevantLinks: Annotation<string[] | undefined>({
    reducer: sharedLinksReducer,
    default: () => [],
  }),
  /**
   * Image options to provide to the user.
   */
  imageOptions: Annotation<string[] | undefined>({
    reducer: sharedLinksReducer,
    default: () => [],
  }),
});

export const VerifyLinksGraphAnnotation = Annotation.Root({
  /**
   * The links to verify.
   */
  links: VerifyLinksGraphSharedAnnotation.spec.links,
  ...VerifyLinksResultAnnotation.spec,
});
