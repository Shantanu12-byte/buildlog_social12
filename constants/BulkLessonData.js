// BulkLessonData.js - High-quality localized question content for BuildLog Skills Lab
export const LESSON_DATA = {
  HTML: {
    Beginner: [
      {
        id: "html_beg_001",
        question: "What is the standard root element for an HTML page?",
        options: ["<root>", "<head>", "<html>", "<body>"],
        correctAnswerIndex: 2,
        misconceptionKey: "html_structure",
        incorrectAnswerFeedback: [
          "'<root>' is not a standard HTML tag. Think about the language's full name: HyperText Markup Language.",
          "'<head>' is important for metadata, but it goes INSIDE the actual root element. We need the container for the WHOLE page.",
          "Correct! <html> is the mother of all tags, containing both head and body.",
          "'<body>' contains the visible content, but the browser needs to know it's a '<html>' document first to parse it correctly."
        ]
      },
      {
        id: "html_beg_002",
        question: "Which tag is used for the most important heading on a page?",
        options: ["<heading>", "<h6>", "<head>", "<h1>"],
        correctAnswerIndex: 3,
        misconceptionKey: "html_headings",
        incorrectAnswerFeedback: [
          "'<heading>' sounds logical, but HTML uses numbered shorthand (h1-h6) for headings.",
          "Close! <h6> is actually the SMALLEST and least important heading. HTML numbering is 1 (biggest) to 6 (smallest).",
          "'<head>' is for metadata like titles and scripts. It doesn't display any visible text on the page.",
          "Bullseye! <h1> is the main title of your document and should only be used once per page."
        ]
      },
      {
        id: "html_beg_003",
        question: "Correct the snippet to create a standard paragraph.",
        codeSnippet: "<para>This is my new text.</para>",
        options: ["<p>", "<text>", "<parg>", "<paragraph>"],
        correctAnswerIndex: 0,
        misconceptionKey: "html_p",
        incorrectAnswerFeedback: [
          "Perfect! <p> is the concise standard for paragraph blocks.",
          "'<text>' is used in SVG (Scalable Vector Graphics), not standard HTML for text blocks.",
          "'<parg>' is almost there, but the standard tag is even shorter. Just one letter!",
          "'<paragraph>' is the full word, but HTML relies on concise shorthand like <p>."
        ]
      }
    ],
    Pro: [
      {
        id: "html_pro_001",
        question: "How do you create a link that opens in a NEW tab?",
        codeSnippet: "<a href='https://buildlog.dev' target='...'>Visit</a>",
        options: ["_self", "_parent", "_blank", "_top"],
        correctAnswerIndex: 2,
        misconceptionKey: "html_link_target",
        incorrectAnswerFeedback: [
          "'_self' is the default! It opens the link in the same tab, which is not what we want here.",
          "'_parent' opens the link in the parent frame. For a fresh new tab, we need a different keyword.",
          "Correct! '_blank' tells the browser: 'Open this somewhere else!'",
          "'_top' breaks out of all frames but stays in the same tab. We need to jump to a new one."
        ]
      },
      {
        id: "html_pro_002",
        question: "Which tag defines an *unordered* (bulleted) list?",
        options: ["<ol>", "<ul>", "<list>", "<li>"],
        correctAnswerIndex: 1,
        misconceptionKey: "html_list_type",
        incorrectAnswerFeedback: [
          "'<ol>' is for ORDERED (numbered) lists. We need the list with simple bullets.",
          "Correct! <ul> stands for Unordered List.",
          "'<list>' is logical but not a real HTML tag. Developers gotta learn the shorthand!",
          "'<li>' is for an individual 'List Item'. You need to wrap all your <li> tags inside a <ul> or <ol>."
        ]
      }
    ],
    Expert: [
      {
        id: "html_exp_001",
        question: "Which semantic element is best for a sidebar or secondary info?",
        options: ["<sidebar>", "<aside>", "<section>", "<div>"],
        correctAnswerIndex: 1,
        misconceptionKey: "html_semantics",
        incorrectAnswerFeedback: [
          "'<sidebar>' is a common ID or Class name, but the official HTML5 tag is different.",
          "Exactly! <aside> is for content 'tangentially' related to the main content (like sidebars).",
          "'<section>' is for thematic groupings, but sidebars have a specific semantic tag.",
          "'<div>' works, but it's not SEMANTIC. It doesn't tell search engines or screen readers what the content IS."
        ]
      }
    ]
  },
  Python: {
    Pro: [
      {
        id: "py_pro_001",
        question: "How do you add 'X' to the VERY END of a list 'my_list'?",
        options: ["my_list.add('X')", "my_list.insert(0, 'X')", "my_list.append('X')", "my_list.push('X')"],
        correctAnswerIndex: 2,
        misconceptionKey: "py_list_append",
        incorrectAnswerFeedback: [
          "Python lists don't have an '.add()' method. That's used in Sets or other languages!",
          "Wait! '.insert(0, X)' adds to the START of the list. We need the END.",
          "Correct! .append() is the pythonic way to grow a list from the tail.",
          "'.push()' is common in JavaScript or Stacks, but Python uses .append() for lists."
        ]
      }
    ]
  }
};
