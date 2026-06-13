import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function App() {
  const [prompt, setPrompt] = useState("")

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
        <Button disabled={!prompt}>Generate Report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sample Report <Badge>Draft</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your generated report will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}