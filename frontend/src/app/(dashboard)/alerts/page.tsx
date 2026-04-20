import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Alert configuration
        </h1>
        <p className="text-base text-slate mt-2">
          Define trigger conditions, severity thresholds, and routing for real-time alerts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-label text-stone">Active rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone py-4">
            No alert rules configured yet. Alert rules will be defined once the
            severity scoring pipeline is operational.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
