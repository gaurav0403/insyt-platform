import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActionsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Action drafting
        </h1>
        <p className="text-base text-slate mt-2">
          AI-generated response drafts for crisis and communication scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { type: "SEBI Disclosure", desc: "Regulation 30 material event draft" },
          { type: "Social Mirror", desc: "Misinformation counter-response" },
          { type: "Press Statement", desc: "Official media clarification" },
          { type: "Internal Note", desc: "CEO/CMO briefing document" },
          { type: "Journalist Clarification", desc: "Targeted press response" },
        ].map((action) => (
          <Card key={action.type}>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {action.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone">{action.desc}</p>
              <p className="text-meta text-stone mt-3">
                Available after analysis pipeline
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
