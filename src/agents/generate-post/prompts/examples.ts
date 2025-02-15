export const EXAMPLES = [
  `Agent Laboratory

An approach that leverages LLM agents capable of completing the entire research process.

Main findings:

1) Agents driven by o1-preview resulted in the best research outcomes

2) Generated machine learning code can achieve state-of-the-art performance compared to existing methods

3) Human feedback further improves the quality of research

4) Agent laboratory significantly reduces research expenses`,
  `rStar-Math helps small language models rival or even surpass OpenAI o1 on math reasoning.

How do they achieve this?

rStar-Math uses a math policy SLM for test-time search guided by an SLM-based process reward model.

What's new in rStar-Math?

- a code-augmented CoT data synthesis method involving MCTS to generate step-by-step verified reasoning trajectories which is used to train the policy SLM

- an SLM-based process reward model that reliably predicts a reward label for each math reasoning step. This leads to a more effective process preference model (PPM).

- a self-evolution recipe where the policy SLM and PPM are iteratively evolved to improve math reasoning.

Putting it together:

They first curate a dataset of 747k math word problems from publicly available sources. In each round (for four rounds), they use the latest policy model and PPM to perform MCTS, generating increasingly high-quality training data to train a stronger policy model and PPM for the next round.

Results:

On the MATH benchmark, rStar-Math improves Qwen2.5-Math-7B from 58.8% to 90.0% and Phi3-mini-3.8B from 41.4% to 86.4%, surpassing o1-preview by +4.5% and +0.9%.

My thoughts:

The iterative self-evolution deep thinking process combined with small language models is an interesting development because there is not much evidence that these SLMs can generate high-quality and reliable training data. However, this work shows that SLMs with extensive MCTS rollouts can lead to the self-generation of high-quality training data for frontier-level math reasoning.`,
  `🌲The promise of dynamic few-shot prompting

After sharing AppFolio's story of putting an agent in production, 
@jobergum
 noted a key part of the story: how dynamic few shot prompting greatly improved their performance

This is how it works:

You collect a set of example inputs and example outputs. This set grows to be rather large. Rather than put all of them as few shot examples in the prompt, you dynamically select the 'k' most relevant ones based on the user query/state

Few shot examples in general can help give the LLM examples of what to do. We've found that this works particularly well in classification, extraction, and tone

AppFolio isn't the only one who has found this! Dosu also found this (for a classification task): https://blog.langchain.dev/dosu-langsmith-no-prompt-eng/

See AppFolio's story here: https://blog.langchain.dev/customers-appfolio/

We have built in support for this in LangSmith - datasets aren't just for evals, they should also be used to improve your application! https://docs.smith.langchain.com/evaluation/how_to_guides/index_datasets_for_dynamic_few_shot_example_selection`,
  `Ever struggled to understand how users use your product? 

I just built an open source implementation of Anthropic's internal clustering algorithm - CLIO.

With Gemini Flash, you can generate human readable labels which are clustered and grouped together to spot usage patterns.

Read more to find out how it works`,
  `RAG isn't just embeddings. It's a complex system that needs constant refinement.

Start with synthetic data. Use both full-text and vector search. Implement clear user feedback. Cluster topics. Monitor 
constantly.

The real work begins when you have enough data to truly optimize.

https://jxnl.co/writing/2024/05/22/systematically-improving-your-rag/`,
  `Anthropic's Contextual Retrieval technique is a game-changer for RAG systems, addressing the pesky problem of lost context when chunking documents. This instructor implementation takes it a step further by adding async processing for improved efficiency. 

As someone who's spent way too much time tinkering with RAG, I'm excited to see how this approach could supercharge retrieval performance. If you've ever struggled with RAG systems spitting out nonsensical answers, this article is for you. 

Read on to learn how to level up your RAG game

https://python.useinstructor.com/blog/2024/09/26/implementing-anthropics-contextual-retrieval-with-async-processing/`,
  `Most teams get RAG wrong. They obsess over generation before nailing search.

The secret? Start with synthetic data. Focus on retrieval. Build a continuous improvement loop.

It's not about perfection. It's about creating a learning system that compounds over time.

https://jxnl.co/writing/2024/08/19/rag-flywheel/`,
  `Introducing Llama 3.3 – a new 70B model that delivers the performance of our 405B model but is easier & more cost-efficient to run. By leveraging the latest advancements in post-training techniques including online preference optimization, this model improves core performance at a significantly lower cost, making it even more accessible to the entire open source community 🔥

https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct`,
  `The new Gemini 2.0 Flash Thinking model (Gemini version of GPT o1 that takes a while to think before responding) is very nice and fast and now available to try on Google AI Studio 🧑‍🍳👏.

The prominent and pleasant surprise here is that unlike o1 the reasoning traces of the model are shown. As a user I personally really like this because the reasoning itself is interesting to see and read - the models actively think through different possibilities, ideas, debate themselves, etc., it's part of the value add. The case against showing these is typically a concern of someone collecting the reasoning traces and training to imitate them on top of a different base model, to gain reasoning ability possibly and to some extent.`,
  `RAG Check

Multimodal RAG will be explored extensively in 2025. 

However, there is not much literature on measuring hallucination in multimodal RAG systems which is very common.

This work presents a novel framework to evaluate the reliability of multimodal RAG systems. 

They train two models to measure relevancy and correctness from a ChatGPT-derived database and human evaluator samples. 

Both models achieve 88% accuracy on test data.

I don't think there is a lot of good literature on evaluating multimodal RAG systems so this looks like a paper to bookmark.`,
  `We've been busy this year!  Here's 60 of our biggest AI announcements in 2024!

Very proud of everyone who worked on all of these and I'm excited we're able to bring our research to life in products and features for our users. 🎉

Looking forward to 2025!`,
  `Just when you thought it was over...  we’re introducing Gemini 2.0 Flash Thinking, a new experimental model that unlocks stronger reasoning capabilities and shows its thoughts.

The model plans (with thoughts visible), can solve complex problems with Flash speeds, and more`,
  `Introducing the Gemini for Academic Research program, created to help researchers using Gemini models accelerate their research agenda. 🧪🥼

We are supporting researches exploring evaluations,  benchmarks, embodiment, science, and more! Apply today:`,
  `Really enjoyed "Things we learned about LLMs in 2024" by 
@simonw
, especially this analogy between today's datacenter buildout and the 19th century railway boom. The parallels are striking. https://simonwillison.net/2024/Dec/31/llms-in-2024/#the-environmental-impact-got-much-much-worse`,
  `Experimentation mindset is the key to AI success, not having all the answers.

Define metrics that matter, prioritize experiments, and redefine success as learning. Knowledge sharing is crucial.

Remove barriers to learning, not just run more experiments. Build team capability and improve incrementally.

https://skylarbpayne.com/posts/experimentation-mindset`,
  `One of my favorite applications of LLMs is reading books together. I want to ask questions or hear generated discussion (NotebookLM style) while it is automatically conditioned on the surrounding content. If Amazon or so built a Kindle AI reader that “just works” imo it would be a huge hit.

For now, it is possible to kind of hack it with a bunch of script. Possibly someone already tried to build a very nice AI-native reader app and I missed it.`,
];
