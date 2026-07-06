from ai.intent import classify
from ai.intent import Intent


def run_test(question):

    result = classify(question)

    print(f"{question}")

    print(result.value)

    print("-" * 40)


def main():

    tests = [

        "Hi",

        "Hello",

        "Find an electrician",

        "Find a plumber near me",

        "Show me tutors",

        "Book a cleaner",

        "Cancel my booking",

        "How do refunds work?",

        "How do I verify my account?",

        "Payment failed",

        "Show my profile",

        "Reset password",

        "Give worker reviews",

        "Who is the best electrician?",

        "",

        "What services does HelpGhar provide?"

    ]

    for t in tests:

        run_test(t)


if __name__ == "__main__":

    main()