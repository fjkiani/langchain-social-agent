import { SimpleRedditPostWithComments } from "../../clients/reddit/types.js";
import { VerifyRedditPostAnnotation } from "./verify-reddit-post-state.js";

export type RedditPostRoot = RedditPostRoot2[];

export interface RedditPostRoot2 {
  kind: string;
  data: RedditPostData;
}

export interface RedditPostData {
  after: any;
  dist?: number;
  modhash: string;
  geo_filter: string;
  children: RedditPostChildren[];
  before: any;
}

export interface RedditPostChildren {
  kind: string;
  data: RedditPostData2;
}

export interface RedditPostData2 {
  approved_at_utc: any;
  subreddit: string;
  selftext?: string;
  user_reports: any[];
  saved: boolean;
  mod_reason_title: any;
  gilded: number;
  clicked?: boolean;
  title?: string;
  link_flair_richtext?: any[];
  subreddit_name_prefixed: string;
  hidden?: boolean;
  pwls?: number;
  link_flair_css_class?: string;
  downs: number;
  thumbnail_height: any;
  top_awarded_type: any;
  hide_score?: boolean;
  name: string;
  quarantine?: boolean;
  link_flair_text_color?: string;
  upvote_ratio?: number;
  author_flair_background_color?: string;
  subreddit_type: string;
  ups: number;
  total_awards_received: number;
  media_embed?: RedditPostMediaEmbed;
  thumbnail_width: any;
  author_flair_template_id: any;
  is_original_content?: boolean;
  author_fullname?: string;
  secure_media: any;
  is_reddit_media_domain?: boolean;
  is_meta?: boolean;
  category: any;
  secure_media_embed?: RedditPostSecureMediaEmbed;
  link_flair_text?: string;
  can_mod_post: boolean;
  score: number;
  approved_by: any;
  is_created_from_ads_ui?: boolean;
  author_premium?: boolean;
  thumbnail?: string;
  edited: any;
  author_flair_css_class: any;
  author_flair_richtext?: any[];
  gildings: RedditPostGildings;
  content_categories: any;
  is_self?: boolean;
  mod_note: any;
  created: number;
  link_flair_type?: string;
  wls?: number;
  removed_by_category: any;
  banned_by: any;
  author_flair_type?: string;
  domain?: string;
  allow_live_comments?: boolean;
  selftext_html?: string;
  likes: any;
  suggested_sort: any;
  banned_at_utc: any;
  view_count: any;
  archived: boolean;
  no_follow: boolean;
  is_crosspostable?: boolean;
  pinned?: boolean;
  over_18?: boolean;
  all_awardings: any[];
  awarders: any[];
  media_only?: boolean;
  link_flair_template_id?: string;
  can_gild: boolean;
  spoiler?: boolean;
  locked: boolean;
  author_flair_text: any;
  treatment_tags: any[];
  visited?: boolean;
  removed_by: any;
  num_reports: any;
  distinguished: any;
  subreddit_id: string;
  author_is_blocked: boolean;
  mod_reason_by: any;
  removal_reason: any;
  link_flair_background_color?: string;
  id: string;
  is_robot_indexable?: boolean;
  num_duplicates?: number;
  report_reasons: any;
  author: string;
  discussion_type: any;
  num_comments?: number;
  send_replies: boolean;
  media: any;
  contest_mode?: boolean;
  author_patreon_flair?: boolean;
  author_flair_text_color?: string;
  permalink: string;
  stickied: boolean;
  url?: string;
  subreddit_subscribers?: number;
  created_utc: number;
  num_crossposts?: number;
  mod_reports: any[];
  is_video?: boolean;
  comment_type: any;
  link_id?: string;
  replies: any;
  collapsed_reason_code: any;
  parent_id?: string;
  body?: string;
  collapsed?: boolean;
  is_submitter?: boolean;
  body_html?: string;
  collapsed_reason: any;
  associated_award: any;
  unrepliable_reason: any;
  score_hidden?: boolean;
  controversiality?: number;
  depth?: number;
  collapsed_because_crowd_control: any;
}

export interface RedditPostMediaEmbed {}

export interface RedditPostSecureMediaEmbed {}

export interface RedditPostGildings {}

export interface FormattedRedditPost {
  post: string;
  replies: string[];
}

export type RedditPostsWithExternalData = SimpleRedditPostWithComments & {
  externalData: {
    url: string;
    pageContent: string;
  }[];
};

export type VerifyRedditGraphState = typeof VerifyRedditPostAnnotation.State;
