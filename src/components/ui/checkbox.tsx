import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from "react";

import { cn } from "@/utils/tw-utils";
import { CheckIcon } from "lucide-react";

export type CheckboxProps = ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
>;

const Checkbox = forwardRef<
  ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4 shrink-0 rounded-sm border shadow-sm transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("relative flex items-center justify-center text-current")}
    >
      <CheckIcon className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
