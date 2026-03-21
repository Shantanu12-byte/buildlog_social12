// LESSON_DATA.js - High-quality question content for BuildLog Skills Lab
export const LESSON_DATA = {
  HTML: {
    Beginner: [
      {
        id: "html_beg_001",
        question: "What is the standard root element for an HTML page?",
        options: ["<root>", "<head>", "<html>", "<body>"],
        correctAnswerIndex: 2,
        misconceptionKey: "html_root",
        incorrectAnswerFeedback: [
          "'<root>' is not a standard HTML tag. Think about the language's full name: HyperText Markup Language.",
          "'<head>' is important for metadata, but it goes INSIDE the actual root element.",
          "Correct! <html> is the mother of all tags.",
          "'<body>' contains the visible content, but the browser needs to know it's a '<html>' page first."
        ]
      },
      // ... Adding others from previous steps to maintain data quality
    ],
    Pro: [
      {
        id: "html_pro_001",
        question: "Correct this snippet to create a functional hyperlink to Google.",
        codeSnippet: "<link url='http://google.com'>Visit Google</link>",
        options: ["Change tag to '<a>', attribute to 'href'", "Change tag to '<a>', attribute to 'src'", "Change tag to '<url>', attribute to 'href'", "Change attribute to 'src'"],
        correctAnswerIndex: 0,
        misconceptionKey: "html_links",
        incorrectAnswerFeedback: [
          "Spot on. Anchor (<a>) + Hypertext Reference (href).",
          "Almost! Using 'src' is common for loading media (like images), but not for linking to external pages.",
          "Close! '<url>' is not a standard HTML tag. The '<a>' anchor tag is correct, though.",
          "Using 'src' will fail. The browser expects 'href' (Hypertext REFerence) for a link's destination."
        ]
      }
    ]
  },
  Python: {
    Pro: [
      {
        id: "py_list_001",
        question: "Which method should you use to add an element 'X' to the VERY END of a list called 'my_list'?",
        options: ["my_list.add('X')", "my_list.insert(0, 'X')", "my_list.append('X')", "my_list.push('X')"],
        correctAnswerIndex: 2,
        misconceptionKey: "py_lists",
        incorrectAnswerFeedback: [
          "Python lists don't have an '.add()' method. That's more common in Java Sets or C#! Try thinking of 'attaching' to the end.",
          "Wait! '.insert(0, X)' adds to the BEGINNING of the list. The question asked for the VERY END.",
          "Correct! .append() is the gold standard for adding to the tail.",
          "'.push()' is used in JavaScript or for Stacks. In Python, we use a more descriptive term for adding to the end."
        ]
      }
    ]
  }
};
