<!-- Generated from templates/README.tmpl.md by scripts/render-readme.mjs. Do not edit directly. -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/boot-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/boot-light.svg">
    <img alt="Ömer Faruk Dolanbay — agent runtime" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/boot-light.svg" width="880">
  </picture>
</p>

<p align="center">
  <a href="#agent-orchestrator"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-orchestrator-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-orchestrator-light.svg"><img alt="orchestrator — who is behind this runtime" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-orchestrator-light.svg" width="168"></picture></a>
  <a href="#agent-researcher"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-researcher-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-researcher-light.svg"><img alt="researcher — retrieval, Turkish NLP, evaluation" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-researcher-light.svg" width="168"></picture></a>
  <a href="#agent-builder"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-builder-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-builder-light.svg"><img alt="builder — the things that actually run" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-builder-light.svg" width="168"></picture></a>
  <a href="#agent-analyst"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-analyst-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-analyst-light.svg"><img alt="analyst — commit workload + language mix" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-analyst-light.svg" width="168"></picture></a>
  <a href="#agent-archivist"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-archivist-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-archivist-light.svg"><img alt="archivist — everything else, collapsed" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/agent-archivist-light.svg" width="168"></picture></a>
</p>

---

## agent orchestrator

> who is behind this runtime

<details>
<summary><code>▸ expand</code></summary>

<br>

I work on **multi-agent systems**: the plumbing that lets a planner, a retriever, a coder and a critic pass work between each other without turning into an expensive game of telephone.

Most of what I build runs **locally**. Small language models on a laptop, no API key, no data leaving the machine. That constraint is the interesting part -- it forces the orchestration to be good, because the individual model can't bail you out.

Recently that has meant Turkish-language agentic RAG on Microsoft Foundry Local, and a decision-support system where the agents handle university administrative workflows end to end.

</details>

## agent researcher

> retrieval, Turkish NLP, evaluation

<details>
<summary><code>▸ expand</code></summary>

<br>

The retrieval half of agentic systems is where most of the failures actually live. A confident agent on top of bad context is worse than no agent.

So a lot of my work sits below the agent layer: chunking strategies that survive Turkish morphology, NER-based anonymisation before anything reaches a model, and evaluation harnesses that tell me whether a change helped or just moved the error around.

</details>

## agent builder

> the things that actually run

<table>
<tr>
<td width="50%" valign="top">

#### [Foundry Local Agentic RAG](https://github.com/Esforper/foundry-local-agentic-rag)

Fully offline Turkish assistant that escalates: plain RAG → agentic RAG → multi-agent. Runs on small language models via Microsoft Foundry Local, so nothing leaves the machine.

`multi-agent` `RAG` `SLM` `offline` `Turkish` · <sub>Python</sub>

</td>
<td width="50%" valign="top">

#### [Multi-Agent Decision Support System](https://github.com/Esforper/multi-agent-llm-based-intelligent-decision-support-system-for-university-administrative-processes)

LLM agents that handle university administrative processes as a pipeline -- intake, routing, drafting, review -- instead of a single prompt trying to do all four badly.

`multi-agent` `LLM` `decision support` · <sub>Python</sub>

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### [Claude Usage Bar](https://github.com/Esforper/claude-usage-bar)

Live Claude usage quota pinned to the Windows 11 taskbar. Small, but I look at it more than anything else I have written.

`Windows` `tooling` `desktop` · <sub>Python</sub>

</td>
<td width="50%" valign="top">

#### [Turkish NER Text Anonymizer](https://github.com/Esforper/Turkish-NER-Text-Anonymizer)

Named-entity recognition tuned for Turkish, used as a scrubbing stage so personal data never reaches a model in the first place.

`NLP` `NER` `privacy` `Turkish` · <sub>Jupyter Notebook</sub>

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### [Rating-Based DAG System](https://github.com/Esforper/Rating-Based-DAG-System-Airflow-PostgreSQL-)

Airflow DAGs over PostgreSQL where scheduling priority follows a rating signal rather than a fixed cron.

`Airflow` `PostgreSQL` `data` · <sub>Python</sub>

</td>
<td width="50%" valign="top">

#### [AA-Next](https://github.com/Esforper/AA-Next)

Flutter client. TODO: one sentence on what this is -- it is the only featured repo with no description on GitHub.

`Flutter` `mobile` · <sub>Dart</sub>

</td>
</tr>
</table>

## agent analyst

> commit workload + language mix

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/workload-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/workload-light.svg">
    <img alt="Daily contribution workload" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/workload-light.svg" width="880">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/snake-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Esforper/Esforper/runtime/snake-light.svg">
    <img alt="Contribution graph, being eaten" src="https://raw.githubusercontent.com/Esforper/Esforper/runtime/snake-light.svg" width="880">
  </picture>
</p>

**agents & LLM** &nbsp; `Python` `LangGraph-style orchestration` `Foundry Local` `Ollama` `OpenAI / Anthropic APIs`  
**data** &nbsp; `PostgreSQL` `Airflow` `vector stores` `pandas`  
**platform** &nbsp; `C# / .NET` `Java` `FastAPI` `Docker`  
**client** &nbsp; `Flutter / Dart` `JavaScript` `HTML/CSS`  
**other** &nbsp; `Verilog` `Selenium`

## agent archivist

> everything else, collapsed

<details>
<summary><code>▸ 21 more repositories</code></summary>

<br>

| repository | language | description | last push |
| --- | --- | --- | --- |
| [ScheduleProject_Python](https://github.com/Esforper/ScheduleProject_Python) <sub>fork</sub> | — | — | 2025-09 |
| [ScheduleProjectAlgorithmTest-Python-](https://github.com/Esforper/ScheduleProjectAlgorithmTest-Python-) | `HTML` | Pythonda, uygulamada kullanılacak algoritmalar ve yapılar için temel bir yapı oluşturulması ve test ortamı olması amaçlanmıştır. | 2025-09 |
| [Yetenek-Pusulas-Platform](https://github.com/Esforper/Yetenek-Pusulas-Platform) | `C#` | — | 2025-06 |
| [Yetenek_Pusulasi_Web_Platform](https://github.com/Esforper/Yetenek_Pusulasi_Web_Platform) | `C#` | — | 2025-06 |
| [GOODFLUENCE-](https://github.com/Esforper/GOODFLUENCE-) | `HTML` | — | 2025-05 |
| [Verilog-IAS-Architecture](https://github.com/Esforper/Verilog-IAS-Architecture) | `Verilog` | — | 2025-01 |
| [Spotify-DB-project](https://github.com/Esforper/Spotify-DB-project) | `HTML` | — | 2025-01 |
| [TestRepo](https://github.com/Esforper/TestRepo) | — | — | 2024-12 |
| [Auto-Article-Summarizer](https://github.com/Esforper/Auto-Article-Summarizer) | `Python` | — | 2024-09 |
| [WordGuessingGame](https://github.com/Esforper/WordGuessingGame) | `Python` | — | 2024-09 |
| [AcademicianPlatform](https://github.com/Esforper/AcademicianPlatform) <sub>fork</sub> | `C#` | A web platform that connects academicians with each other. | 2024-09 |
| [WordPredictorChat](https://github.com/Esforper/WordPredictorChat) | `Python` | — | 2024-09 |
| [SchedularApp](https://github.com/Esforper/SchedularApp) | `C#` | — | 2024-05 |
| [MyHealthAssistantProject](https://github.com/Esforper/MyHealthAssistantProject) <sub>fork</sub> | — | Bu proje, yapay zeka entegrasyonu ve proje mentörlüğümle geliştirilmiş bir sağlıkla ilgili mobil uygulamadır. Sağlık sorularınıza yanıt bulabileceğiniz, spor takibi yapabileceğiniz ve beslenmeyle ilgili öneriler alabileceğiniz bir platform sunar. | 2024-05 |
| [long-way-for-hello-world](https://github.com/Esforper/long-way-for-hello-world) | `C` | — | 2024-02 |
| [AcademicStaff-information-web-scraping-selenium](https://github.com/Esforper/AcademicStaff-information-web-scraping-selenium) | `Python` | — | 2024-02 |
| [AdamAsmaca](https://github.com/Esforper/AdamAsmaca) | `Java` | — | 2024-02 |
| [OpenAI-API-Example](https://github.com/Esforper/OpenAI-API-Example) | `Jupyter Notebook` | — | 2024-02 |
| [LibraryManagmentSystem](https://github.com/Esforper/LibraryManagmentSystem) <sub>fork</sub> | — | — | 2023-12 |
| [Project-TaskPulse](https://github.com/Esforper/Project-TaskPulse) | `C#` | — | 2023-12 |
| [SosyalGelisimKulubu-web-design](https://github.com/Esforper/SosyalGelisimKulubu-web-design) | `HTML` | — | 2023-06 |

</details>

---

<p align="center">
  <a href="https://github.com/Esforper">GitHub</a>&nbsp; · &nbsp;<a href="mailto:dolanbayomerfaruk@gmail.com">Email</a>
</p>

<p align="center"><sub>runtime rebuilt 2026-08-22 · generated by <code>scripts/render-readme.mjs</code></sub></p>
