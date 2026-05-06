import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegionalPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Regional language intelligence
        </h1>
        <p className="text-base text-slate mt-2">
          Vernacular press coverage with English translation and sentiment analysis.
        </p>
      </div>

      <Tabs defaultValue="malayalam">
        <TabsList>
          <TabsTrigger value="malayalam">Malayalam</TabsTrigger>
          <TabsTrigger value="tamil">Tamil</TabsTrigger>
          <TabsTrigger value="hindi">Hindi</TabsTrigger>
          <TabsTrigger value="kannada" disabled>
            Kannada
            <Badge variant="outline" className="ml-1.5 text-label">
              Phase 2
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="telugu" disabled>
            Telugu
            <Badge variant="outline" className="ml-1.5 text-label">
              Phase 2
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="malayalam" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-label text-stone">
                Malayalam coverage — Manorama, Mathrubhumi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate">
                Malayalam press ingestion will be configured on Day 2. Target:
                20+ real mentions from Manorama and Mathrubhumi.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tamil" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-label text-stone">
                Tamil coverage — Dinamalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate">
                Tamil press ingestion pending. Target: 10+ mentions from Dinamalar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hindi" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-label text-stone">
                Hindi coverage — Dainik Jagran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate">
                Hindi press ingestion pending. Target: 10+ mentions from Dainik Jagran.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
