import { useLayoutEffect, useRef } from "react";
import { selectAuthUser, useAuthStore } from "@/modules/auth";
import { resetSessionScopedState } from "@/modules/auth/utils/resetSessionScopedState";

export function SessionScopedStateReset() {
  const user = useAuthStore(selectAuthUser);
  const previousSessionKey = useRef<string | null | undefined>(undefined);
  const sessionKey = user ? `${user.id}:${user.role.name}` : null;

  useLayoutEffect(() => {
    if (previousSessionKey.current === undefined) {
      previousSessionKey.current = sessionKey;
      return;
    }

    if (previousSessionKey.current !== sessionKey) {
      resetSessionScopedState();
      previousSessionKey.current = sessionKey;
    }
  }, [sessionKey]);

  return null;
}
