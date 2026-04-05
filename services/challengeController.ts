import { supabase } from '@/lib/supabase';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_JUDGE0_RAPIDAPI_KEY;

const HEADERS = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
};

const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
};

/**
 * Execute code via Judge0
 */
export async function executeCode(code: string, language: string, input: string) {
  const langId = LANGUAGE_IDS[language.toLowerCase()];
  if (!langId) throw new Error('Unsupported language');

  try {
    const response = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: HEADERS as Record<string, string>,
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: input,
        }),
      }
    );
    const submission = await response.json();
    return submission;
  } catch (error) {
    console.error('Judge0 Execution Error:', error);
    throw error;
  }
}

/**
 * Run test cases for a problem
 */
export async function runTestCases(code: string, language: string, problem: any) {
  if (problem.type === 'output_predict') {
    const isCorrect = code.trim() === problem.expected_output.trim();
    return [{ passed: isCorrect, got: code.trim(), expected: problem.expected_output }];
  }

  if (problem.type === 'mcq') {
    const correctOption = problem.mcq_options.find((o: any) => o.correct);
    const isCorrect = code === correctOption?.text;
    return [{ passed: isCorrect, got: code, expected: correctOption?.text }];
  }

  // Coding problem
  const results = [];
  const testCases = typeof problem.test_cases === 'string' ? JSON.parse(problem.test_cases) : problem.test_cases;

  for (const tc of testCases) {
    try {
      const result = await executeCode(code, language, tc.input);
      const stdout = result.stdout?.trim() || '';
      const expected = tc.output.trim();
      
      results.push({
        input: tc.input,
        expected: expected,
        got: stdout,
        passed: stdout === expected,
        time: result.time,
        memory: result.memory
      });
    } catch (e) {
      results.push({ passed: false, error: 'Execution failed' });
    }
  }
  return results;
}

/**
 * Submit solution and update progress/XP
 */
export async function submitSolution(userId: string, problem: any, code: string, language: string, results: any[]) {
  const allPassed = results.every(r => r.passed);
  const status = allPassed ? 'solved' : 'attempted';

  try {
    // 1. Record User Progress
    await supabase.from('user_problems').upsert({
      user_id: userId,
      problem_id: problem.id,
      status: status,
      language: language,
      submitted_code: code,
      solved_at: allPassed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,problem_id' });

    // 2. If solved, update XP and stats
    if (allPassed) {
      const xpValue = problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 25 : 50;
      
      // Fetch current profile for atomic-ish update
      const { data: profile } = await supabase.from('profiles').select('xp, problems_solved, easy_solved, medium_solved, hard_solved').eq('id', userId).single();
      
      if (profile) {
        const update: any = {
          xp: (profile.xp || 0) + xpValue,
          problems_solved: (profile.problems_solved || 0) + 1
        };
        
        if (problem.difficulty === 'Easy') update.easy_solved = (profile.easy_solved || 0) + 1;
        if (problem.difficulty === 'Medium') update.medium_solved = (profile.medium_solved || 0) + 1;
        if (problem.difficulty === 'Hard') update.hard_solved = (profile.hard_solved || 0) + 1;

        await supabase.from('profiles').update(update).eq('id', userId);
      }
    }
    
    return { success: true, allPassed };
  } catch (error) {
    console.error('Submission Error:', error);
    return { success: false, error };
  }
}
