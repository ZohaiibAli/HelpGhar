from config.gemini import MODEL_NAME
import google.generativeai as genai

model = genai.GenerativeModel(
    MODEL_NAME
)


def generate(prompt):

    response = model.generate_content(
        prompt
    )

    return response.text