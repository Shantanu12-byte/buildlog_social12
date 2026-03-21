export const COURSE_DATA = {
  HTML: {
    Beginner: [
      { q: "Which tag is used for the largest heading?", options: ["<h6>", "<h1>", "<head>", "<header>"], answer: 1 },
      { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Marking Line", "Home Tool Markup Language"], answer: 0 },
      { q: "Which tag is used to create a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], answer: 1 },
      { q: "What is the correct tag for a line break?", options: ["<lb>", "<break>", "<br>", "<line>"], answer: 2 },
      { q: "How do you make an unordered list?", options: ["<ol>", "<list>", "<dl>", "<ul>"], answer: 3 }
    ],
    Pro: [
      { q: "Which attribute is used to open a link in a new tab?", options: ["new-tab", "target='_blank'", "href='_new'", "rel='external'"], answer: 1 },
      { q: "Which tag is used to define a table header?", options: ["<td>", "<tr>", "<th>", "<head>"], answer: 2 },
      { q: "What is the purpose of the <alt> attribute in an image?", options: ["Text if image fails to load", "Image width", "Image source", "Tool-tip text"], answer: 0 },
      { q: "Which HTML5 element is used for navigation links?", options: ["<nav>", "<header>", "<section>", "<footer>"], answer: 0 },
      { q: "What is the correct way to make a checkbox?", options: ["<check>", "<input type='checkbox'>", "<input type='check'>", "<checkbox>"], answer: 1 }
    ],
    Expert: [
      { q: "Which element is used to specify a scalar measurement within a range?", options: ["<range>", "<meter>", "<progress>", "<scale>"], answer: 1 },
      { q: "What is the difference between <strong> and <b>?", options: ["None", "<b> is for SEO", "<strong> has semantic meaning", "<b> is larger"], answer: 2 },
      { q: "Which attribute prevents a new tab from accessing the original window?", options: ["rel='noopener'", "target='_safe'", "href='secure'", "rel='external'"], answer: 0 },
      { q: "Which tag is used to embed an SVG directly into HTML?", options: ["<img>", "<svg>", "<object>", "<embed>"], answer: 1 },
      { q: "What does the <noscript> tag do?", options: ["Stops scripts", "Runs if JS is disabled", "Displays errors", "Hides code"], answer: 1 }
    ]
  },
  CSS: {
    Beginner: [
      { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Colored Style Sheets", "Creative Style Sheets", "Computer Style Sheets"], answer: 0 },
      { q: "Which property is used to change background color?", options: ["color", "bgcolor", "background-color", "fill"], answer: 2 },
      { q: "How do you select an element with an ID of 'header'?", options: [".header", "#header", "*header", "header"], answer: 1 },
      { q: "Which property changes the text size?", options: ["text-style", "font-weight", "text-size", "font-size"], answer: 3 },
      { q: "Which CSS property centers text?", options: ["text-align: center", "align: center", "margin: auto", "font-align: center"], answer: 0 }
    ],
    Pro: [
      { q: "What is the default value of the 'position' property?", options: ["relative", "absolute", "static", "fixed"], answer: 2 },
      { q: "In the Box Model, which part is outside the border?", options: ["Padding", "Content", "Margin", "Outline"], answer: 2 },
      { q: "Which property allows an element to have a flexible layout?", options: ["display: block", "display: flex", "float: left", "position: relative"], answer: 1 },
      { q: "What is the z-index used for?", options: ["Zoom level", "Stacking order", "Width", "Shadow"], answer: 1 },
      { q: "Which unit is relative to the font-size of the root element?", options: ["em", "px", "rem", "vh"], answer: 2 }
    ],
    Expert: [
      { q: "What does 'box-sizing: border-box' do?", options: ["Adds padding inside width", "Adds padding outside width", "Removes borders", "Centers the box"], answer: 0 },
      { q: "Which pseudo-class targets an element when the mouse is over it?", options: [":active", ":focus", ":visited", ":hover"], answer: 3 },
      { q: "How do you create a media query for mobile screens (max 600px)?", options: ["@media (max-width: 600px)", "@mobile (600px)", "@query (600px)", "if screen < 600"], answer: 0 },
      { q: "Which property is used to create a 3x3 grid?", options: ["grid-template-columns", "display: table", "flex-direction", "grid-gap"], answer: 0 },
      { q: "What does 'opacity: 0.5' do?", options: ["Makes it 50% smaller", "Makes it 50% transparent", "Hides it", "Changes color"], answer: 1 }
    ]
  },
  Python: {
    Beginner: [
      { q: "What is the correct file extension for Python?", options: [".pt", ".pyth", ".py", ".pyt"], answer: 2 },
      { q: "How do you start a comment in Python?", options: ["//", "/*", "--", "#"], answer: 3 },
      { q: "Which function prints text to the console?", options: ["output()", "console.log()", "print()", "write()"], answer: 2 },
      { q: "What is the result of 2 ** 3?", options: ["6", "8", "9", "5"], answer: 1 },
      { q: "Which data type stores True or False?", options: ["int", "str", "bool", "float"], answer: 2 }
    ],
    Pro: [
      { q: "Which keyword is used to define a function?", options: ["function", "def", "func", "define"], answer: 1 },
      { q: "How do you add an item to the end of a list?", options: [".add()", ".insert()", ".append()", ".push()"], answer: 2 },
      { q: "What is the index of the first item in a Python list?", options: ["1", "0", "-1", "First"], answer: 1 },
      { q: "Which loop repeats while a condition is true?", options: ["for", "repeat", "foreach", "while"], answer: 3 },
      { q: "What does the 'len()' function do?", options: ["Lowers text", "Adds numbers", "Gets length", "Deletes items"], answer: 2 }
    ],
    Expert: [
      { q: "Which data structure is immutable (cannot be changed)?", options: ["List", "Dictionary", "Set", "Tuple"], answer: 3 },
      { q: "What keyword is used to handle exceptions?", options: ["catch", "except", "error", "handle"], answer: 1 },
      { q: "What does 'self' represent in a Python class?", options: ["The class itself", "The instance of the object", "A global variable", "A private method"], answer: 1 },
      { q: "Which method is the constructor for a class?", options: ["__init__", "start()", "create()", "new()"], answer: 0 },
      { q: "How do you import a module named 'math'?", options: ["using math", "include math", "import math", "require math"], answer: 2 }
    ]
  },
  Java: {
    Beginner: [
      { q: "Which keyword is used to create a class in Java?", options: ["class", "struct", "void", "define"], answer: 0 },
      { q: "How do you print text to the console in Java?", options: ["print()", "System.out.println()", "console.log()", "cout <<"], answer: 1 },
      { q: "Which data type is used to store a single character?", options: ["String", "char", "int", "Boolean"], answer: 1 },
      { q: "What is the entry point of a Java program?", options: ["start()", "main()", "init()", "run()"], answer: 1 },
      { q: "Which of these is NOT a primitive type in Java?", options: ["int", "double", "boolean", "String"], answer: 3 }
    ],
    Pro: [], Expert: []
  },
  DSA: {
    Beginner: [
      { q: "What does LIFO stand for in a Stack?", options: ["Last In First Out", "Left In Fast Over", "List In File Out", "Large Input Fast Output"], answer: 0 },
      { q: "Which algorithm is used to find an element in a sorted array?", options: ["Linear Search", "Binary Search", "Bubble Sort", "Quick Sort"], answer: 1 },
      { q: "What is the time complexity of accessing an array element by index?", options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], answer: 2 },
      { q: "Which data structure uses a Head and Tail?", options: ["Array", "Linked List", "Stack", "Integer"], answer: 1 },
      { q: "What is a Queue known for?", options: ["LIFO", "FIFO", "FILO", "Random Access"], answer: 1 }
    ],
    Pro: [], Expert: []
  },
  React: {
    Beginner: [
      { q: "Which hook is used to manage state in a functional component?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: 1 },
      { q: "What is the syntax used to write HTML-like code in React?", options: ["JSX", "JSH", "XML", "RHTML"], answer: 0 },
      { q: "How do you pass data from a parent to a child component?", options: ["State", "Props", "Context", "Redux"], answer: 1 },
      { q: "Which hook handles side effects like API calls?", options: ["useState", "useMemo", "useRef", "useEffect"], answer: 3 },
      { q: "What must every React component return?", options: ["A variable", "A function", "JSX/Null", "A string"], answer: 2 }
    ],
    Pro: [], Expert: []
  },
  Web3: {
    Beginner: [
      { q: "What is a decentralized ledger called?", options: ["Database", "Blockchain", "Spreadsheet", "Cloud"], answer: 1 },
      { q: "Which cryptocurrency is known for Smart Contracts?", options: ["Bitcoin", "Litecoin", "Ethereum", "Doge"], answer: 2 },
      { q: "What is a 'Gas Fee'?", options: ["A tax", "Incentive for miners/validators", "Subscription", "Fuel for cars"], answer: 1 },
      { q: "What does 'DeFi' stand for?", options: ["Deferred Finance", "Decentralized Finance", "Deficit Finder", "Detailed File"], answer: 1 },
      { q: "What is a crypto wallet used for?", options: ["Storing coins", "Managing private keys", "Mining", "Trading only"], answer: 1 }
    ],
    Pro: [], Expert: []
  }
};
