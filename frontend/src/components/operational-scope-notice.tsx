import { type ReactNode } from "react";
import { ShieldCheck, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OperationalScopeNoticeProps = {
  canSupervise: boolean;
  ownRecordsDescription: string;
  supervisionDescription: string;
};

export function OperationalScopeNotice({
  canSupervise,
  ownRecordsDescription,
  supervisionDescription
}: OperationalScopeNoticeProps) {
  const Icon = canSupervise ? ShieldCheck : UserRoundCheck;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-info/20 bg-info/6 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info"><Icon aria-hidden="true" className="size-4" /></span>
        <p className="text-sm text-muted-foreground">{canSupervise ? supervisionDescription : ownRecordsDescription}</p>
      </div>
      <Badge className="w-fit shrink-0" variant={canSupervise ? "default" : "secondary"}>
        {canSupervise ? "Vista del equipo" : "Solo registros propios"}
      </Badge>
    </div>
  );
}

export function SupervisionOnly({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  return allowed ? children : null;
}
