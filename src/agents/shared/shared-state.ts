import { Annotation } from "@langchain/langgraph";

export const VerifyContentAnnotation = Annotation.Root({
  /**
   * The link to the content to verify.
   */
  link: Annotation<string>,
});
