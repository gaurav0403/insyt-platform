import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompetitivePage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Competitive landscape
        </h1>
        <p className="text-base text-slate mt-2">
          Kalyan vs. Tanishq vs. Malabar — narrative positioning and share of voice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Kalyan Jewellers", "Tanishq", "Malabar Gold"].map((brand) => (
          <Card key={brand}>
            <CardHeader>
              <CardTitle className="font-display text-xl">{brand}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone">
                Narrative analysis pending. Data ingestion in progress.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
