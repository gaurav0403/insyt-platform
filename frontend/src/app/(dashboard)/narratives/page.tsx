import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NarrativesPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-parchment min-h-full">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          The Kalyan narrative, Q1 FY26
        </h1>
        <p className="text-base text-slate mt-2">
          Ninety days of public signal, clustered by theme and trajectory.
        </p>
      </div>

      <div className="grid gap-4">
        {[
          "Narrative clustering will appear here once the analysis pipeline processes the ingested mentions.",
        ].map((msg, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-label text-stone">
                Pending analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate leading-relaxed">{msg}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
