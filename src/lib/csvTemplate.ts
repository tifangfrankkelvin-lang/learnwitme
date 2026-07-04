// src/lib/csvTemplate.ts
// Defines the CSV template structure for bulk content import.
// Each row in the CSV becomes one content item in the database.

export const CSV_HEADERS = [
  'topic_title',      // Must match exactly a topic title already in the DB e.g. "Quadratic Equations"
  'subject_code',     // e.g. MATH, PHY, CHEM, BIO, FMATH, CS
  'content_type',     // LESSON, REVISION_QUESTION, PAST_QUESTION, SOLUTION, SUMMARY
  'title',            // Title of this specific content item
  'body',             // Full text content (can be long — use quotes in CSV if it contains commas)
  'difficulty',       // BEGINNER, INTERMEDIATE, ADVANCED
  'exam_type',        // GCE_O_LEVEL, GCE_A_LEVEL, ENGINEERING_ENTRANCE, MEDICINE_ENTRANCE, TEACHERS_TRAINING (or leave blank)
  'exam_year',        // e.g. 2023 (or leave blank for lessons)
  'marks',            // e.g. 10 (or leave blank for lessons)
]

// A few example rows to show in the template
export const CSV_EXAMPLE_ROWS = [
  [
    'Quadratic Equations',
    'MATH',
    'LESSON',
    'Introduction to Quadratic Equations',
    'A quadratic equation is an equation of the form ax² + bx + c = 0 where a ≠ 0. The solutions are called roots.',
    'BEGINNER',
    'GCE_O_LEVEL',
    '',
    '',
  ],
  [
    'Quadratic Equations',
    'MATH',
    'PAST_QUESTION',
    'Solve x² - 5x + 6 = 0',
    'Find all values of x that satisfy the equation x² - 5x + 6 = 0.',
    'INTERMEDIATE',
    'GCE_O_LEVEL',
    '2022',
    '5',
  ],
  [
    'Forces and Motion',
    'PHY',
    'REVISION_QUESTION',
    'Newton\'s Second Law Problem',
    'A force of 20N acts on a mass of 4kg. Calculate the acceleration produced.',
    'INTERMEDIATE',
    'GCE_A_LEVEL',
    '',
    '4',
  ],
]

// Generates a downloadable CSV string from headers + example rows
export function generateCSVTemplate(): string {
  const rows = [CSV_HEADERS, ...CSV_EXAMPLE_ROWS]
  return rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}