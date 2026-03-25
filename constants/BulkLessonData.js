/**
 * constants/BulkLessonData.js - High-fidelity question bank for BuildLog Skills Lab.
 *
 * This file contains 100+ Python questions + original HTML content.
 * Features:
 *  - Standardized difficulty tiers: Beginner, Pro, Expert.
 *  - Deterministic Pseudo-AI logic for incorrect feedback pills.
 *  - Monospace formatting for code snippets.
 *  - Zero-cost tutor programmed locally.
 */

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
          "'<root>' is not a standard HTML tag. Think about the language's full name.",
          "'<head>' is important for metadata, but it goes INSIDE the actual root element.",
          "Correct! <html> is the mother of all tags, containing both head and body.",
          "'<body>' contains the visible content, but the browser needs a '<html>' container."
        ]
      },
      {
        id: "html_beg_002",
        question: "Which tag is used for the most important heading on a page?",
        options: ["<heading>", "<h6>", "<head>", "<h1>"],
        correctAnswerIndex: 3,
        misconceptionKey: "html_headings",
        incorrectAnswerFeedback: [
          "'<heading>' sounds logical, but HTML uses numbered shorthand (h1-h6).",
          "Close! <h6> is actually the SMALLEST and least important heading.",
          "'<head>' is for metadata like titles and scripts. It doesn't display text.",
          "Bullseye! <h1> is the main title and should only be used once per page."
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
          "'_self' is the default! It opens in the same tab.",
          "'_parent' opens in the parent frame. Use '_blank' for a new tab.",
          "Correct! '_blank' tells the browser: 'Open this somewhere else!'",
          "'_top' breaks out of frames but stays in the same tab."
        ]
      }
    ]
  },

  Python: {
    Beginner: [
      {
        id: "py_beg_001",
        question: "How do you output 'Hello World' in Python?",
        options: ["echo 'Hello World'", "print('Hello World')", "printf('Hello World')", "console.log('Hello World')"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "In PHP or shell, 'echo' works, but Python utilizes the 'print()' function.",
          "Correct! 'print()' is the universal output command in Python.",
          "'printf' is common in C/C++, but Python simplifies this to just 'print()'.",
          "'console.log' is Java/JavaScript syntax. Builders use 'print' in Python."
        ]
      },
      {
        id: "py_beg_002",
        question: "Which symbol starts a single-line comment in Python?",
        options: ["//", "/*", "#", "--"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'//' is used in Java/C++, but Python uses the hash symbol.",
          "'/*' starts multi-line comments in CSS/C, not Python.",
          "Correct! '#' tells Python to ignore everything on that line.",
          "'--' is for SQL comments. Hash is for Python."
        ]
      },
      {
        id: "py_beg_003",
        question: "Which variable name is valid in Python?",
        options: ["2nd_user", "user-name", "_user_count", "user name"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Variable names cannot start with a number (2nd_user).",
          "Hyphens (-) are not allowed in names; use underscores (_) instead.",
          "Correct! Names can start with an underscore or a letter.",
          "Spaces are strictly forbidden in variable names."
        ]
      },
      {
        id: "py_beg_004",
        question: "What is the result of 10 // 3?",
        options: ["3.333...", "3", "1", "3.0"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Standard division (/) gives 3.33, but // is floor division.",
          "Correct! Floor division (//) truncates to the lower integer.",
          "Modulo (%) gives the remainder 1. // gives the quotient.",
          "Floor division with integers returns an integer, not a float."
        ]
      },
      {
        id: "py_beg_005",
        question: "Which data type is used for 'True' or 'False' values?",
        options: ["Integer", "String", "Boolean", "Float"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Integers are whole numbers (1, 2, 3).",
          "Strings are text blocks enclosed in quotes.",
          "Correct! Booleans represent truth values.",
          "Floats are numbers with decimals (3.14)."
        ]
      },
      {
        id: "py_beg_006",
        question: "What is the output of 'Python'[1]?",
        options: ["P", "y", "t", "Error"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Python uses 0-based indexing. 'P' is at index 0.",
          "Correct! 'y' is the character at index 1.",
          "'t' is at index 2. Remember: start counting from zero.",
          "Strings are indexable in Python — no error here."
        ]
      },
      {
        id: "py_beg_007",
        question: "How do you check the length of a string 'x'?",
        options: ["x.length()", "len(x)", "length(x)", "count(x)"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'.length()' is Java style. In Python, we use a built-in function.",
          "Correct! 'len()' is the standard function for size.",
          "It's not 'length()', just 'len()'. Python thrives on brevity.",
          "'.count()' finds occurrences of a substring, not total length."
        ]
      },
      {
        id: "py_beg_008",
        question: "What does the 'range(5)' function generate?",
        options: ["1, 2, 3, 4, 5", "0, 1, 2, 3, 4, 5", "0, 1, 2, 3, 4", "1, 2, 3, 4"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Ranges start at 0 by default and stop BEFORE the number specified.",
          "Range(5) generates 5 numbers, but it stops at 4.",
          "Correct! It generates 0 up to (but not including) 5.",
          "Range starts at 0, not 1, unless otherwise specified."
        ]
      },
      {
        id: "py_beg_009",
        question: "How do you convert the integer 10 to a string?",
        options: ["int('10')", "string(10)", "str(10)", "convert(10)"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "This converts a string TO an integer. We need the reverse.",
          "The function is 'str()', not the full word 'string()'.",
          "Correct! 'str()' is the built-in typecast for strings.",
          "'convert' is not a standard Python function for types."
        ]
      },
      {
        id: "py_beg_010",
        question: "Which keyword is used for 'else if' logic in Python?",
        options: ["else if", "elseif", "elif", "case"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Python uses the combined keyword 'elif'.",
          "One word 'elseif' works in PHP, but not in Python.",
          "Correct! 'elif' is the pythonic way to chain conditions.",
          "'case' is for pattern matching (Python 3.10+), not standard if-else."
        ]
      },
      {
        id: "py_beg_011",
        question: "What happens if you multiply a string by 3? ('Hi' * 3)",
        options: ["Error", "Hi3", "HiHiHi", "3Hi"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Python supports string multiplication — no error!",
          "That would happen if you added '3' as a string.",
          "Correct! String multiplication repeats the text.",
          "Multiplication repeats contents, doesn't prepend the number."
        ]
      },
      {
        id: "py_beg_012",
        question: "Which loop runs as long as a condition is True?",
        options: ["for", "while", "repeat", "foreach"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'for' is usually for iterating over a fixed sequence.",
          "Correct! 'while' checks the condition before every turn.",
          "'repeat' is not a standard keyword in Python.",
          "'foreach' is a C#/PHP concept. Python uses 'for x in y'."
        ]
      },
      {
        id: "py_beg_013",
        question: "How do you start a function definition?",
        options: ["function myFunc():", "def myFunc():", "fun myFunc():", "void myFunc():"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'function' is JS style. Python uses 'def'.",
          "Correct! 'def' stands for define function.",
          "'fun' is Kotlin style. Python needs 'def'.",
          "'void' is Java/C type declaration. Python uses 'def'."
        ]
      },
      {
        id: "py_beg_014",
        question: "What is the correct way to get user input?",
        options: ["read()", "input()", "get()", "scan()"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'read' is for file objects, not user console input.",
          "Correct! 'input()' pauses execution for user text.",
          "'get' is a dictionary method. Use 'input()' for console.",
          "'scan' is common in C (scanf) or Java, not Python."
        ]
      },
      {
        id: "py_beg_015",
        question: "Which of these is a Float?",
        options: ["42", "'4.2'", "4.2", "42.0"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "42 is an integer (whole number).",
          "'4.2' is a string because of the quotes.",
          "Correct! Real numbers with decimals are Floats.",
          "Actually, 42.0 is ALSO a float, but 4.2 is the primary choice here."
        ]
      },
      {
        id: "py_beg_016",
        question: "What is the purpose of indentation in Python?",
        options: ["For readability only", "To define code blocks", "To end a line", "None of the above"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "It's not optional! It's how Python understands structure.",
          "Correct! Indentation replaces curly braces {} from other languages.",
          "Indentation starts blocks, it doesn't end lines.",
          "Indentation is fundamental to Python's logic."
        ]
      },
      {
        id: "py_beg_017",
        question: "How do you import a module in Python?",
        options: ["use math", "include math", "import math", "require math"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'use' is SQL or Perl. Use 'import' in Python.",
          "'include' is for C/C++. Python uses 'import'.",
          "Correct! 'import' makes external code available.",
          "'require' is Node.js style. Python uses 'import'."
        ]
      },
      {
        id: "py_beg_018",
        question: "What is for i in range(2, 5)? (Values of i)",
        options: ["2, 3, 4, 5", "2, 3, 4", "0, 1, 2, 3, 4", "3, 4, 5"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Range stops BEFORE the end number (5).",
          "Correct! Starts at 2 and stops at 4.",
          "Range(2, 5) specifies a start at 2, not 0.",
          "Range(2, 5) starts at 2 inclusive."
        ]
      },
      {
        id: "py_beg_019",
        question: "Which operator is used for 'to the power of'?",
        options: ["^", "**", "//", "%"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'^' is the bitwise XOR operator in Python, not power.",
          "Correct! 2 ** 3 is 8.",
          "'//' is floor division, not exponentiation.",
          "'%' is the modulo operator (remainder)."
        ]
      },
      {
        id: "py_beg_020",
        question: "How do you create a list in Python?",
        options: ["(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "<1, 2, 3>"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Parentheses () create a Tuple (immutable).",
          "Curly braces {} create a Set or Dictionary.",
          "Correct! Square brackets [] produce a mutable List.",
          "Angle brackets are not used for collections in Python."
        ]
      },
      {
        id: "py_beg_021",
        question: "How do you stop a loop prematurely?",
        options: ["stop", "exit", "break", "return"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'stop' is not a keyword for loops.",
          "'exit()' kills the whole program, not just the loop.",
          "Correct! 'break' jumps out of the innermost loop.",
          "'return' exists from a function, not just a loop."
        ]
      },
      {
        id: "py_beg_022",
        question: "Which is the 'logical AND' operator in Python?",
        options: ["&&", "AND", "and", "&"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'&&' is not Python syntax. Use the word 'and'.",
          "Python keywords are case-sensitive. Use lowercase 'and'.",
          "Correct! Operators like 'and', 'or', 'not' are plain words.",
          "'&' is for bitwise AND, not logical AND."
        ]
      },
      {
        id: "py_beg_023",
        question: "What is 10 % 3?",
        options: ["3", "1", "0", "0.33"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "3 is the quotient. 10 % 3 is the remainder.",
          "Correct! 3 goes into 10 three times with 1 left over.",
          "0 would mean it's perfectly divisible. 10 is not.",
          "Modulo always returns the integer remainder here."
        ]
      },
      {
        id: "py_beg_024",
        question: "How do you insert an element at a SPECIFIC index in a list?",
        options: ["my_list.add(0, 'X')", "my_list.append(0, 'X')", "my_list.insert(0, 'X')", "my_list[0] = 'X'"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'.add' is for Sets. Lists have no '.add' method.",
          "'.append' only takes one argument and adds to the END.",
          "Correct! '.insert(index, value)' puts it exactly where you want.",
          "This REPLACES the element. '.insert' moves the rest over."
        ]
      },
      {
        id: "py_beg_025",
        question: "Which function converts a string to a Float?",
        options: ["int()", "float()", "str()", "decimal()"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'.int' creates whole numbers. We need decimals.",
          "Correct! 'float()' handles fractional conversion.",
          "'str' converts to text, the opposite of what we need.",
          "'decimal' requires the 'decimal' module, it's not a built-in function."
        ]
      },
      {
        id: "py_beg_026",
        question: "What does 'pass' do in a loop?",
        options: ["Stops the loop", "Restarts the loop", "Does nothing (placeholder)", "Skips to next iteration"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Use 'break' to stop a loop.",
          "Loops restart automatically. 'pass' is a no-op.",
          "Correct! It's a syntactic placeholder for empty code blocks.",
          "Use 'continue' to skip to the next iteration."
        ]
      },
      {
        id: "py_beg_027",
        question: "Which collection is NOT mutable (cannot be changed)?",
        options: ["List", "Dictionary", "Tuple", "Set"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Lists are mutable. You can add/remove items.",
          "Dictionaries can be updated anytime.",
          "Correct! Once created, a Tuple cannot be modified.",
          "Sets are mutable; you can add elements to them."
        ]
      },
      {
        id: "py_beg_028",
        question: "How do you check if 'key' is in dictionary 'd'?",
        options: ["d.has('key')", "d.contains('key')", "'key' in d", "is 'key' d"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'.has()' is not a valid dict method. Use the 'in' keyword.",
          "'.contains()' is not for Python dicts. Use 'in'.",
          "Correct! The 'in' keyword is pythonic and fast.",
          "'is' checks identity (memory address), not membership."
        ]
      },
      {
        id: "py_beg_029",
        question: "What is an f-string?",
        options: ["A fast string", "A formatted string literal", "A file string", "A formal string"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "They are fast, but that's not the official name!",
          "Correct! Prefixed with 'f', they allow embedded expressions.",
          "File strings aren't a concept. f-strings are for formatting.",
          "They are much more casual and powerful than 'formal' strings."
        ]
      },
      {
        id: "py_beg_030",
        question: "How do you remove an item from a list by its VALUE?",
        options: ["my_list.pop(x)", "my_list.delete(x)", "my_list.remove(x)", "my_list.discard(x)"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'.pop()' removes by INDEX, not by value.",
          "'delete' is a keyword (del), but not a method.",
          "Correct! '.remove()' finds first match and deletes it.",
          "'.discard' is for Sets, not Lists."
        ]
      },
      {
        id: "py_beg_031",
        question: "What is the result of not True?",
        options: ["True", "False", "None", "Error"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'not' flips the boolean. Opposite of True is False.",
          "Correct! It's a simple logical inversion.",
          "'None' is a separate type. We get a boolean result.",
          "Valid syntax. No error here."
        ]
      },
      {
        id: "py_beg_032",
        question: "How many spaces is the standard indentation in Python?",
        options: ["1", "2", "4", "8"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "1 space is risky and not standard.",
          "2 spaces is common in JS, but Python PEP8 says 4.",
          "Correct! PEP8 recommends 4 spaces per level.",
          "8 spaces is massive and creates horizontal scroll issues."
        ]
      },
      {
        id: "py_beg_033",
        question: "What does 'a += 5' mean?",
        options: ["a = a + 5", "a = 5", "a is 5", "a plus 5"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! It's shorthand for incrementing 'a'.",
          "That would just be 'a = 5'.",
          "'is' checks identity, not value assignment.",
          "It's an assignment, not just a calculation."
        ]
      },
      {
        id: "py_beg_034",
        question: "Which keyword returns a value from a function?",
        options: ["send", "output", "return", "give"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'send' is for generators. Functions use 'return'.",
          "'print' outputs to console, but doesn't hand data back to callers.",
          "Correct! 'return' stops the function and yields the result.",
          "'give' is not a Python keyword."
        ]
      },
      {
        id: "py_beg_035",
        question: "How do you access the last item in a list efficiently?",
        options: ["my_list[len(my_list)]", "my_list[-1]", "my_list[last]", "my_list.end"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "This gives an 'IndexError' because indexes stop at length-1.",
          "Correct! Negative indexing starts from the end of the list.",
          "'last' isn't a built-in variable name for indexes.",
          "'.end' is not a List property. Use [-1]."
        ]
      }
    ],

    Pro: [
      {
        id: "py_pro_001",
        question: "A builder wants to create a list of squares for numbers 0-4. Which list comprehension is correct?",
        options: ["[x*x for x in range(5)]", "[x^2 for x in range(5)]", "(x*x for x in range(5))", "[x*x while x < 5]"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! This is the most efficient one-liner for the task.",
          "'^' is XOR in Python. Use x*x or x**2 for squaring.",
          "Parentheses create a generator expression, not a list.",
          "List comprehensions use 'for' syntax, not 'while'."
        ]
      },
      {
        id: "py_pro_002",
        question: "What is the output of values = [1, 2, 3]; a, b, c = values?",
        options: ["Error", "a=[1,2,3]", "a=1, b=2, c=3", "[1, 2, 3]"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "This is valid 'Tuple Unpacking' — no error!",
          "Each variable gets one value from the list.",
          "Correct! Variables are mapped to items in the sequence.",
          "The list is unpacked into individual atoms."
        ]
      },
      {
        id: "py_pro_003",
        question: "How do you catch a specific error in a try-except block?",
        options: ["except Error:", "catch ValueError:", "except ValueError:", "handle Exception:"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'Error' is too generic. You should name the specific class.",
          "'catch' is for Java/JS. Python uses 'except'.",
          "Correct! This block only runs if a ValueError occurs.",
          "The keyword is 'except', not 'handle'."
        ]
      },
      {
        id: "py_pro_004",
        question: "Which method is used to merge dictionary B into dictionary A?",
        options: ["A.add(B)", "A.merge(B)", "A.update(B)", "A.combine(B)"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'.add' is for sets, not dictionaries.",
          "Dictionaries don't have a '.merge' method.",
          "Correct! '.update()' adds items from B into A, overwriting keys.",
          "'.combine' is not a standard dict method."
        ]
      },
      {
        id: "py_pro_005",
        question: "What is a lambda function?",
        options: ["A named function", "A recursive function", "An anonymous one-line function", "A high-order function"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Lambdas are defined without a name (anonymous).",
          "They can be recursive, but that's not their primary trait.",
          "Correct! Used for short throwaway logic.",
          "Lambdas are often PASSED TO high-order functions, but aren't they themselves."
        ]
      },
      {
        id: "py_pro_006",
        question: "What does list(zip([1,2], ['a','b'])) return?",
        options: ["[(1, 'a'), (2, 'b')]", "[[1, 'a'], [2, 'b']]", "[1, 2, 'a', 'b']", "[1, 'a', 2, 'b']"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! Zip pairs items into tuples inside a list.",
          "Zip produces tuples, not nested lists.",
          "That would be concatenation or flattening.",
          "Zip groups at the same index together."
        ]
      },
      {
        id: "py_pro_007",
        question: "A builder needs to filter a list to keep only even numbers. Which is the pro way?",
        options: ["filter(n % 2 == 0, list)", "[n for n in list if n % 2 == 0]", "list.filter(n % 2 == 0)", "while n % 2 == 0: pass"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "The 'filter' function requires a function/lambda as the first arg.",
          "Correct! List comprehensions are highly readable and fast.",
          "Python lists don't have a built-in '.filter' method.",
          "A while loop is inefficient for filtering a collection."
        ]
      },
      {
        id: "py_pro_008",
        question: "What is the result of ' '.join(['Hello', 'World'])?",
        options: ["['Hello', 'World']", "'HelloWorld'", "'Hello World'", "Error"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Join returns a string, not a list.",
          "You specified a space ' ' as the separator.",
          "Correct! The string acts as the glue between list items.",
          "This is perfectly valid Python syntax."
        ]
      },
      {
        id: "py_pro_009",
        question: "How do you get both index and value in a loop?",
        options: ["for i in range(len(list)):", "for i, v in enumerate(list):", "for index(v) in list:", "for i, v in zip(list):"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "This works but is less 'pythonic' than enumerate.",
          "Correct! 'enumerate' is the cleanest way to track index.",
          "Non-existent syntax. Use enumerate.",
          "Zip requires two collections to pair them up."
        ]
      },
      {
        id: "py_pro_010",
        question: "What's the difference between a Set and a List?",
        options: ["Sets are ordered", "Sets only allow unique items", "Lists are immutable", "None of the above"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Sets are unordered (until recently) and don't support indexing.",
          "Correct! Adding a duplicate to a Set does nothing.",
          "Lists are mutable. Tuples are immutable.",
          "The uniqueness of items is the defining trait of sets."
        ]
      },
      {
        id: "py_pro_011",
        question: "Which operator performs a deep merge in Python 3.9+ for dicts?",
        options: ["+", "|", "&", "||"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Using '+' on dicts raises a TypeError.",
          "Correct! The pipe operator '|' merges dictionaries.",
          "'&' is for set intersection, not dict merging.",
          "'||' is not a valid operator in Python."
        ]
      },
      {
        id: "py_pro_012",
        question: "How do you read all lines of a file safely?",
        options: ["file.read()", "with open('f.txt') as f: f.readlines()", "open('f.txt').read()", "read('f.txt')"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "This leaves the file handle open if not closed manually.",
          "Correct! 'with' ensures the file is closed automatically.",
          "Works, but 'with' is the pro-standard for safety.",
          "'read' is a method, not a global function for file paths."
        ]
      },
      {
        id: "py_pro_013",
        question: "What is a 'docstring'?",
        options: ["A regular comment", "A string in triple quotes for docs", "A code string", "A meta string"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Docstrings have special behavior (visible via .__doc__).",
          "Correct! Used to document modules, classes, and functions.",
          "It's specifically for documentation purposes.",
          "Technically metadata, but 'triple quote' is the definition."
        ]
      },
      {
        id: "py_pro_014",
        question: "What is the result of bool([])?",
        options: ["True", "False", "None", "Error"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Empty collections are always 'falsy' in Python.",
          "Correct! [ ], { }, ( ), \"\" are all False in boolean context.",
          "It returns a Boolean (False), not None.",
          "Empty lists are valid objects for bool() checks."
        ]
      },
      {
        id: "py_pro_015",
        question: "Which built-in function applies logic to every item in a list?",
        options: ["apply()", "map()", "run()", "foreach()"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'apply' is deprecated (was in Python 2).",
          "Correct! 'map(func, list)' transforms the whole sequence.",
          "'run' is not a standard high-order function in Python.",
          "'foreach' is not a Python function. Use map or code loops."
        ]
      },
      {
        id: "py_pro_016",
        question: "How do you deep copy a list 'a' into 'b'?",
        options: ["b = a", "b = a.copy()", "import copy; b = copy.deepcopy(a)", "b = list(a)"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "This just creates a reference. Changing 'a' changes 'b'.",
          "This is a 'shallow copy'. Nested lists will still shared references.",
          "Correct! 'deepcopy' copies the entire tree recursively.",
          "This is a shallow copy, similar to .copy()."
        ]
      },
      {
        id: "py_pro_017",
        question: "What is my_list[:: -1]?",
        options: ["First item", "Last item", "The list reversed", "Every second item"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Use my_list[0] for the first item.",
          "Use my_list[-1] for the last item.",
          "Correct! This slicing shorthand reverses the sequence.",
          "Use my_list[::2] for every second item."
        ]
      },
      {
        id: "py_pro_018",
        question: "Which of these is a Dictionary comprehension?",
        options: ["{x: x*x for x in r}", "[x: x*x for x in r]", "{x*x for x in r}", "(x: x*x for x in r)"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! Key:Value pairs inside curly braces.",
          "Square brackets create Lists, not Dictionaries.",
          "Curly braces without keys create a Set.",
          "Parentheses create generators, and keys aren't allowed there."
        ]
      },
      {
        id: "py_pro_019",
        question: "What does 'getattr(obj, \"name\")' do?",
        options: ["Deletes a property", "Checks if property exists", "Gets property value by name", "Sets a property"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Use 'delattr' to remove properties.",
          "Use 'hasattr' to check existence.",
          "Correct! It allows dynamic property access via string names.",
          "Use 'setattr' to change values."
        ]
      },
      {
        id: "py_pro_020",
        question: "How do you sort a list of tuples by the SECOND element?",
        options: ["list.sort(key=lambda x: x[1])", "list.sort()", "sorted(list, 2)", "list.sort(index=1)"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! 'key' defines the sorting criteria.",
          "Standard sort uses the FIRST element by default.",
          "'sorted' takes a sequence and an optional key, not a raw index.",
          "The parameter is named 'key', not 'index'."
        ]
      },
      {
        id: "py_pro_021",
        question: "What is an 'f-string' expression like f'{2+2}'?",
        options: ["4", "2+2", "{4}", "f{4}"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! Expressions inside { } are evaluated instantly.",
          "f-strings evaluate content, they don't treat it as literal text.",
          "The braces are removed after evaluation.",
          "The 'f' prefix is part of the string definition, not the result."
        ]
      },
      {
        id: "py_pro_022",
        question: "Which keyword prevents code from changing a variable inside a function?",
        options: ["final", "const", "global", "None of these"],
        correctAnswerIndex: 3,
        incorrectAnswerFeedback: [
          "'final' is not a keyword for variables in Python.",
          "'const' is JS. Python uses naming conventions (CAPS).",
          "'global' actually ALLOWS code to change outer variables.",
          "Correct! Python doesn't have true 'const' variables; we use conventions."
        ]
      },
      {
        id: "py_pro_023",
        question: "What is a 'generator'?",
        options: ["A function that returns a list", "An object that yields values one-by-one", "A code optimizer", "A power tool"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Generators don't return the whole list at once. They use 'yield'.",
          "Correct! They save memory by generating data on-demand.",
          "Generators are for iteration, not just 'optimizing' existing code.",
          "While powerful, it's a specific programmatic concept in Python."
        ]
      },
      {
        id: "py_pro_024",
        question: "How do you handle multiple exceptions in one block?",
        options: ["except (ErrorA, ErrorB):", "except ErrorA or ErrorB:", "except ErrorA, ErrorB:", "catch ErrorA, ErrorB:"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! Pass a tuple of exception classes.",
          "'or' logic doesn't work inside an except clause.",
          "The comma syntax was Python 2; use a tuple for current Python.",
          "'catch' is not a Python keyword."
        ]
      },
      {
        id: "py_pro_025",
        question: "What does 'assert x > 0' do?",
        options: ["Increments x", "Prints x", "Raises AssertionError if False", "Ends the program"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "It's a test, not an assignment.",
          "It doesn't output anything if the condition passes.",
          "Correct! Used for debugging and internal consistency checks.",
          "It only stops execution if the condition fails."
        ]
      },
      {
        id: "py_pro_026",
        question: "Which method joins all items of a tuple into a string?",
        options: [".concat()", ".add()", ".join()", ".link()"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'.concat' is not a standard tuple/string method in Python.",
          "'.add' is for Sets.",
          "Correct! Used as 'separator.join(tuple)'.",
          "'.link' is for web links or filesystems, not data objects."
        ]
      },
      {
        id: "py_pro_027",
        question: "What is the result of 'abc'[::2]?",
        options: ["abc", "ac", "b", "c"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "That would be the result if the step was 1.",
          "Correct! It picks every 2nd character (indices 0 and 2).",
          "Indices start at 0. Index 0 is 'a', index 1 is 'b'.",
          "'c' is index 2. This slice includes both 'a' and 'c'."
        ]
      },
      {
        id: "py_pro_028",
        question: "Which function allows you to get help on any Python object?",
        options: ["info()", "docs()", "help()", "describe()"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'info' is often a custom logging level, not a built-in help tool.",
          "The interactive document tool is 'help()'.",
          "Correct! It prints docstrings and method signatures.",
          "'describe' is a Pandas method, not a Python built-in."
        ]
      },
      {
        id: "py_pro_029",
        question: "How do you check if 'a' is a subclass of 'b'?",
        options: ["a.isSub(b)", "issubclass(a, b)", "type(a) == b", "isinstance(a, b)"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Invalid method name. Use 'issubclass'.",
          "Correct! Checks the class hierarchy.",
          "'type(a)' only checks the immediate class, not parents.",
          "'isinstance' checks an OBJECT, not the class itself."
        ]
      },
      {
        id: "py_pro_030",
        question: "What is the difference between '==' and 'is'?",
        options: ["They are identical", "is compares values", "== compares values, is compares identity", "is is faster"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Big difference! One checks 'what', the other checks 'where'.",
          "Actually, 'is' checks if two variables point to the same memory.",
          "Correct! '==' is for equality, 'is' is for identity.",
          "While 'is' is faster, that's not why we use it."
        ]
      },
      {
        id: "py_pro_031",
        question: "What is a 'decorator' in Python?",
        options: ["A UI styling tool", "A function that modifies another function", "A class attribute", "A code formatter"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "In Python, decorators are about behavior, not visual design.",
          "Correct! They 'wrap' functions to add extra logic.",
          "Attributes are data; decorators are higher-order functions.",
          "Formatting is done by linters/autoformatters (Black, Ruff)."
        ]
      },
      {
        id: "py_pro_032",
        question: "Which keyword is used to access the parent class?",
        options: ["parent", "base", "super", "this"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'parent' is used in PHP, not Python.",
          "'Base' is often a class name, but not a keyword.",
          "Correct! 'super()' allows calling parent methods.",
          "'this' is Java/C++ style. In Python, we use 'self'."
        ]
      },
      {
        id: "py_pro_033",
        question: "How do you define a constant (by convention)?",
        options: ["const X = 1", "X = 1 (all caps)", "final X = 1", "val X = 1"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Python has no 'const' keyword.",
          "Correct! Python uses UPPER_CASE names to signal stability.",
          "'final' isn't used for constants in Python.",
          "'val' is for Kotlin/Scala. Builders use caps in Python."
        ]
      },
      {
        id: "py_pro_034",
        question: "What does my_dict.get('key', 0) do?",
        options: ["Returns 0 if key exists", "Returns value if exists, else 0", "Sets key to 0", "Raises KeyError"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "It returns the value if it exists!",
          "Correct! It's a safe way to check keys without errors.",
          "It doesn't modify the dictionary.",
          "'.get' never raises a KeyError; it returns the default (0)."
        ]
      },
      {
        id: "py_pro_035",
        question: "Which of these removes and returns the first item from a list?",
        options: ["my_list.pop(0)", "my_list.shift()", "my_list.remove(0)", "my_list.delete(0)"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! '.pop(index)' retrieves and deletes.",
          "'.shift()' is JavaScript. Python uses .pop(0).",
          "'.remove' only deletes, it doesn't return the value.",
          "The 'del' keyword doesn't return the value either."
        ]
      }
    ],

    Expert: [
      {
        id: "py_exp_001",
        question: "Which dunder method is used for 'Constructor' logic in advanced classes?",
        options: ["__create__", "__new__", "__init__", "__call__"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "There is no standard '__create__' method in Python.",
          "'__new__' creates the instance; '__init__' initializes it. We use init for most logic.",
          "Correct! It's the standard way to set up custom data objects.",
          "'__call__' makes an instance callable like a function."
        ]
      },
      {
        id: "py_exp_002",
        question: "In Method Resolution Order (MRO), which built-in function delegates calls to parent classes?",
        options: ["parent()", "super()", "extend()", "next()"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'parent' is not a Python function. Use 'super'.",
          "Correct! It finds the next class in the MRO hierarchy.",
          "'.extend' is for lists, not class delegation.",
          "'next' is for iterators, not inheritance."
        ]
      },
      {
        id: "py_exp_003",
        question: "What is the main difference between @staticmethod and @classmethod?",
        options: ["None", "Static takes 'cls' arg", "Class takes 'cls' arg", "Static is faster"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "Huge difference in how they access class data!",
          "Actually, @classmethod takes 'cls'. @staticmethod takes nothing special.",
          "Correct! @classmethod can access and modify class state.",
          "Performance is negligible; the choice is about scope access."
        ]
      },
      {
        id: "py_exp_004",
        question: "What does the '@' symbol above a function represent?",
        options: ["An email address", "A decorator", "A meta-tag", "A pointer"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "In this context, it's strictly programmatic syntax.",
          "Correct! It applies a decorator function to the one below.",
          "It's specifically called a decorator in Python.",
          "Python doesn't use the '@' symbol for memory pointers."
        ]
      },
      {
        id: "py_exp_005",
        question: "Which method allows an object to be used inside a 'with' statement?",
        options: ["__init__", "__enter__", "__start__", "__open__"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'__init__' only sets up the object, it doesn't handle context.",
          "Correct! Together with '__exit__', it enables Context Managers.",
          "No standard '__start__' method for contexts.",
          "File objects have '.open', but the context dunder is '__enter__'."
        ]
      },
      {
        id: "py_exp_006",
        question: "What is the 'Global Interpreter Lock' (GIL) in Python?",
        options: ["A security tool", "A mechanism that prevents multi-core threading", "A memory management loop", "A type of code error"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "It's an internal architectural lock, not a hacker tool.",
          "Correct! It ensures only one thread runs CPython bytecode at a time.",
          "It affects memory, but the primary impact is on thread concurrency.",
          "It's a feature of the interpreter, not a bug in your code."
        ]
      },
      {
        id: "py_exp_007",
        question: "How do you calculate O(1) membership in a large dataset?",
        options: ["Use a List", "Use a Set", "Use a Tuple", "Use a Loop"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Lists are O(N) because Python must scan every item.",
          "Correct! Sets use hashing for near-instant (O(1)) lookups.",
          "Tuples are O(N) like lists.",
          "A loop is the literal definition of O(N) search."
        ]
      },
      {
        id: "py_exp_008",
        question: "What's the result of yield keywords in a function?",
        options: ["Returns a final value", "Converts function into a generator", "Pauses the whole computer", "Speeds up code"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'yield' doesn't terminate; it pauses and can produce again.",
          "Correct! It produces a stream of values instead of a single atom.",
          "It only pauses the specific function's execution state.",
          "It saves memory, which indirectly can help speed, but that's not its core job."
        ]
      },
      {
        id: "py_exp_009",
        question: "What is '__slots__' used for in a class?",
        options: ["Defining methods", "Reducing memory by preventing __dict__", "Security", "Threading"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Methods are defined in the class body.",
          "Correct! It explicitly names attributes, saving memory in high-volume objects.",
          "It's a memory optimization, not a security protocol.",
          "It has no direct relationship with thread safety."
        ]
      },
      {
        id: "py_exp_010",
        question: "In Python 3, what does 'super().method()' actually do?",
        options: ["Calls parent method", "Calls sibling method", "Starts the program", "Recursively calls itself"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! It's the standard way to extend parent behavior.",
          "It follows the MRO; it doesn't jump to random siblings.",
          "No, it's strictly for method delegation in inheritance.",
          "That would be standard recursion; super() jumps UP the tree."
        ]
      },
      {
        id: "py_exp_011",
        question: "Which dunder method handles attribute access when it's NOT found in __dict__?",
        options: ["__getattribute__", "__getattr__", "__setattr__", "__hasattr__"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'__getattribute__' runs for EVERY access; '__getattr__' is only the fallback.",
          "Correct! It provides a safety net for missing properties.",
          "'__setattr__' is for writing, not reading.",
          "No such dunder method as '__hasattr__'; that's a global function."
        ]
      },
      {
        id: "py_exp_012",
        question: "What is a 'metaclass'?",
        options: ["A very large class", "A class that creates other classes", "A library of classes", "An abstract class"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Size doesn't matter; it's about the factory relationship.",
          "Correct! 'type' is the default metaclass of all objects.",
          "A library is a package; a metaclass is a programmatic blueprint for blueprints.",
          "Abstract classes define behavior for children; metaclasses define behavior for THE CLASS ITSELF."
        ]
      },
      {
        id: "py_exp_013",
        question: "How do you achieve multi-core parallelism in Python, bypassing the GIL?",
        options: ["Threading module", "Multiprocessing module", "Asyncio", "Fast-forwarding the clock"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Threading is limited to one core by the GIL. Better for I/O.",
          "Correct! It creates separate processes each with their own interpreter.",
          "Asyncio is single-threaded; it 'waits' better, it doesn't 'run' more on other cores.",
          "Not a biological possibility for standard builders yet."
        ]
      },
      {
        id: "py_exp_014",
        question: "What is the time complexity of a dictionary lookup in the average case?",
        options: ["O(log N)", "O(1)", "O(N)", "O(N log N)"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Binary trees use O(log N), but dicts use hash tables.",
          "Correct! Hashing allows near-instant access regardless of size.",
          "O(N) is for lists where you might have to scan every item.",
          "Sort operations usually take O(N log N), not simple lookups."
        ]
      },
      {
        id: "py_exp_015",
        question: "Which module allows you to serialize Python objects into byte streams?",
        options: ["json", "csv", "pickle", "byteify"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "JSON only handles basic types (no custom classes easily).",
          "CSV is for tabular text data, not complex objects.",
          "Correct! Pickle is the go-to for saving Python states.",
          "'byteify' is not a standard Python library."
        ]
      },
      {
        id: "py_exp_016",
        question: "What does 'itertools.chain()' do?",
        options: ["Locks a variable", "Combines multiple iterables into one long stream", "Repeats a value", "Filters a list"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "It doesn't handle variable locking.",
          "Correct! Efficiently joins lists/generators without loading them all into memory.",
          "Use 'itertools.repeat' for that.",
          "Use 'itertools.filterfalse' or standard filter for that."
        ]
      },
      {
        id: "py_exp_017",
        question: "What is an 'abstract base class' (ABC)?",
        options: ["A class that cannot be instantiated", "A class with no methods", "A hidden class", "A primary class"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! It defines a template that children MUST implement.",
          "They usually have 'abstract methods' that are empty.",
          "They are very public; they serve as contracts for the code.",
          "All classes are 'primary' in their own scope."
        ]
      },
      {
        id: "py_exp_018",
        question: "In Python's MRO, for class C(A, B), which is checked first?",
        options: ["A", "B", "C", "Object"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "A is checked second (it's the first parent in line).",
          "B is checked after A.",
          "Correct! The class itself is always searched before its parents.",
          "Object is the ultimate ancestor and is checked last."
        ]
      },
      {
        id: "py_exp_019",
        question: "What is 'functools.lru_cache' used for?",
        options: ["Clearing memory", "Memoization / Caching function results", "Timing code", "Formatting code"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "It uses more memory to save results, not clear it.",
          "Correct! It speeds up recursive or heavy functions by remembering inputs.",
          "For timing, use the 'time' or 'timeit' modules.",
          "It's a performance tool, not a formatting tool."
        ]
      },
      {
        id: "py_exp_020",
        question: "What is the result of [x for x in range(10) if x % 2 == 0]?",
        options: ["[1, 3, 5, 7, 9]", "[0, 2, 4, 6, 8]", "[0, 2, 4, 6, 8, 10]", "[2, 4, 6, 8]"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "These are odd numbers! The condition 'x % 2 == 0' finds even numbers.",
          "Correct! Evens up to (but not including) 10.",
          "Range(10) stops at 9, so 10 is never reached.",
          "Zero is included in the range and is also an even number (0 % 2 == 0)."
        ]
      },
      {
        id: "py_exp_021",
        question: "Which built-in function is the basis for all Python objects?",
        options: ["Basic", "Type", "Object", "Atom"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "'Basic' is not a core Python concept.",
          "'type' is the metaclass, but 'object' is the base class.",
          "Correct! Everything in Python 3 inherits from 'object'.",
          "'Atom' is not a built-in Python root."
        ]
      },
      {
        id: "py_exp_022",
        question: "How do you create a generator expression?",
        options: ["(...) syntax", "[...] syntax", "{...} syntax", "yield(...) syntax"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! Like list comprehensions but with parentheses.",
          "Square brackets create a complete List in memory.",
          "Curly braces create Sets or Dicts.",
          "'yield' is used inside function bodies, not for inline expressions."
        ]
      },
      {
        id: "py_exp_023",
        question: "What is the time complexity of sorting a list in Python (Timsort)?",
        options: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Sorting requires more than one pass! O(N) is too optimistic.",
          "Correct! Timsort is a hybrid stable sort with O(N log N) complexity.",
          "O(N^2) is for inefficient sorts like Bubble Sort.",
          "O(log N) is for searching in a sorted list, not the sort itself."
        ]
      },
      {
        id: "py_exp_024",
        question: "What is the 'self' parameter in a method?",
        options: ["The class itself", "The instance of the object", "A private variable", "A global pointer"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'cls' is used for the class; 'self' is for the specific instance.",
          "Correct! It allows methods to access the object's unique data.",
          "Indicates public access to the instance, not necessarily 'private'.",
          "It's local to the class method scope, not global."
        ]
      },
      {
        id: "py_exp_025",
        question: "What does 'getattr' with the default argument prevent?",
        options: ["RecursionError", "AttributeError", "KeyError", "NameError"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Doesn't affect recursion directly.",
          "Correct! Returning a default stops the code from crashing when a property is missing.",
          "KeyErrors are for dictionaries; AttributeErrors are for objects.",
          "NameErrors are for missing variables in scope, not object properties."
        ]
      },
      {
        id: "py_exp_026",
        question: "Which decorator is used to define a property with a getter/setter?",
        options: ["@attr", "@field", "@property", "@getter"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "No '@attr' built-in decorator.",
          "No '@field' built-in decorator.",
          "Correct! It allows methods to be called like simple attributes.",
          "It's just called '@property'. Setters then use '@name.setter'."
        ]
      },
      {
        id: "py_exp_027",
        question: "What is a 'closure'?",
        options: ["Closing a file", "A function remembering variables from its outer scope", "Ending a loop", "Private class state"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "That's just file handling.",
          "Correct! Inner functions can access variables from where they were defined.",
          "That's a 'break' or natural end.",
          "Closures are about functional scope, not class privacy."
        ]
      },
      {
        id: "py_exp_028",
        question: "What is 'monkey patching'?",
        options: ["Fixing bugs in a zoo", "Replacing code at runtime", "Using decorators", "Writing bad code"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "A funny name, but strictly programmatic!",
          "Correct! Changing behavior of a module/class after it's loaded.",
          "Decorators are defined in the code; monkey patching happens on the fly.",
          "While controversial, it's a specific technical capability."
        ]
      },
      {
        id: "py_exp_029",
        question: "What does 'sys.path' contain?",
        options: ["System password", "List of directories Python looks for modules", "Full path to current file", "User's home directory"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Never stores passwords!",
          "Correct! If a folder isn't in sys.path, you can't import from it.",
          "Use '__file__' for the current file's path.",
          "Usually accessible via 'os.path.expanduser('~')'."
        ]
      },
      {
        id: "py_exp_030",
        question: "What is the time complexity of inserting at the START of a Python list?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "O(1) is for appending to the END.",
          "Inserting requires shifting; it's proportional to list size.",
          "Correct! Python must move every single item one slot over.",
          "O(N) is the standard for a single insertion at the head."
        ]
      },
      {
        id: "py_exp_031",
        question: "Which module provides a higher-level interface for working with the 'dis' (disassembler)?",
        options: ["inspect", "dis", "ast", "pyclbr"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "'inspect' is for live objects, not raw bytecode disassembly.",
          "Correct! The 'dis' module lets you see the CPython bytecode.",
          "'ast' is for the Abstract Syntax Tree, one level above bytecode.",
          "'pyclbr' is for basic class/function extraction without importing."
        ]
      },
      {
        id: "py_exp_032",
        question: "What does 'contextlib.suppress(FileNotFoundError)' do?",
        options: ["Raises the error", "Deletes the file", "Silently ignores the specified exception", "Logs the error"],
        correctAnswerIndex: 2,
        incorrectAnswerFeedback: [
          "It's designed to stop the error from crashing the program.",
          "It's a logic handler, not a filesystem command.",
          "Correct! It's a clean context manager for ignoring expected errors.",
          "It suppresses it entirely; no logging happens unless you add it."
        ]
      },
      {
        id: "py_exp_033",
        question: "What are 'function annotations' used for in Python 3?",
        options: ["Enforcing types at runtime", "Metadata/Type hinting", "Naming functions", "Security"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Python doesn't enforce types at runtime by default (unlike Java).",
          "Correct! They provide hints for developers and tools like Mypy.",
          "Functions are named in the 'def' statement.",
          "Annotations have zero impact on code security."
        ]
      },
      {
        id: "py_exp_034",
        question: "What is the result of all([True, 1, 'Yes'])?",
        options: ["True", "False", "1", "Error"],
        correctAnswerIndex: 0,
        incorrectAnswerFeedback: [
          "Correct! 'all()' returns True if every item is 'truthy'.",
          "All items in the list (True, 1, 'Yes') are truthy.",
          "'all()' returns a boolean, not the value 1.",
          "Valid syntax. No error here."
        ]
      },
      {
        id: "py_exp_035",
        question: "What does 'import re' provide?",
        options: ["Recursion tools", "Regular Expression support", "Remote execution", "Reset tools"],
        correctAnswerIndex: 1,
        incorrectAnswerFeedback: [
          "Recursion is a language feature, not in 're'.",
          "Correct! It's the standard library for pattern matching.",
          "Remote work requires 'socket' or 'paramiko', not 're'.",
          "Python uses 'reload' or system calls for resets."
        ]
      }
    ]
  }
};
