# Implementation Guide: FairLens (Social Media Bias Auditor)

## Project Title
**FairLens - Multimodal Bias Auditor for Social Media Content Moderation**

## Problem & Solution
*   **Problem:** Social media platforms often contain biased content (text + images) that perpetuates gender or racial stereotypes, especially in regional contexts (India).
*   **Solution:** An explainable AI system that scans text-image pairs to detect biases using a vision-language model (CLIP). It highlights biased elements and suggests neutral rephrasings.

## Architecture
```mermaid
graph TD
    A[User/Moderator] -->|Upload Post (Image + Caption)| B[Frontend (Streamlit)]
    B -->|Send Data| C[Backend API (Flask)]
    C -->|Image + Text + Prompt| D[Google Gemini API (1.5 Flash)]
    D -->|Multimodal Analysis| E[Bias Detection & Explanation]
    E -->|Structured JSON (Bias Score, Explanation, Suggestion)| C
    C -->|JSON Response| B
    B -->|Visual Audit| A
```

## Tech Stack
*   **Frontend:** Streamlit (for interactive demos).
*   **Backend:** Python (Flask/FastAPI).
*   **ML/AI:** **Google Gemini 1.5 Flash** (Multimodal LLM).
*   **Data Handling:** Pandas, NumPy.

## Modules
1.  **Multimodal Input Module:** Accepts image and text pairs.
2.  **Gemini Client Module:** Sends the image and text to Gemini with a prompt asking to identify potential bias.
3.  **Explainability Module:** Gemini naturally provides "Chain of Thought" reasoning explaining *why* it flagged content (e.g., "The caption implies X about the person in the image").
4.  **Mitigation/Suggestion Module:** Gemini suggests a neutral rephrasing.

## ML Model & Training
*   **Model:** **Google Gemini 1.5 Flash** (via API).
*   **Why Gemini?**
    *   **Multimodal Reasoning:** It can analyze the *relationship* between text and image (e.g., a neutral image with a sarcastic caption). CLIP often struggles with this nuance.
    *   **Zero-Shot:** No need to train a custom classifier or collect a "bias dataset". You just need a strong prompt.
    *   **Explainability:** It generates human-readable explanations out of the box.
*   **Dataset:** Not needed for training. You can use a few examples for "Few-Shot Prompting" to guide the model's tone.

## Implementation Steps
1.  **Setup:** Install `google-generativeai`, `streamlit`.
2.  **Data Prep:** Collect a few "test cases" (biased memes) to verify your prompt.
3.  **Prompt Engineering:**
    *   Prompt: *"Analyze this image and caption for social bias (gender, caste, religion). If biased, explain why and suggest a neutral alternative. Return JSON."*
4.  **Integration:**
    *   Pass the image and text to `model.generate_content([prompt, image])`.
5.  **UI:** Build a Streamlit app where users upload a meme/post and see the "Bias Analysis" and "Suggested Fix".
