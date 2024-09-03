import { cn } from "@/utils/tw-utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  createContext,
  Dispatch,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
  Ref,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

const listVariants = cva("my-1 flex flex-col", {
  variants: {
    variant: {
      default: "",
      outline: "border rounded-md shadow-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const listItemVariants = cva(
  "flex w-full items-center gap-3 sm:gap-4 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:[&:has(button[role='checkbox']:hover)]:bg-transparent sm:[&:has(button[role='button']:hover)]:bg-transparent [&[role='button']]:sm:hover:bg-muted relative",
  {
    variants: {
      variant: {
        default: "rounded-md",
        outline: "",
      },
      selected: {
        true: "bg-accent text-accent-foreground",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ListProps
  extends HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

const ListContext = createContext<{
  variant: ListProps["variant"];
  setVariant: Dispatch<SetStateAction<ListProps["variant"]>>;
  // @ts-expect-error
}>(undefined);

function ListProvider({
  children,
  variant: variantProp,
}: PropsWithChildren<{ variant: ListProps["variant"] }>) {
  const [variant, setVariant] = useState<typeof variantProp>(
    variantProp || "default",
  );

  useEffect(() => {
    setVariant(variantProp);
  }, [variantProp]);

  return (
    <ListContext.Provider value={{ variant, setVariant }}>
      {children}
    </ListContext.Provider>
  );
}

function useList() {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useList must be used within a ListProvider");
  }
  return context;
}

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant, ...props }, ref) => (
    <ListProvider variant={variant}>
      <ul
        ref={ref}
        className={cn(listVariants({ variant, className }))}
        {...props}
      />
    </ListProvider>
  ),
);
List.displayName = "List";

interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  clickable?: boolean;
  buttonRef?: Ref<HTMLDivElement>;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      selected,
      clickable = true,
      buttonRef,
      className,
      startAdornment,
      endAdornment,
      children,
      ...props
    },
    ref,
  ) => {
    const { variant } = useList();
    return (
      <li className="list-none" ref={ref}>
        <div
          role={clickable ? "button" : undefined}
          ref={buttonRef}
          tabIndex={0}
          className={cn(
            listItemVariants({ variant, className, selected }),
            startAdornment && "pl-8",
            endAdornment && "pr-8",
          )}
          {...props}
        >
          {startAdornment}
          {children}
          {endAdornment}
        </div>
      </li>
    );
  },
);
ListItem.displayName = "ListItem";

export const StartAdornment = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "absolute bottom-0 left-1 top-0 inline-flex items-center",
      className,
    )}
    {...props}
    ref={ref}
  />
));
StartAdornment.displayName = "StartAdornment";

export const EndAdornment = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "absolute bottom-0 right-1 top-0 inline-flex items-center",
      className,
    )}
    {...props}
    ref={ref}
  />
));
EndAdornment.displayName = "EndAdornment";

export const ListItemText = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 text-left", className)} {...props} />
));
ListItemText.displayName = "ListItemText";

export const ListItemPrimaryText = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
ListItemPrimaryText.displayName = "ListItemPrimaryText";

export const ListItemSecondaryText = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("truncate text-sm text-muted-foreground", className)}
    {...props}
  />
));
ListItemSecondaryText.displayName = "ListItemSecondaryText";
