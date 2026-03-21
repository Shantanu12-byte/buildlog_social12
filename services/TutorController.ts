import { BULK_LESSON_DATA } from '../constants/BulkLessonData';

export function getTutoringFeedback(topicKey: string, questionId: string, selectedIdx: number) {
  const category = BULK_LESSON_DATA[topicKey];
  if (!category) return null;

  const question = category.find(q => q.id === questionId);
  if (!question) return null;

  const isCorrect = selectedIdx === question.answer;
  const feedback = question.incorrectAnswerFeedback[selectedIdx];

  return {
    isCorrect,
    feedback: feedback || "That wasn't quite right. Keep trying!",
    misconceptionKey: question.misconceptionKey,
    codeSnippet: question.codeSnippet
  };
}
