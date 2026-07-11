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
  const [activeTab, setActiveTab] = useState("current")
  const [error, setError] = useState("")
  const [viewingPast, setViewingPast] = useState(false)
  const [search, setSearch] = useState("")
  const [savedReports, setSavedReports] = useState(() => {
    const stored = localStorage.getItem("decision-logs")
    return stored ? JSON.parse(stored) : []
  })

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setPrompt(event.target.result)
    }
    reader.readAsText(file)
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(savedReports, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decision-logs-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importLogs(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        const merged = [...imported, ...savedReports].filter(
          (report, index, self) =>
            index === self.findIndex((r) => r.id === report.id)
        )
        setSavedReports(merged)
        localStorage.setItem("decision-logs", JSON.stringify(merged))
      } catch {
        alert("Invalid file. Please upload a valid decision logs JSON file.")
      }
    }
    reader.readAsText(file)
  }

  async function generateReport() {
    setLoading(true)
    setReport("")
    setError("")
    setIsEditing(false)
    setViewingPast(false)
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    setTitle(`Decision Log · ${today}`)

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
      setActiveTab("current")
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
    const updated = [newReport, ...savedReports]
    setSavedReports(updated)
    localStorage.setItem("decision-logs", JSON.stringify(updated))
    setViewingPast(true)
    setIsEditing(false)
  }

  function loadReport(saved) {
    setTitle(saved.title)
    setReport(saved.content)
    setPrompt("")
    setIsEditing(false)
    setViewingPast(true)
    setActiveTab("current")
  }

  const filteredReports = savedReports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Roadmap Decision Log</h1>
        <p className="text-muted-foreground">
          Paste or upload a meeting transcript to generate a structured decision log.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Meeting transcript</label>
          <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            Upload file
            <input
              type="file"
              accept=".txt,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
        <Textarea
          placeholder="Paste your meeting transcript here, or upload a file above..."
          className="min-h-32 mb-3"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button onClick={generateReport} disabled={!prompt || loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Report"
          )}
        </Button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>

      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "current" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("current")}
        >
          {viewingPast ? `Viewing: ${title}` : "Current Report"}
        </button>
        <button
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "log" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("log")}
        >
          Log{" "}
          {savedReports.length > 0 && (
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {savedReports.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "current" && (
        <>
          {report ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-base">{title}</span>
                    <Badge>{viewingPast ? "Saved" : "New"}</Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    {!viewingPast && !isEditing && (
                      <Button onClick={saveReport}>Save to Log</Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Preview" : "Edit"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Give this report a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <Button onClick={saveReport} disabled={!title}>
                        Save
                      </Button>
                    </div>
                    <Textarea
                      className="min-h-64"
                      value={report}
                      onChange={(e) => setReport(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {report}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">
              Your decision log will appear here after generation.
            </p>
          )}
        </>
      )}

      {activeTab === "log" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Search logs by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" onClick={exportLogs}>
              Export
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>Import</span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importLogs}
              />
            </label>
          </div>
          {filteredReports.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {search ? "No logs match your search." : "No saved reports yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((saved) => (
                <Card
                  key={saved.id}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => loadReport(saved)}
                >
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{saved.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Click to open
                      </p>
                    </div>
                    <Badge variant="outline">{saved.createdAt}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}