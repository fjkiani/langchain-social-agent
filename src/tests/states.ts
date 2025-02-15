export const GITHUB_URL_STATE = {
  slackMessage: {
    id: "e4fd6d66-7a47-4457-b532-14facfe93bb0",
    timestamp: "1729953413.037949",
    user: "U04N0HGF869",
    text: "<https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py>",
    type: "message",
    attachments: [
      {
        id: 1,
        footer_icon: "https://slack.github.com/static/img/favicon-neutral.png",
        color: "24292f",
        bot_id: "B04FT0ZDXD2",
        app_unfurl_url:
          "https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py",
        is_app_unfurl: true,
        app_id: "A01BP7R4KNY",
        fallback:
          "<https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py | code_assistant_lg.py>",
        text: '```\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom pydantic import BaseModel, Field\nfrom langchain_openai import AzureChatOpenAI\nimport os\nimport subprocess\nimport pkg_resources\n\nos.environ["AZURE_OPENAI_ENDPOINT"] = "azure deployment end point"\nos.environ["AZURE_OPENAI_API_KEY"] = "provide-your-key"\n\nllm = AzureChatOpenAI(\n    azure_deployment="gpt-4",  # or your deployment\n    api_version="2023-06-01-preview",  # or your api version\n    temperature=0,\n    max_tokens=None,\n    timeout=None,\n    max_retries=2,\n    # other params...\n)\n\ncode_gen_prompt = ChatPromptTemplate.from_messages(\n    [\n        (\n            "system",\n            """You are a coding assistant with expertise in python language. \\n \n             Structure your answer with list of imports \\n\n             and the functioning code block. Here is the user question:""",\n        ),\n        ("placeholder", "{messages}"),\n    ]\n)\n\ncode_gen_prompt_package_install = ChatPromptTemplate.from_messages(\n    [\n        (\n            "system",\n            """You are a coding assistant with expertise in python language. \\n \n               you need to provide name of package to be installed \n               output expected:\n               display only name of the packagename, not pip install packagename""",\n        ),\n        ("placeholder", "{messages}"),\n    ]\n)\n\n\nclass Code(BaseModel):\n    """Schema for code solutions"""\n\n    imports: str = Field(description="Code block import statements")\n    code: str = Field(description="Code block not including import statements")\n\n\ndef parse_output(solution):\n    """When we add \'include_raw=True\' to structured output,\n    it will return a dict w \'raw\', \'parsed\', \'parsing_error\'."""\n\n    return solution["parsed"]\n\n\nquestion = "selenium webdriver python code to launch a webdriver and close it"\ncode_gen_chain = code_gen_prompt | llm.with_structured_output(Code, include_raw=True) | parse_output\ncode_gen_chain_package_install = code_gen_prompt_package_install | llm\n\n# solution = code_gen_chain.invoke(\n#     {"messages": [("user", question)]}\n# )\n# print(solution)\n\n\nfrom typing import List\nfrom typing_extensions import TypedDict\n\n\nclass GraphState(TypedDict):\n    """\n    Represents the state of our graph.\n\n    Attributes:\n        error : Binary flag for control flow to indicate whether test error was tripped\n        messages : With user question, error messages, reasoning\n        generation : Code solution\n        iterations : Number of tries\n    """\n\n    error: str\n    messages: List\n    generation: str\n    iterations: int\n    package_failed: str\n\n\n### Parameter\n\n# Max tries\nmax_iterations = 3\n\n\ndef generate(state: GraphState):\n    """\n    Generate a code solution\n\n    Args:\n        state (dict): The current graph state\n\n    Returns:\n        state (dict): New key added to state, generation\n    """\n\n    print("---GENERATING CODE SOLUTION---")\n\n    # State\n    messages = state["messages"]\n    iterations = state["iterations"]\n    error = state["error"]\n\n    # We have been routed back to generation with an error\n    if error == "yes":\n        messages += [\n            (\n                "user",\n                "Now, try again. Invoke the code tool to structure the output with a imports, and code block:",\n            )\n        ]\n\n    # Solution\n    code_solution = code_gen_chain.invoke(\n        {"messages": messages}\n    )\n    messages += [\n        (\n            "assistant",\n            f"Imports: {code_solution.imports} \\n Code: {code_solution.code}",\n        )\n    ]\n\n    # Increment\n    iterations = iterations + 1\n    return {"generation": code_solution, "messages": messages, "iterations": iterations}\n\n\ndef code_check(state: GraphState):\n    """\n    Check code\n\n    Args:\n        state (dict): The current graph state\n\n    Returns:\n        state (dict): New key added to state, error\n    """\n\n    print("---CHECKING CODE---")\n\n    # State\n    messages = state["messages"]\n    code_solution = state["generation"]\n    iterations = state["iterations"]\n\n    # Get solution components\n    imports = code_solution.imports\n    code = code_solution.code\n\n    # Check imports\n    try:\n        exec(imports)\n    except Exception as e:\n        print("---CODE IMPORT CHECK: FAILED---")\n        error_message = [("user", f"Your solution failed the import test: {e}")]\n        messages += error_message\n        return {\n            "generation": code_solution,\n            "messages": messages,\n            "iterations": iterations,\n            "error": "yes",\n            "package_failed": "yes"\n        }\n\n    # Check execution\n    try:\n        exec(imports + "\\n" + code)\n    except Exception as e:\n        print("---CODE BLOCK CHECK: FAILED---")\n        error_message = [("user", f"Your solution failed the code execution test: {e}")]\n        messages += error_message\n        return {\n            "generation": code_solution,\n            "messages": messages,\n            "iterations": iterations,\n            "error": "yes",\n            "package_failed": "no"\n        }\n\n    # No errors\n    print("---NO CODE TEST FAILURES---")\n    return {\n        "generation": code_solution,\n        "messages": messages,\n        "iterations": iterations,\n        "error": "no",\n        "package_failed": "no"\n    }\n\n\ndef check_package(state: GraphState):\n    messages = state["messages"]\n    code_solution = state["generation"]\n    iterations = state["iterations"]\n    package_failed = state["package_failed"]\n\n    if package_failed:\n        package_name = code_gen_chain_package_install.invoke({"messages": state["messages"]})\n        print("---Checking package failure---")\n\n        try:\n            # Check if the package is already installed\n            pkg_resources.get_distribution(package_name.content)\n            print(f"{package_name} is already installed.")\n        except Exception as e:\n            # If not installed, install the package\n            print(f"Installing {package_name.content}...")\n            subprocess.run([\'pip3\', \'install\', package_name.content], check=True)\n            print(f"{package_name.content} installed successfully.")\n            messages += [\n                (\n                    "assistant",\n                    f"{package_name.content} installed successfully.",\n                )\n            ]\n\n    return {\n        "generation": code_solution,\n        "messages": messages,\n        "iterations": iterations,\n        "error": "no",\n        "package_failed": "no"\n    }\n\n\n### Edges\n\n\ndef decide_to_finish(state: GraphState):\n    """\n    Determines whether to finish.\n\n    Args:\n        state (dict): The current graph state\n\n    Returns:\n        str: Next node to call\n    """\n    error = state["error"]\n    iterations = state["iterations"]\n\n    if error == "no" or iterations == max_iterations:\n        print("---DECISION: FINISH---")\n        return "end"\n    else:\n        print("---DECISION: RE-TRY SOLUTION---")\n        return "generate"\n\n\nfrom langgraph.graph import END, StateGraph, START\n\nworkflow = StateGraph(GraphState)\n\n# Define the nodes\nworkflow.add_node("generate", generate)  # generation solution\nworkflow.add_node("check_code", code_check)  # check code\nworkflow.add_node("check_package", check_package)\n\n# Build graph\nworkflow.add_edge(START, "generate")\nworkflow.add_edge("generate", "check_code")\nworkflow.add_edge("check_code", "check_package")\nworkflow.add_conditional_edges(\n    "check_package",\n    decide_to_finish,\n    {\n        "end": END,\n        "generate": "generate",\n    },\n)\n\napp = workflow.compile()\n\nsolution = app.invoke({"messages": [("user", question)], "iterations": 0, "error": "", "package_failed": ""})\nfrom pprint import pprint\n\npprint(solution)\n\n```',
        title:
          "<https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py | code_assistant_lg.py>",
        footer:
          "<https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples|ReddyNitheeesh/AI-Lc-Lg-examples>",
        mrkdwn_in: ["text"],
      },
    ],
    links: [
      "https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py",
    ],
  },
};

// Tweet with nested youtube video
// https://x.com/LangChainAI/status/1851676266232950985

// Tweet with nested github link
// https://x.com/LangChainAI/status/1861108590792036799

// Tweet with nested general link
// https://x.com/KaranVaidya6/status/1861037496295137314

export const TWITTER_NESTED_YOUTUBE_MESSAGE = {
  slackMessage: {
    id: "e4fd6d66-7a47-4457-b532-14facfe93bb0",
    timestamp: "1729953413.037949",
    user: "U04N0HGF869",
    text: "<https://x.com/LangChainAI/status/1851676266232950985>",
    type: "message",
    links: ["https://x.com/LangChainAI/status/1851676266232950985"],
  },
};

export const TWITTER_NESTED_GITHUB_MESSAGE = {
  slackMessage: {
    id: "e4fd6d66-7a47-4457-b532-14facfe93bb0",
    timestamp: "1729953413.037949",
    user: "U04N0HGF869",
    text: "<https://x.com/LangChainAI/status/1861108590792036799>",
    type: "message",
    links: ["https://x.com/LangChainAI/status/1861108590792036799"],
  },
};

export const TWITTER_NESTED_GENERAL_MESSAGE = {
  slackMessage: {
    id: "e4fd6d66-7a47-4457-b532-14facfe93bb0",
    timestamp: "1729953413.037949",
    user: "U04N0HGF869",
    text: "<https://x.com/KaranVaidya6/status/1861037496295137314>",
    type: "message",
    links: ["https://x.com/KaranVaidya6/status/1861037496295137314"],
  },
};

export const GITHUB_MESSAGE = {
  slackMessage: {
    id: "e4fd6d66-7a47-4457-b532-14facfe93bb0",
    timestamp: "1729953413.037949",
    user: "U04N0HGF869",
    text: "<https://github.com/starpig1129/AI-Data-Analysis-MultiAgent>",
    type: "message",
    links: ["https://github.com/starpig1129/AI-Data-Analysis-MultiAgent"],
  },
};
