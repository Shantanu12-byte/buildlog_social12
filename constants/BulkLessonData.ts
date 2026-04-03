export interface LessonQuestion {
  id: string;
  q?: string;           // Used by SkillsLabController
  question?: string;    // Used by SkillsLabQuizController
  codeSnippet?: string | null;
  options: string[];
  answer?: number;              // Used by SkillsLabController
  correctAnswerIndex?: number;  // Used by SkillsLabQuizController
  misconceptionKey: string;
  incorrectAnswerFeedback: string[];
}

export const LESSON_DATA: Record<string, Record<string, LessonQuestion[]>> = {
  HTML: {
    Beginner: [
      {
        id: "html_beg_001",
        question: "What is the standard root element for an HTML page?",
        q: "What is the standard root element for an HTML page?",
        options: ["<root>", "<head>", "<html>", "<body>"],
        correctAnswerIndex: 2,
        answer: 2,
        misconceptionKey: "html_root",
        incorrectAnswerFeedback: [
          "'<root>' is not a standard HTML tag. Think about the language's full name: HyperText Markup Language.",
          "'<head>' is important for metadata, but it goes INSIDE the actual root element.",
          "Correct! <html> is the mother of all tags.",
          "'<body>' contains the visible content, but the browser needs to know it's a '<html>' page first."
        ]
      },
      {
        id: "html_beg_002",
        question: "Which tag is used to define the most important heading?",
        q: "Which tag is used to define the most important heading?",
        options: ["<heading>", "<h6>", "<head>", "<h1>"],
        correctAnswerIndex: 3,
        answer: 3,
        misconceptionKey: "html_headings",
        incorrectAnswerFeedback: [
          "'<heading>' is logical, but HTML uses a numbered shorthand for headings (1-6).",
          "You picked '<h6>'! In HTML, the numbers are inverse: 1 is the most important/largest.",
          "'<head>' is for metadata (like page titles and scripts).",
          "Bullseye! <h1> is the big boss of headings."
        ]
      },
    ],
    Pro: [
      {
        id: "html_pro_001",
        question: "Correct this snippet to create a functional hyperlink to Google.",
        q: "Correct this snippet to create a functional hyperlink to Google.",
        codeSnippet: "<link url='http://google.com'>Visit Google</link>",
        options: ["Change tag to '<a>', attribute to 'href'", "Change tag to '<a>', attribute to 'src'", "Change tag to '<url>', attribute to 'href'", "Change attribute to 'src'"],
        correctAnswerIndex: 0,
        answer: 0,
        misconceptionKey: "html_links",
        incorrectAnswerFeedback: [
          "Spot on. Anchor (<a>) + Hypertext Reference (href).",
          "Almost! Using 'src' is common for loading media (like images).",
          "Close! '<url>' is not a standard HTML tag.",
          "Using 'src' will fail. The browser expects 'href' for a link's destination."
        ]
      }
    ]
  },
  Python: {
    Pro: [
      {
        id: "py_list_001",
        question: "Which method should you use to add an element 'X' to the VERY END of a list called 'my_list'?",
        q: "Which method should you use to add an element 'X' to the VERY END of a list called 'my_list'?",
        options: ["my_list.add('X')", "my_list.insert(0, 'X')", "my_list.append('X')", "my_list.push('X')"],
        correctAnswerIndex: 2,
        answer: 2,
        misconceptionKey: "py_lists",
        incorrectAnswerFeedback: [
          "Python lists don't have an '.add()' method.",
          "Wait! '.insert(0, X)' adds to the BEGINNING of the list.",
          "Correct! .append() is the gold standard for adding to the tail.",
          "'.push()' is used in JavaScript or for Stacks."
        ]
      }
    ]
  }
};

// Flattened structure for SkillsLabController
export const BULK_LESSON_DATA: Record<string, LessonQuestion[]> = {
  "HTML_Beginner": LESSON_DATA.HTML.Beginner,
  "HTML_Pro": LESSON_DATA.HTML.Pro,
  "Python_Pro": LESSON_DATA.Python.Pro,
  // ... and others
};
