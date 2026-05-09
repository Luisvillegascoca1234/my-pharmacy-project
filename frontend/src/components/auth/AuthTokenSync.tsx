import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerGetAccessToken, registerUnauthorizedHandler, registerUserProfile } from "@/api";
import { selectAuthUser, useAuthStore } from "@/modules/auth";

export function AuthTokenSync() {
  const navigate = useNavigate();
  const user = useAuthStore(selectAuthUser);

  useEffect(() => {
    registerGetAccessToken(() => useAuthStore.getState().token);
  }, []);

  useEffect(() => {
    registerUserProfile(user);
  }, [user]);

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      navigate("/logout", { replace: true });
    });
  }, [navigate]);

  return null;
}
