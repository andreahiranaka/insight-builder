import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export default function App() {
  const [prompt, setPrompt] = useState("")
  const [report, setReport] = useState("")
  const [loading, setLoading] = useState(false)

  async function generateReport() {
    setLoading(true)
    setReport("")

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert business analyst. Generate a structured insight report for the following situation:\n\n${prompt}`,
        },
      ],
    })

    setReport(message.content[0].text)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Insight Builder</h1>
        <p className="text-muted-foreground">
          Describe a business situation and generate an AI-powered insight report.
        </p>
      </div>

      <div className="mb-4">
        <Textarea
          placeholder="Describe the situation you want to analyse..."
          className="min-h-32 mb-3"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button onClick={generateReport} disabled={!prompt || loading}>
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Report <Badge>{report ? "Ready" : "Waiting"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report ? (
            <p className="whitespace-pre-wrap">{report}</p>
          ) : (
            <p className="text-muted-foreground">
              Your generated report will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}