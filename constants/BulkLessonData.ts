export interface LessonQuestion {
  id: string;
  q: string;
  codeSnippet?: string | null;
  options: string[];
  answer: number;
  misconceptionKey: string;
  incorrectAnswerFeedback: string[];
}

export const BULK_LESSON_DATA: Record<string, LessonQuestion[]> = {
  "Python_Pro_Lists": [
    {
      id: "py_list_001",
      q: "Which method should you use to add an element 'X' to the VERY END of a list called 'my_list'?",
      options: ["my_list.add('X')", "my_list.insert(0, 'X')", "my_list.append('X')", "my_list.push('X')"],
      answer: 2,
      misconceptionKey: "list_insertion",
      incorrectAnswerFeedback: [
        "Python lists don't have an '.add()' method. That's more common in Java Sets or C#! Try thinking of 'attaching' to the end.",
        "Wait! '.insert(0, X)' adds to the BEGINNING of the list. The question asked for the VERY END. Efficiency matters!",
        "Correct! .append() is the gold standard for adding to the tail.",
        "'.push()' is used in JavaScript or for Stacks. In Python, we use a more descriptive term for adding to the end."
      ]
    },
    {
      id: "py_list_002",
      q: "How do you remove and return the last element from a list?",
      options: ["del my_list[-1]", "my_list.pop()", "my_list.remove(-1)", "my_list.discard()"],
      answer: 1,
      misconceptionKey: "list_removal",
      incorrectAnswerFeedback: [
        "'del' removes the item, but it doesn't RETURN it. You just deleted it from existence! How do we get the value back?",
        "Spot on! .pop() removes AND returns the last element.",
        "'.remove()' takes the VALUE of the object you want to delete (like 'apple'), not the index. Try the method that handles positions.",
        "'.discard()' is a method for Sets, not Lists. Lists are ordered, so we treat them differently!"
      ]
    },
    {
      id: "py_dict_001",
      q: "What happens if you try to access a non-existent key 'age' using 'my_dict['age']'?",
      options: ["Returns None", "Returns False", "Raises a KeyError", "Creates the key automatically"],
      answer: 2,
      misconceptionKey: "dict_access",
      incorrectAnswerFeedback: [
        "Common mistake! Standard bracket access doesn't return None; it's much louder than that. It crashes the program!",
        "Python isn't that quiet. Using brackets on a missing key is considered a critical error.",
        "Exactly. 'KeyError' is Python's way of saying 'I don't have that record!'. Use .get() if you want None instead.",
        "Dictionaries only create keys when you ASSIGN to them (e.g., dict['x'] = 1). Pure access won't create anything."
      ]
    }
  ],
  "HTML_Beginner": [
    {
      id: "html_beg_001",
      q: "What is the standard root element for an HTML page?",
      options: ["<root>", "<head>", "<html>", "<body>"],
      answer: 2,
      misconceptionKey: "html_structure",
      incorrectAnswerFeedback: [
        "'<root>' is not a standard HTML tag. Think about the language's full name: HyperText Markup Language.",
        "'<head>' is important for metadata, but it goes INSIDE the actual root element.",
        "Correct! <html> is the mother of all tags.",
        "'<body>' contains the visible content, but the browser needs to know it's a '<html>' page first."
      ]
    },
    {
      id: "html_beg_002",
      q: "Which tag is used to define the most important heading (the largest one)?",
      options: ["<heading>", "<h6>", "<head>", "<h1>"],
      answer: 3,
      misconceptionKey: "html_headings",
      incorrectAnswerFeedback: [
        "'<heading>' is logical, but HTML uses a numbered shorthand for headings (1-6).",
        "You picked '<h6>'! In HTML, the numbers are inverse: 1 is the most important/largest, and 6 is the least important/smallest.",
        "'<head>' is for metadata (like page titles and scripts). It doesn't show up in the actual page content.",
        "Bullseye! <h1> is the big boss of headings."
      ]
    },
    {
      id: "html_beg_003",
      q: "Correct the snippet to create a standard paragraph.",
      codeSnippet: "<para>This is my new text.</para>",
      options: ["<p>", "<text>", "<parg>", "<paragraph>"],
      answer: 0,
      misconceptionKey: "html_paragraph",
      incorrectAnswerFeedback: [
        "Perfect! 10/10 for brevity.",
        "'<text>' is used for SVG (Scalable Vector Graphics), not standard HTML text blocks.",
        "'<parg>' is almost there, but the tag is even shorter.",
        "'<paragraph>' is the full word, but HTML relies on concise shorthand."
      ]
    },
    {
      id: "html_beg_004",
      q: "How do you insert a single line break in HTML?",
      options: ["<br>", "<break>", "<lb>", "<newline>"],
      answer: 0,
      misconceptionKey: "html_break",
      incorrectAnswerFeedback: [
        "Correct! Short and sweet.",
        "'<break>' is the full word, but HTML tags prefer shorthand.",
        "'<lb>' is logical (Line Break), but the standard tag is even simpler.",
        "'<newline>' is not a recognized HTML tag for controlling layout."
      ]
    },
    {
      id: "html_beg_005",
      q: "Which characters define an HTML comment?",
      options: ["// comment", "/* comment */", "# comment", "<!-- comment -->"],
      answer: 3,
      misconceptionKey: "html_comments",
      incorrectAnswerFeedback: [
        "Wait! '//' is a single-line comment in JavaScript and C++, but not in HTML.",
        "'/* ... */' is a multi-line comment used in CSS and JavaScript.",
        "'#' is commonly used for comments in Python and shell scripts.",
        "Exactly. <!-- ... --> is how we hide notes in plain sight."
      ]
    }
  ],
  "HTML_Pro": [
    {
      id: "html_pro_001",
      q: "Correct this snippet to create a functional hyperlink to Google.",
      codeSnippet: "<link url='http://google.com'>Visit Google</link>",
      options: ["Change tag to '<a>', attribute to 'href'", "Change tag to '<a>', attribute to 'src'", "Change tag to '<url>', attribute to 'href'", "Change attribute to 'src'"],
      answer: 0,
      misconceptionKey: "html_links",
      incorrectAnswerFeedback: [
        "Spot on. Anchor (<a>) + Hypertext Reference (href).",
        "Almost! Using 'src' is common for loading media (like images), but not for linking to external pages.",
        "Close! '<url>' is not a standard HTML tag. The '<a>' anchor tag is correct, though.",
        "Using 'src' will fail. The browser expects 'href' (Hypertext REFerence) for a link's destination."
      ]
    },
    {
      id: "html_pro_002",
      q: "How do you define an *unordered* list (bulleted points)?",
      options: ["<ol>", "<ul>", "<list>", "<li>"],
      answer: 1,
      misconceptionKey: "html_lists",
      incorrectAnswerFeedback: [
        "'<ol>' is for Ordered lists (numbered 1, 2, 3). The question asked for bulleted (unordered) points.",
        "Correct! <ul> stands for Unordered List.",
        "'<list>' is not a standard HTML tag.",
        "'<li>' defines a single 'List Item' itself, but it must be placed INSIDE a list container (<ul> or <ol>)."
      ]
    },
    {
      id: "html_pro_003",
      q: "Correct the snippet to load a local image file named 'logo.png'.",
      codeSnippet: "<img href='logo.png' alt='BuildLog Logo'>",
      options: ["Change attribute 'href' to 'src'", "Change attribute 'href' to 'url'", "Change attribute 'alt' to 'title'", "Change tag 'img' to 'image'"],
      answer: 0,
      misconceptionKey: "html_images",
      incorrectAnswerFeedback: [
        "Correct! 'src' is for 'source'.",
        "Check the attribute. 'url=' isn't a valid attribute for the <img> tag.",
        "Wait! Keep the 'alt' text. It’s essential for accessibility if the image can't load.",
        "'<image>' is a valid tag, but it's rarely used in modern HTML. The concise '<img>' is the standard for inline images."
      ]
    },
    {
      id: "html_pro_004",
      q: "What is the correct way to specify that a link should open in a new tab?",
      codeSnippet: "<a href='#' target=''>Learn Java</a>",
      options: ["_self", "_parent", "_blank", "_top"],
      answer: 2,
      misconceptionKey: "html_targets",
      incorrectAnswerFeedback: [
        "'_self' is the default behavior! It will open the link in the same window.",
        "'_parent' opens the link in the parent frame, not in a new tab.",
        "Correct! _blank opens a fresh tab.",
        "'_top' forces the link to occupy the full body of the current window, replacing any frames."
      ]
    },
    {
      id: "html_pro_005",
      q: "Correct the HTML form to use the 'GET' method instead of the 'POST' method.",
      codeSnippet: "<form method='POST' action='/submit-form'>",
      options: ["Change method to 'REQUEST'", "Change method to 'GET'", "Change method to 'FETCH'", "Change action to 'get-results'"],
      answer: 1,
      misconceptionKey: "html_forms",
      incorrectAnswerFeedback: [
        "'REQUEST' is not a standard HTML form method.",
        "Correct! GET pulls data efficiently.",
        "'FETCH' is part of the JavaScript Fetch API, not a method attribute for an HTML form.",
        "Changing the action only changes *where* the data is sent. You must explicitly change the *method* attribute itself."
      ]
    }
  ],
  "HTML_Expert": [
    {
      id: "html_exp_001",
      q: "Which semantic element is most appropriate for a section of a page that contains navigation links?",
      options: ["<div class='nav'>", "<navigation>", "<nav>", "<links>"],
      answer: 2,
      misconceptionKey: "html_semantics",
      incorrectAnswerFeedback: [
        "You picked a 'div'! While functional, it’s not *semantic*. A generic `<div>` doesn't tell screen readers what this is.",
        "'<navigation>' is the full word, but HTML prefers concise shorthand. Semantic tags are always short.",
        "Correct! Semantic navigation achieved.",
        "'<links>' is not a recognized HTML5 semantic tag."
      ]
    },
    {
      id: "html_exp_002",
      q: "What is the correct element used to define a cell that acts as a header for a column or row in a table?",
      options: ["<th>", "<td>", "<tr>", "<thead_cell>"],
      answer: 0,
      misconceptionKey: "html_tables",
      incorrectAnswerFeedback: [
        "Correct! Table Header (th).",
        "'<td>' is for standard 'Table Data' cells. Header cells need <th>.",
        "'<tr>' defines an entire 'Table Row'. You need a tag that goes *inside* the `<tr>`.",
        "'<thead_cell>' is logical, but HTML tags use concise shorthand (th)."
      ]
    },
    {
      id: "html_exp_003",
      q: "On an HTML form, which attribute specifies the destination URL where the form data will be sent?",
      codeSnippet: "<form='/login' method='POST'>",
      options: ["name", "method", "target", "action"],
      answer: 3,
      misconceptionKey: "html_form_attribs",
      incorrectAnswerFeedback: [
        "'name' just provides a unique identifier. It doesn't tell the browser where to send data.",
        "'method' defines *how* data is sent (GET vs. POST).",
        "'target' specifies *where* the results appear after submission.",
        "Correct! 'action' is where the magic happens."
      ]
    },
    {
      id: "html_exp_004",
      q: "Which semantic element is used to represent a scalar measurement within a known range?",
      options: ["<progress>", "<meter>", "<scale>", "<range>"],
      answer: 1,
      misconceptionKey: "html_meter",
      incorrectAnswerFeedback: [
        "'<progress>' is for completion. `<meter>` is for static measurements.",
        "Correct! <meter> is for gauges and ranges.",
        "'<scale>' is not a standard HTML5 semantic tag.",
        "'<range>' is not a standard HTML5 semantic tag."
      ]
    },
    {
      id: "html_exp_005",
      q: "Essential attribute to provide alternative text for visually impaired users?",
      codeSnippet: "<img src='logo.png'='BuildLog Logo'>",
      options: ["title", "desc", "alt", "longdesc"],
      answer: 2,
      misconceptionKey: "html_accessibility",
      incorrectAnswerFeedback: [
        "'title' provides a 'tooltip', not reliable accessibility text.",
        "'desc' is logical but not a recognized attribute for the <img> tag.",
        "Correct! 'alt' is mandatory for an inclusive web.",
        "'longdesc' is deprecated. 'alt' is the required attribute for in-page descriptions."
      ]
    }
  ]
};

