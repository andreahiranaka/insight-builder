import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Anthropic from "@anthropic-ai/sdk"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export default function App() {
  const [prompt, setPrompt] = useState("")
  const [report, setReport] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [savedReports, setSavedReports] = useState([])
  const [error, setError] = useState("")

async function generateReport() {
  setLoading(true)
  setReport("")
  setError("")
  setIsEditing(false)
  setTitle("")

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert product manager and facilitator. Analyse this meeting transcript and generate a structured decision log with the following sections:

## Decisions Made
List each decision clearly, with the reasoning captured at the time.

## Features Prioritised
List any features or initiatives discussed, with their priority and rationale.

## Open Questions
Things that were discussed but not resolved.

## Action Items
Who does what by when. Format as: [Owner] — [Action] — [Due date if mentioned]

## Context Snapshot
A brief summary of the roadmap state and key constraints discussed in this meeting.

Be concise and factual. Capture what was actually said, not interpretations.

Transcript:\n\n${prompt}`,
        },
      ],
    })
    setReport(message.content[0].text)
  } catch (err) {
    setError("Something went wrong generating your report. Please try again.")
  } finally {
    setLoading(false)
  }
}

  function saveReport() {
    if (!report || !title) return
    const newReport = {
      id: Date.now(),
      title,
      content: report,
      createdAt: new Date().toLocaleDateString(),
    }
    setSavedReports([newReport, ...savedReports])
    setIsEditing(false)
  }

  function loadReport(saved) {
    setTitle(saved.title)
    setReport(saved.content)
    setPrompt("")
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Roadmap Decision Log</h1>
        <p className="text-muted-foreground">
          Paste your meeting transcript and generate a structured decision log.
        </p>
      </div>

      <div className="mb-6">
        <Textarea
          placeholder="Paste your meeting transcript and generate a structured decision log."
          className="min-h-32 mb-3"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
<Button onClick={generateReport} disabled={!prompt || loading}>
  {loading ? (
  <span className="flex items-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
    Generating...
  </span>
) : "Generate Report"}
</Button>

{error && (
  <p className="text-destructive text-sm mt-2">{error}</p>
)}
      </div>

      {report && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Report <Badge>{isEditing ? "Editing" : "Ready"}</Badge>
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Preview" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-3">
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Give this report a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  className="min-h-64"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                />
                <Button onClick={saveReport} disabled={!title}>
                  Save Report
                </Button>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {savedReports.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Saved Reports</h2>
          <div className="space-y-2">
            {savedReports.map((saved) => (
              <Card
                key={saved.id}
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => loadReport(saved)}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="font-medium">{saved.title}</span>
                  <Badge variant="outline">{saved.createdAt}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}