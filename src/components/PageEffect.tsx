import { useSearchParamsEffect } from "@/utils/useSearchParamsEffect";
import { useTaskEffect } from "@/utils/useTaskEffect";

export function PageEffect() {
  useSearchParamsEffect();
  useTaskEffect();
  return null;
}
