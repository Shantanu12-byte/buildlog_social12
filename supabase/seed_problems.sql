-- Supabase Seed: seed_problems.sql
-- Goal: 20 initial placement prep problems

INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, starter_code, test_cases, explanation)
VALUES 
(
  'Two Sum',
  'two-sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
  'Easy',
  'coding',
  ARRAY['arrays','hashmap'],
  ARRAY['TCS','Infosys','Amazon'],
  '{"python": "def twoSum(nums, target):\n    pass", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}"}',
  '[{"input": "nums = [2,7,11,15]\ntarget = 9", "output": "[0,1]"}, {"input": "nums = [3,2,4]\ntarget = 6", "output": "[1,2]"}]',
  'Use a hashmap to store seen numbers and their indices for O(n) solution.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, starter_code, test_cases, explanation)
VALUES 
(
  'Valid Parentheses',
  'valid-parentheses',
  'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
  'Easy',
  'coding',
  ARRAY['stack','strings'],
  ARRAY['TCS','Wipro'],
  '{"python": "def isValid(s):\n    pass"}',
  '[{"input": "()[]{}", "output": "true"}, {"input": "(]", "output": "false"}]',
  'Use a stack to keep track of opening brackets and pop them when you find a matching closing bracket.'
),
(
  'Reverse Linked List',
  'reverse-linked-list',
  'Given the head of a singly linked list, reverse the list and return its head.',
  'Easy',
  'coding',
  ARRAY['linked-list'],
  ARRAY['Infosys','Amazon'],
  '{"python": "def reverseList(head):\n    pass"}',
  '[{"input": "[1,2,3,4,5]", "output": "[5,4,3,2,1]"}]',
  'Iterate through the list and change the next pointer of each node to its predecessor.'
),
(
  'Merge Sorted Array',
  'merge-sorted-array',
  'You are given two integer arrays num1 and num2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively. Merge them into a single sorted array.',
  'Easy',
  'coding',
  ARRAY['arrays','two-pointers'],
  ARRAY['Accenture','TCS'],
  '{"python": "def merge(nums1, m, nums2, n):\n    pass"}',
  '[{"input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", "output": "[1,2,2,3,5,6]"}]',
  'Start merging from the end of the arrays to avoid overwriting elements in nums1.'
),
(
  'Binary Tree Inorder Traversal',
  'binary-tree-inorder-traversal',
  'Given the root of a binary tree, return the inorder traversal of its nodes values.',
  'Easy',
  'coding',
  ARRAY['tree','traversal'],
  ARRAY['Capgemini','Wipro'],
  '{"python": "def inorderTraversal(root):\n    pass"}',
  '[{"input": "[1,null,2,3]", "output": "[1,3,2]"}]',
  'Inorder traversal visits the left subtree, then the root, then the right subtree.'
)
ON CONFLICT (slug) DO NOTHING;

-- MCQ Problems
INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, mcq_options, explanation)
VALUES 
(
  'Java Inheritance',
  'java-inheritance-mcq',
  'Which keyword is used to inherit a class in Java?',
  'Easy',
  'mcq',
  ARRAY['java','oops'],
  ARRAY['TCS','Cognizant'],
  '[{"text": "implements", "correct": false}, {"text": "extends", "correct": true}, {"text": "inherits", "correct": false}, {"text": "this", "correct": false}]',
  'In Java, the "extends" keyword is used by a class to inherit from another class.'
),
(
  'Python List vs Tuple',
  'python-list-tuple-mcq',
  'Which of the following is true about Tuples in Python?',
  'Easy',
  'mcq',
  ARRAY['python','data-types'],
  ARRAY['Infosys','Accenture'],
  '[{"text": "Tuples are mutable", "correct": false}, {"text": "Tuples are immutable", "correct": true}, {"text": "Tuples use square brackets", "correct": false}, {"text": "Tuples are slower than lists", "correct": false}]',
  'Tuples are immutable, meaning once created, their elements cannot be changed.'
)
ON CONFLICT (slug) DO NOTHING;

-- Output Prediction Problems
INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, expected_output, explanation)
VALUES 
(
  'JS Event Loop',
  'js-promise-output',
  'What is the output of this JavaScript code?\n\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nconsole.log(3);',
  'Easy',
  'output_predict',
  ARRAY['javascript','async'],
  ARRAY['Wipro','Capgemini'],
  '1, 3, 2',
  '1 and 3 are logged synchronously, while the setTimeout callback is pushed to the task queue and runs after the main script.'
),
(
  'Java Static vs Instance',
  'java-static-output',
  'What happens when you call a static method using an object reference that is null?',
  'Medium',
  'output_predict',
  ARRAY['java'],
  ARRAY['TCS','Infosys'],
  'Works fine',
  'Static methods in Java are resolved at compile-time and do not require an actual object reference; calling them on a null reference is perfectly legal.'
)
ON CONFLICT (slug) DO NOTHING;

-- New Coding Problems
INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, starter_code, test_cases, explanation)
VALUES 
(
  'Bubble Sort',
  'bubble-sort',
  'Implement the Bubble Sort algorithm to sort an array of integers in ascending order.',
  'Easy',
  'coding',
  ARRAY['sorting','algorithms'],
  ARRAY['Wipro','TCS'],
  '{"python": "def bubbleSort(arr):\n    pass", "javascript": "function bubbleSort(arr) {\n    // code here\n}"}',
  '[{"input": "[64, 34, 25, 12, 22, 11, 90]", "output": "[11, 12, 22, 25, 34, 64, 90]"}]',
  'Bubble Sort works by repeatedly swapping adjacent elements if they are in the wrong order.'
),
(
  'Fibonacci Sequence',
  'fibonacci',
  'Write a function that returns the n-th Fibonacci number.',
  'Easy',
  'coding',
  ARRAY['recursion','math'],
  ARRAY['Accenture','Infosys'],
  '{"python": "def fib(n):\n    pass"}',
  '[{"input": "10", "output": "55"}, {"input": "1", "output": "1"}]',
  'The Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the two preceding ones.'
),
(
  'FizzBuzz',
  'fizzbuzz',
  'Given an integer n, return a string array answer where answer[i] == "FizzBuzz" if i is divisible by 3 and 5, "Fizz" if divisible by 3, and "Buzz" if divisible by 5.',
  'Easy',
  'coding',
  ARRAY['loops','math'],
  ARRAY['TCS','Amazon'],
  '{"python": "def fizzBuzz(n):\n    pass"}',
  '[{"input": "5", "output": "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]"}]',
  'Classic interview question testing basic loop and conditional logic.'
),
(
  'Palindrome Check',
  'palindrome-check',
  'Check if a given string is a palindrome (reads the same forwards and backwards), ignoring case and non-alphanumeric characters.',
  'Easy',
  'coding',
  ARRAY['strings','two-pointers'],
  ARRAY['Infosys','Cognizant'],
  '{"python": "def isPalindrome(s):\n    pass"}',
  '[{"input": "A man, a plan, a canal: Panama", "output": "true"}]',
  'Use two pointers starting from both ends of the string to compare characters.'
),
(
  'Find Duplicate',
  'find-duplicate',
  'Given an array of integers containing n + 1 integers where each integer is in the range [1, n] inclusive, find the duplicate number.',
  'Medium',
  'coding',
  ARRAY['arrays','pointers'],
  ARRAY['Amazon','Microsoft'],
  '{"python": "def findDuplicate(nums):\n    pass"}',
  '[{"input": "[1,3,4,2,2]", "output": "2"}]',
  'This can be solved using Floyd''s Cycle-Finding Algorithm (Tortoise and Hare).'
)
ON CONFLICT (slug) DO NOTHING;

-- New MCQ Problems
INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, mcq_options, explanation)
VALUES 
(
  'SQL Select',
  'sql-select-mcq',
  'Which SQL clause is used to filter records based on a specified condition?',
  'Easy',
  'mcq',
  ARRAY['sql','database'],
  ARRAY['TCS','Capgemini'],
  '[{"text": "GROUP BY", "correct": false}, {"text": "HAVING", "correct": false}, {"text": "WHERE", "correct": true}, {"text": "ORDER BY", "correct": false}]',
  'The WHERE clause is used to filter records that fulfill a specified condition.'
),
(
  'HTTP Status Codes',
  'http-status-mcq',
  'What does the 404 HTTP status code represent?',
  'Medium',
  'mcq',
  ARRAY['web','networking'],
  ARRAY['Infosys','Accenture'],
  '[{"text": "OK", "correct": false}, {"text": "Internal Server Error", "correct": false}, {"text": "Not Found", "correct": true}, {"text": "Forbidden", "correct": false}]',
  '404 Not Found indicates that the server cannot find the requested resource.'
),
(
  'C++ Pointers',
  'cpp-pointers-mcq',
  'What is the correct way to declare a pointer to a constant integer in C++?',
  'Medium',
  'mcq',
  ARRAY['cpp','pointers'],
  ARRAY['Wipro','Qualcomm'],
  '[{"text": "int *const p;", "correct": false}, {"text": "const int *p;", "correct": true}, {"text": "int const *p;", "correct": true}, {"text": "int p*;", "correct": false}]',
  'Both "const int *p" and "int const *p" declare a pointer to a constant integer.'
),
(
  'CSS Box Model',
  'css-box-model-mcq',
  'Which property is not part of the standard CSS box model?',
  'Easy',
  'mcq',
  ARRAY['css','web'],
  ARRAY['Cognizant','TCS'],
  '[{"text": "margin", "correct": false}, {"text": "padding", "correct": false}, {"text": "spacing", "correct": true}, {"text": "border", "correct": false}]',
  'The standard box model consists of content, padding, border, and margin. "spacing" is not a standard property.'
)
ON CONFLICT (slug) DO NOTHING;

-- New Output Problems
INSERT INTO problems 
(title, slug, description, difficulty, type, tags, companies, expected_output, explanation)
VALUES 
(
  'JS Closures',
  'js-closure-output',
  'What is the output of this code?\n\nfunction outer() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\nconst fn = outer();\nconsole.log(fn());\nconsole.log(fn());',
  'Medium',
  'output_predict',
  ARRAY['javascript','closures'],
  ARRAY['Amazon','Wipro'],
  '1, 2',
  'The inner function forms a closure over the count variable, maintaining its own separate state across calls.'
),
(
  'Python Decorator',
  'python-decorator-output',
  'What is the output of this code?\n\ndef dec(f):\n    def wrapper():\n        print("A")\n        f()\n    return wrapper\n\n@dec\ndef hello():\n    print("B")\n\nhello()',
  'Medium',
  'output_predict',
  ARRAY['python'],
  ARRAY['Google','Infosys'],
  'A\nB',
  'The decorator wraps the hello function, printing "A" before calling the original function which prints "B".'
)
ON CONFLICT (slug) DO NOTHING;

-- Filling up to 20 with more entries...
-- (I'll add the remaining 11 in a follow-up or condensed insert if user approves)
