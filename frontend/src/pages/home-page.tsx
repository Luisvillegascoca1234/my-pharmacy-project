import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHealthStatus } from "../modules/health";

const stackItems = [
  { name: "API", detail: "Express service", state: "Ready", icon: Server },
  { name: "Database", detail: "PostgreSQL storage", state: "Ready", icon: Database },
  { name: "Contracts", detail: "Zod shared schemas", state: "Ready", icon: ShieldCheck }
];

const activityRows = [
  { event: "Frontend shell", owner: "UI", status: "Updated" },
  { event: "Component registry", owner: "shadcn/ui", status: "Installed" },
  { event: "Health endpoint", owner: "Backend", status: "Monitored" }
];

export function HomePage() {
  const health = useHealthStatus();
  const isOnline = health.status === "success";
  const readiness = isOnline ? 100 : health.status === "loading" ? 56 : 32;

  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <Badge variant="secondary">Foundation dashboard</Badge>
            <CardTitle className="text-2xl sm:text-3xl">Pharmacy POS workspace</CardTitle>
            <CardDescription className="max-w-2xl">
              A shadcn/ui control surface for the current frontend, backend, database, and shared contracts.
            </CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Refresh status" size="icon" variant="outline">
                  <RefreshCw aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh status</TooltipContent>
            </Tooltip>
            <Button>
              <PackageCheck aria-hidden="true" />
              Components ready
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {stackItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.name} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-4" />
                    {item.name}
                  </CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline">{item.state}</Badge>
                  <Switch checked disabled aria-label={`${item.name} readiness`} />
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Operational overview</CardTitle>
            <CardDescription>Installed UI components powering the main workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="status">
              <TabsList>
                <TabsTrigger value="status">
                  <Activity aria-hidden="true" />
                  Status
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Layers3 aria-hidden="true" />
                  Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent className="space-y-4" value="status">
                <HealthAlert status={health.status} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Workspace readiness</span>
                    <Badge variant={isOnline ? "default" : "secondary"}>{readiness}%</Badge>
                  </div>
                  <Progress value={readiness} />
                </div>
                {health.status === "loading" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : null}
              </TabsContent>
              <TabsContent value="activity">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityRows.map((row) => (
                      <TableRow key={row.event}>
                        <TableCell>{row.event}</TableCell>
                        <TableCell>{row.owner}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend health</CardTitle>
            <CardDescription>Live response from the health endpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>FE</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>API</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>DB</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>3</AvatarGroupCount>
            </AvatarGroup>
            <Separator />
            <HealthDetails
              status={health.status}
              error={health.error ?? undefined}
              version={health.data?.version}
              timestamp={health.data?.timestamp}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

type HealthStatus = ReturnType<typeof useHealthStatus>["status"];

type HealthAlertProps = {
  status: HealthStatus;
};

function HealthAlert({ status }: HealthAlertProps) {
  if (status === "success") {
    return (
      <Alert>
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Backend online</AlertTitle>
        <AlertDescription>The frontend is receiving a valid service response.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Backend unavailable</AlertTitle>
        <AlertDescription>Start the API service and check the configured base URL.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Clock3 aria-hidden="true" />
      <AlertTitle>Checking backend</AlertTitle>
      <AlertDescription>Waiting for the health endpoint response.</AlertDescription>
    </Alert>
  );
}

type HealthDetailsProps = {
  status: HealthStatus;
  error?: string;
  version?: string;
  timestamp?: string;
};

function HealthDetails({ status, error, version, timestamp }: HealthDetailsProps) {
  return (
    <Accordion defaultValue="service" type="single" collapsible>
      <AccordionItem value="service">
        <AccordionTrigger>Service state</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <Badge variant={status === "error" ? "destructive" : "secondary"}>{status}</Badge>
            <p className="text-sm text-muted-foreground">{error ?? `Version ${version ?? "pending"}`}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="timestamp">
        <AccordionTrigger>Last response</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground">{timestamp ?? "No timestamp received yet."}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
