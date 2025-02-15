import { Annotation } from "@langchain/langgraph";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { VerifyLinksResultAnnotation } from "../verify-links/verify-links-state.js";

export const VerifyTweetAnnotation = Annotation.Root({
  /**
   * The link to the content to verify.
   */
  link: VerifyContentAnnotation.spec.link,
  /**
   * The raw content of the Tweet
   */
  tweetContent: Annotation<string>,
  /**
   * URLs which were found in the Tweet
   */
  tweetContentUrls: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  ...VerifyLinksResultAnnotation.spec,
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   *
   * pageContents is defined in the VerifyLinksResultAnnotation spec, so
   *  we spread it above this to ensure it uses this custom reducer.
   */
  pageContents: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;

      if (update[0]?.startsWith("The following is the content of the Tweet:")) {
        // This means the update is from validateTweetContent so we can remove
        // all other state fields.
        return update;
      }

      return (state || []).concat(update);
    },
    default: () => [],
  }),
});
