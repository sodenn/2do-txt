import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";

export function ErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError() as any;
  const message = error.message;

  return (
    <div className="flex h-full w-screen items-center justify-center sm:h-screen">
      <div className="flex max-w-lg items-start gap-4">
        <TriangleAlertIcon className="mt-1 h-8 w-8 flex-shrink-0" />
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">
              {t("Error")}
            </div>
            <div className="text-muted-foreground">
              {t("An error has occurred")}
            </div>
          </div>
          {message && (
            <Alert variant="destructive">
              <AlertTitle>{t("Error message")}</AlertTitle>
              <AlertDescription>
                <code className="select-text">{message}</code>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
