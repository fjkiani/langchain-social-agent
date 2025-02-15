import { Annotation, END } from "@langchain/langgraph";
import { ThreadPost } from "./types.js";
import { DateType } from "../types.js";

export const GenerateThreadAnnotation = Annotation.Root({
  /**
   * The reports to use for generating the thread.
   */
  reports: Annotation<string[]>,
  /**
   * The total number of posts to generate.
   */
  totalPosts: Annotation<number>,
  /**
   * The plan generated for the thread.
   */
  threadPlan: Annotation<string>,
  /**
   * The posts generated for the thread.
   */
  threadPosts: Annotation<ThreadPost[]>,
  /**
   * The date to schedule the post for.
   */
  scheduleDate: Annotation<DateType>,
  /**
   * Response from the user for the post. Typically used to request
   * changes to be made to the post.
   */
  userResponse: Annotation<string | undefined>,
  /**
   * The node to execute next.
   */
  next: Annotation<
    | "schedulePost"
    | "rewritePost"
    | "updateScheduleDate"
    | "unknownResponse"
    | typeof END
    | undefined
  >,

  /**
   * The image to attach to the post, and the MIME type.
   */
  image: Annotation<
    | {
        imageUrl: string;
        mimeType: string;
      }
    | undefined
  >,
});

export type GenerateThreadState = typeof GenerateThreadAnnotation.State;
