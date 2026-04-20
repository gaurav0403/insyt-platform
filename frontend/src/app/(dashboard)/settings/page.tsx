import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Settings
        </h1>
        <p className="text-base text-slate mt-2">
          Platform configuration and source management.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-label text-stone">
            Configuration
            <Badge variant="outline" className="ml-2 text-label">
              Phase 2
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone">
            Settings management will be available in the full POC. Source
            configuration, alert routing, and user management controls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
