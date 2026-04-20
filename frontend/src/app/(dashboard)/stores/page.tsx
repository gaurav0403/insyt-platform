import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PILOT_STORES = [
  { city: "Thrissur", state: "Kerala", type: "Flagship" },
  { city: "Kochi", state: "Kerala", type: "Metro" },
  { city: "Trivandrum", state: "Kerala", type: "Metro" },
  { city: "Chennai", state: "Tamil Nadu", type: "Metro" },
  { city: "Bengaluru", state: "Karnataka", type: "Metro" },
  { city: "Hyderabad", state: "Telangana", type: "Metro" },
  { city: "Mumbai", state: "Maharashtra", type: "Metro" },
  { city: "Delhi", state: "Delhi", type: "Metro" },
  { city: "Kolkata", state: "West Bengal", type: "Metro" },
  { city: "Ahmedabad", state: "Gujarat", type: "Tier 1" },
];

export default function StoresPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Store-level intelligence
        </h1>
        <p className="text-base text-slate mt-2">
          Review sentiment and customer signals across pilot locations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PILOT_STORES.map((store) => (
          <Card key={store.city}>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">
                {store.city}
              </CardTitle>
              <p className="text-meta text-stone">
                {store.state} — {store.type}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone">
                Google Reviews monitoring pending setup.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-stone">
            250+ additional stores —{" "}
            <Badge variant="outline" className="text-label">
              Phase 2 expansion
            </Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
