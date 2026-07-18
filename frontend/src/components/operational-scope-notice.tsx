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
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{canSupervise ? supervisionDescription : ownRecordsDescription}</p>
      </div>
      <Badge className="w-fit shrink-0" variant={canSupervise ? "default" : "secondary"}>
        {canSupervise ? "Supervisión administrativa" : "Solo registros propios"}
      </Badge>
    </div>
  );
}

export function SupervisionOnly({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  return allowed ? children : null;
}
