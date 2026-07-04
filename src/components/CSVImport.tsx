// src/components/CSVImport.tsx
// Handles CSV file upload, parsing, preview, and bulk insert
// into the content table. Used inside the Admin page.

import { useState, useRef } from 'react'
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateCSVTemplate } from '../lib/csvTemplate'

// Shape of a parsed CSV row before inserting
type ParsedRow = {
  topic_title: string
  subject_code: string
  content_type: string
  title: string
  body: string
  difficulty: string
  exam_type: string
  exam_year: string
  marks: string
  // These get resolved after DB lookup
  topic_id?: string
  error?: string  // set if this row has a validation problem
}

export default function CSVImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  // -------------------------------------------------------
  // Download the CSV template
  // -------------------------------------------------------
  function handleDownloadTemplate() {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'learnwitme_content_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // -------------------------------------------------------
  // Parse the uploaded CSV file
  // -------------------------------------------------------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.trim().split('\n')

      // Skip header row (first line)
      const dataLines = lines.slice(1)

      const parsed: ParsedRow[] = dataLines.map(line => {
        // Handle quoted fields (fields with commas inside quotes)
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(
          c => c.replace(/^"|"$/g, '').trim()
        ) || []

        const row: ParsedRow = {
          topic_title:  cols[0] || '',
          subject_code: cols[1] || '',
          content_type: cols[2] || '',
          title:        cols[3] || '',
          body:         cols[4] || '',
          difficulty:   cols[5] || 'INTERMEDIATE',
          exam_type:    cols[6] || '',
          exam_year:    cols[7] || '',
          marks:        cols[8] || '',
        }

        // Basic validation
        if (!row.topic_title) row.error = 'Missing topic_title'
        else if (!row.title) row.error = 'Missing title'
        else if (!row.body) row.error = 'Missing body'
        else if (!['LESSON','REVISION_QUESTION','PAST_QUESTION','SOLUTION','SUMMARY'].includes(row.content_type))
          row.error = `Invalid content_type: ${row.content_type}`
        else if (!['BEGINNER','INTERMEDIATE','ADVANCED'].includes(row.difficulty))
          row.error = `Invalid difficulty: ${row.difficulty}`

        return row
      }).filter(row => row.title || row.topic_title) // skip completely empty rows

      setRows(parsed)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  // -------------------------------------------------------
  // Resolve topic IDs and bulk insert into Supabase
  // -------------------------------------------------------
  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)

    // Get all topics from DB in one query so we can resolve names to IDs
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id, title, subject_id, subjects(code)')

    let success = 0
    let failed = 0

    for (const row of rows) {
      // Skip rows with pre-validation errors
      if (row.error) {
        failed++
        continue
      }

      // Find the matching topic by title + subject code
      const matchedTopic = allTopics?.find(
        t => t.title.toLowerCase() === row.topic_title.toLowerCase() &&
          (t.subjects as any)?.code === row.subject_code
      )

      if (!matchedTopic) {
        failed++
        continue
      }

      const { error } = await supabase.from('content').insert({
        topic_id:     matchedTopic.id,
        content_type: row.content_type,
        title:        row.title,
        body:         row.body,
        difficulty:   row.difficulty,
        exam_type:    row.exam_type || null,
        exam_year:    row.exam_year ? parseInt(row.exam_year) : null,
        marks:        row.marks ? parseInt(row.marks) : null,
        is_published: true,
        is_verified:  true,
      })

      if (error) {
        failed++
      } else {
        success++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    // Clear the file input so the same file can be re-uploaded if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validRows = rows.filter(r => !r.error)
  const errorRows = rows.filter(r => r.error)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-sm font-bold text-gray-700 mb-1">Bulk Import via CSV</h2>
      <p className="text-xs text-gray-400 mb-4">Upload hundreds of lessons and questions at once.</p>

      {/* Step 1: Download template */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Step 1 — Download the template, fill it in, save as CSV</p>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm text-indigo-600 font-medium border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors duration-200"
        >
          <Download size={16} />
          Download CSV Template
        </button>
      </div>

      {/* Step 2: Upload CSV */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Step 2 — Upload your filled CSV</p>
        <label className="flex items-center gap-2 text-sm text-gray-600 font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors duration-200 cursor-pointer w-fit">
          <Upload size={16} />
          Choose CSV file
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Step 3 — Preview ({rows.length} rows detected: {validRows.length} valid, {errorRows.length} with errors)
          </p>

          <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl mb-3">
            {rows.map((row, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 text-xs border-b border-gray-50 last:border-b-0 ${row.error ? 'bg-red-50' : 'bg-white'}`}>
                {row.error
                  ? <XCircle size={14} className="text-red-500 flex-shrink-0" />
                  : <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                }
                <span className="text-gray-700 truncate flex-1">{row.title || '(no title)'}</span>
                <span className="text-gray-400 flex-shrink-0">{row.topic_title} · {row.content_type}</span>
                {row.error && <span className="text-red-500 flex-shrink-0">{row.error}</span>}
              </div>
            ))}
          </div>

          {errorRows.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-xs p-3 rounded-xl mb-3">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{errorRows.length} row(s) have errors and will be skipped. Fix them in your CSV and re-upload to include them.</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            <Upload size={16} />
            {importing ? 'Importing...' : `Import ${validRows.length} valid rows`}
          </button>
        </div>
      )}

      {/* Result */}
      {importResult && (
        <div className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl ${
          importResult.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {importResult.failed === 0
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />
          }
          {importResult.success} imported successfully
          {importResult.failed > 0 && `, ${importResult.failed} failed (topic not found or DB error)`}
        </div>
      )}
    </div>
  )
}