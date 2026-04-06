const normalize = (s) => (s || '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();

const testCases = [
  {
    name: "Literal \\n to real \\n",
    expected: "A\\nB",
    got: "A\nB",
    shouldPass: true
  },
  {
    name: "Windows line endings",
    expected: "A\\nB",
    got: "A\r\nB",
    shouldPass: true
  },
  {
    name: "Trim whitespace",
    expected: " A\\nB ",
    got: "A\nB",
    shouldPass: true
  },
  {
    name: "Mismatch",
    expected: "A\\nB",
    got: "A\nC",
    shouldPass: false
  }
];

testCases.forEach(tc => {
  const cleanExpected = normalize(tc.expected);
  const cleanGot = normalize(tc.got);
  const passed = cleanGot === cleanExpected;
  console.log(`Test: ${tc.name}`);
  console.log(`  Passed: ${passed === tc.shouldPass ? '✅' : '❌'}`);
  if (passed !== tc.shouldPass) {
    console.log(`  Expected match: ${tc.shouldPass}, but got ${passed}`);
  }
});
