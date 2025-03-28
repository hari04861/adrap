export interface User {
  type: 'student' | 'faculty' | 'admin';
  username: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  batch: string;
  section: string;
}

export interface QuestionMark {
  questionNumber: string; // e.g., "1", "11(a)(i)"
  co: number;
  maxMarks: number;
}

export interface CoMark {
  co: number;
  maxMarks: number;
}

export interface StudentMark {
  rollNumber: number;
  name: string;
  marks: number[];
  questionMarks?: { [key: string]: number }; // Map question numbers to marks
  submitted: boolean;
}

export interface SerialTest {
  id: number;
  subjectId: string;
  serialTestNumber: 1 | 2;
  questionMarks: QuestionMark[];
  coMarks: CoMark[];
  studentMarks: StudentMark[];
  batch: string;
  section: string;
}