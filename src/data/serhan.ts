import type { Profile } from "@/lib/types";

export const serhan: Profile = {
  card: {
    handle: "serhan",
    name: "Serhan Yilmaz",
    voice: "casual",
    headline:
      "yılmaz means perseverant in turkish. i tend to live up to it.",
    building:
      "magnos — the ai operating system for financial intelligence. agentic palantir × mckinsey for finance.",
    ask:
      "people replacing entrenched saas with ai-native systems. anyone thinking hard about agent loops, compound ai, and evals at scale. ICLR/NeurIPS folks coming through SF.",
    offer:
      "if you're shipping multi-agent systems in production — i've shipped four, broken most. happy to compare notes on what worked and what was a trap. also: anything turn-taking / voice-ai / streaming inference (built streamingVAP on Furhat humanoid robots at KTH).",
    eventTags: ["SS26 SF"],
    origin: { city: "Stockholm", country: "Sweden" },
    links: [
      { label: "serhanyilmaz.org", href: "https://serhanyilmaz.org/" },
      { label: "github / serhanylmz", href: "https://github.com/serhanylmz" },
      { label: "huggingface / serhany", href: "https://huggingface.co/serhany" },
      { label: "magnos", href: "https://magnos.ai/" },
    ],
    artifacts: [
      {
        detail:
          "co-authored INCLUDE — ICLR 2025 Spotlight (multilingual eval, 44 langs, 197K QA)",
        url: "https://arxiv.org/abs/2411.19799",
      },
      {
        detail:
          "founded kAi Sabancı (600+ members, NVIDIA Student Network founding cohort, first outside the US)",
      },
      {
        detail:
          "EPFL Project Charisius — 2200% perf gain on gradient aggregators, 96% runtime reduction",
      },
      {
        detail:
          "KTH StreamingVAP — 93% turn-taking accuracy on Furhat humanoid robots",
        url: "https://github.com/serhanylmz/StreamingVAP",
      },
      {
        detail:
          "CMU CASCADES — >60% over-baseline question generation",
      },
    ],
  },

  voiceSamples: [
    "i've opened up some 30-minute slots for virtual hangouts. research ideas, cool projects, engineering problems, or just venting about that bug you can't fix — i'm down for whatever!",
    "students, researchers, engineers, investors... everyone's welcome!",
    "my last name, Yilmaz, means perseverant in Turkish. i tend to live up to it.",
    "my mother's mint lemon tea recipe — super simple but hits the spot.",
  ],

  corpus: [
    {
      id: "include",
      topic: "INCLUDE paper",
      content:
        "Co-authored INCLUDE: Evaluating Multilingual Language Understanding with Regional Knowledge — ICLR 2025 Spotlight (arxiv 2411.19799). 197,243 QA pairs across 44 written languages. My specific contribution was the Swedish-language exam pipeline using GPT-4o vision to extract MCQs from PDF. Code in github.com/serhanylmz/mcq; dataset 'swedish-medical-exams-mcq-1002' on HuggingFace.",
      tags: ["research", "papers", "iclr", "multilingual", "benchmarks", "evals", "vision", "ocr", "cohere", "aya", "spotlight"],
    },
    {
      id: "kai",
      topic: "kAi Sabancı founding (NVIDIA hack)",
      content:
        "Founded Sabancı University's AI club (kAi Sabancı) in 2023. Grew to 600+ members. The university administration opposed it. The club committee stalled the application. NVIDIA's Student Network required existing hardware before approval. I contacted NVIDIA's DevRel team directly, separately convinced NVIDIA's Turkish distributor to donate Jetson Nanos, then used the in-progress NVIDIA approval to bypass the stalled committee and book a direct meeting with the university president. kAi became one of four founding members of NVIDIA Student Network globally — the first outside the US. Met Jensen Huang in Stockholm during this period.",
      tags: ["leadership", "community", "founding", "nvidia", "education", "ai-club", "turkey", "perseverance", "hack", "scrappy"],
    },
    {
      id: "epfl",
      topic: "EPFL Project Charisius",
      content:
        "Summer@EPFL fellowship (~1% acceptance) in 2023. Built privacy-preserving federated machine learning infrastructure. Optimized gradient aggregators in PyTorch + CUDA: 2200% performance improvement, runtime reduced by up to 96%. Project name: Charisius.",
      tags: ["research", "performance-optimization", "cuda", "pytorch", "federated-learning", "privacy", "infrastructure", "epfl", "swiss"],
    },
    {
      id: "kth-furhat",
      topic: "KTH StreamingVAP — voice-ai on humanoid robots",
      content:
        "Research intern at KTH Royal Institute of Technology (Stockholm, summer 2024) under Prof. Gabriel Skantze. Built a streaming variant of Voice Activity Prediction using the attention-sinks idea from MIT researchers. Deployed on Furhat Robotics' humanoid robots. 93% improvement in conversational turn-taking accuracy. Stack: PyTorch + Lightning + Hydra. Repo: github.com/serhanylmz/StreamingVAP.",
      tags: ["voice-ai", "speech", "real-time", "robotics", "humanoid", "attention-sinks", "inference-optimization", "turn-taking", "conversational-ai", "kth", "furhat", "streaming"],
    },
    {
      id: "cmu-cascades",
      topic: "CMU CASCADES — compound AI for question generation",
      content:
        "Research intern at Carnegie Mellon (remote, since Dec 2023). CASCADES: Compound AI Systems for Controlled And Diverse Question Generation. >60% improvement over baseline question-generation methods. This is the work that pulled me into compound AI systems and multi-agent frameworks as a research focus.",
      tags: ["research", "compound-ai", "multi-agent", "question-generation", "llm-systems", "evaluation", "cmu", "carnegie-mellon"],
    },
    {
      id: "tu-darmstadt",
      topic: "TU Darmstadt — agentic mental health assessment",
      content:
        "Research intern at TU Darmstadt (summer 2024) under Prof. Iryna Gurevych. Built a self-sustaining agentic chatbot for psychological assessment of Ukrainian refugees, culturally sensitive. Deployed at Charité Berlin for clinical use.",
      tags: ["agents", "healthcare", "mental-health", "ukrainian", "refugees", "culturally-sensitive", "deployment", "clinical", "tu-darmstadt", "charite"],
    },
    {
      id: "yapi-kredi",
      topic: "Yapı Kredi — NLP R&D",
      content:
        "NLP R&D Engineering Intern at Yapı Kredi (Istanbul, Oct 2023 – Apr 2024). OCR-free document understanding using Donut Transformers. Reduced annotation effort by ~40% through transfer-learning-based language model fine-tuning.",
      tags: ["nlp", "ocr", "document-understanding", "transformers", "donut", "fine-tuning", "transfer-learning", "fintech", "banking", "industry"],
    },
    {
      id: "pas2",
      topic: "PAS2 hallucination detector",
      content:
        "PAS2 (Paraphrase-based Approach for Scrutinizing Systems): an LLM hallucination detection system. Pipeline: paraphrase the question with GPT-4, send original + paraphrase to randomly chosen generators (Mistral Large, GPT-4o, Qwen-235B, Grok-3, o4-mini, Gemini-2.5-pro, DeepSeek-Reasoner), judge model finds factual inconsistencies. ELO leaderboard included. Live demo at serhany-pas2-llm-hallucination-detector.hf.space.",
      tags: ["evals", "hallucination", "llm-as-judge", "paraphrase", "scrutiny", "huggingface", "gradio", "leaderboard", "elo"],
    },
    {
      id: "topoformer",
      topic: "topoformer-ssm — brain-inspired architecture",
      content:
        "Implemented a Topoformer architecture combined with Mamba state-space models. Brain-inspired, topologically organized. Georgia Tech / Harvard collaboration. Focused on efficiency-oriented design and fast inference for human-like LM behavior. Repo: github.com/serhanylmz/topoformer-ssm.",
      tags: ["architectures", "mamba", "state-space-models", "ssm", "brain-inspired", "neuro-ai", "efficiency", "inference", "research"],
    },
    {
      id: "huggingface",
      topic: "HuggingFace presence",
      content:
        "Active on HuggingFace as @serhany. Member of Cohere Labs Community + AI Starter Pack. Notable: scaling-qa dataset has 362K downloads. swedish-medical-exams-mcq-1002 (1K downloads, 67 likes). Pinned space: The Ultra-Scale Playbook (training LLMs on large GPU clusters). Stated profile interests: 'Test-Time Scaling, TRL, Agents.'",
      tags: ["huggingface", "datasets", "open-source", "test-time-scaling", "trl", "agents", "scale", "cohere"],
    },
    {
      id: "awards-sweden",
      topic: "Royal Swedish Academy — Innovation in Crisis",
      content:
        "Team 'United in Crisis' won 1st place at the Royal Swedish Academy of Engineering Sciences' Innovation in Crisis competition, May 2020 (COVID-19 era). Done as part of the New York Academy of Sciences' Junior Academy program (~8% acceptance).",
      tags: ["awards", "sweden", "covid-19", "youth", "nyas", "crisis", "junior-academy"],
    },
    {
      id: "awards-sabanci",
      topic: "Sakip Sabancı Awards",
      content:
        "Received the Sakip Sabancı Award for Outstanding Success twice: Sep 2022 (top 4% of class, 100% tuition) and Sep 2024 (50% tuition).",
      tags: ["awards", "academic", "scholarship", "sabanci"],
    },
    {
      id: "yilmaz-hook",
      topic: "Yılmaz / perseverant — name as thesis",
      content:
        "My last name, Yılmaz, means 'perseverant' in Turkish. It's also a thread through how I work. When the university admins blocked the AI club, I worked NVIDIA DevRel + the Turkish distributor in parallel and got hardware donated before going around the committee. I tend to find the path through.",
      tags: ["personal", "name", "etymology", "perseverance", "turkish", "thesis"],
    },
    {
      id: "magnos",
      topic: "Magnos (current company)",
      content:
        "Co-founded Magnos — the AI operating system for financial intelligence. Agentic Palantir × McKinsey for finance. We unify operational and financial data with company context into a real-time operating model and deploy AI agents to automate reporting, planning, and analysis. magnos.ai.",
      tags: ["startup", "founder", "fintech", "ai-os", "compound-ai", "multi-agent", "production", "magnos", "cfo", "finance"],
    },
    {
      id: "geography",
      topic: "Stockholm + Siirt — geography",
      content:
        "Based in Stockholm. Originally from Siirt, Turkey. The Misc page on serhanyilmaz.org lists my mother's mint lemon tea recipe and Büryan Kebabı from Siirt (ask for 'brother mehmet' at Perive). I listen to Argentine rock late at night — Zoé, Los Abuelos de la Nada, Los Rodríguez.",
      tags: ["personal", "stockholm", "turkey", "siirt", "music", "food", "argentine-rock"],
    },
    {
      id: "study",
      topic: "Education",
      content:
        "BSc Computer Science, Sabancı University, Sep 2021 – Jun 2025. cGPA 3.59/4. Stated research interests: agentic AI, reasoning, test-time scaling, compound AI systems.",
      tags: ["education", "computer-science", "sabanci", "research-interests", "undergraduate"],
    },
    {
      id: "carnegie-cohere",
      topic: "Cohere — Expedition Aya",
      content:
        "Research contributor to Cohere for AI's Expedition Aya (Aug–Oct 2024). Built Python pipelines using Cohere's LLM and VLM systems to extract and curate MCQ evaluation data across diverse languages. Mentored international contributors.",
      tags: ["cohere", "aya", "multilingual", "vlm", "data-pipelines", "open-source", "mentorship", "expedition-aya"],
    },
    {
      id: "boston",
      topic: "Boston University — threat modeling",
      content:
        "Research assistant at Boston University (remote, summer 2022) under Prof. Rabia Tugce Yazicigil. Threat Modeling and Component Design. Built a C++ tool to explore 336 design combinations for secure server architectures.",
      tags: ["research", "security", "threat-modeling", "c++", "systems", "boston-university"],
    },
  ],
};
