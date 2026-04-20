import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AMBASSADORS = [
  { name: "Amitabh Bachchan", region: "Global", priority: "Critical" },
  { name: "Katrina Kaif", region: "North/West India", priority: "Critical" },
  { name: "Manju Warrier", region: "Kerala", priority: "Critical" },
  { name: "Nagarjuna Akkineni", region: "Telugu states", priority: "High" },
  { name: "Shivarajkumar", region: "Karnataka", priority: "High" },
  { name: "Prabhu Ganesan", region: "Tamil Nadu", priority: "High" },
];

function priorityColor(p: string) {
  if (p === "Critical") return "bg-ochre/10 text-ochre border-ochre/20";
  return "bg-stone/10 text-stone border-stone/20";
}

export default function AmbassadorsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Ambassador reputation tracker
        </h1>
        <p className="text-base text-slate mt-2">
          Monitoring brand ambassador signals across social and press.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AMBASSADORS.map((amb) => (
          <Card key={amb.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">
                  {amb.name}
                </CardTitle>
                <Badge className={priorityColor(amb.priority)}>
                  {amb.priority}
                </Badge>
              </div>
              <p className="text-meta text-stone">{amb.region}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone">
                Sentiment and mention tracking pending data pipeline.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-stone">
            Upcoming: reputation risk modelling across ambassador portfolio —{" "}
            <Badge variant="outline" className="text-label">
              Phase 2
            </Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
