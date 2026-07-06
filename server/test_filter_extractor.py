from ai.filter_extractor import extract_filters


tests = [

    "Find electrician",

    "Find female cleaner",

    "Find plumber in Lahore",

    "Electrician under Rs2500",

    "Tutor above Rs5000",

    "Verified carpenter",

    "Available mechanic",

    "Electrician with 5 years experience",

    "Plumber rating above 4.5",

    "Female tutor in Karachi under 3000"

]


for t in tests:

    print("=" * 60)

    print(t)

    print()

    print(

        extract_filters(t)

    )

    print()