export const INPUTS = [
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1grcgeg/how_can_i_parallelize_nodes_in_langgraph_without/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1gs0b2p/hierarchical_agent_teams_keyerrornext/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1gujxbv/llmcompile_example_error_received_multiple/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1gz0140/launch_langgraph_unofficial_virtual_meetup_series/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1gzpz2n/overcoming_output_token_limit_with_agent/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1h20jwz/mcp_server_tools_langgraph_integration_example/",
    },
    expected: {
      relevant: true,
    },
  },
  // This is linking to the LangChain documentation. TBD if we want to add prompting to exclude this, since we might want to generate posts from our docs in the future.
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1h7d6it/adding_authentication_to_self_hosted_langgraph/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1i4lzzk/created_langgraphuisdk_package_with_tools/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangGraph/comments/1i5uvt0/universal_assistant_with_langgraph_and_anthropics/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i5xdru/what_setups_do_i_need_to_build_a_llm_use_case_on/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i6bte8/what_are_you_working_on/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i6fxcv/need_help_regarding_crm_integration/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i79ua0/which_version_of_langchain_and_promptflow_to_use/",
    },
    expected: {
      relevant: false,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i75ixh/gurubase_an_opensource_rag_system_built_with/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i5h3o6/new_walkthrough_video_for_langgraph_fastapi/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i5t5ry/notate_opensource_rag_desktop_application/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    // TBD If this works. Depends on if the reddit api will also pull in the content from the post this is "reposting"
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i5ow10/hugging_face_will_teach_you_how_to_use_langchain/",
    },
    expected: {
      relevant: true,
    },
  },
  {
    inputs: {
      link: "https://www.reddit.com/r/LangChain/comments/1i4v60d/sharing_our_open_source_poc_for_openai_realtime/",
    },
    expected: {
      relevant: true,
    },
  },
];
