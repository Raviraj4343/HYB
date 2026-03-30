import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  'data-left-icon'?: boolean;
  'data-right-icon'?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const hasLeft = !!(props as any)["data-left-icon"];
    const hasRight = !!(props as any)["data-right-icon"];

    // remove internal data attrs before spreading to DOM
    const forwardedProps = { ...props } as any;
    delete forwardedProps["data-left-icon"];
    delete forwardedProps["data-right-icon"];

    const iconPadding = `${hasLeft ? 'pl-11' : ''} ${hasRight ? 'pr-11' : ''}`.trim();

    // enforce minimum inline padding so icons never overlap text (overrides class order)
    const enforcedStyle: React.CSSProperties = {};
    if (hasLeft) enforcedStyle.paddingLeft = enforcedStyle.paddingLeft || '44px';
    if (hasRight) enforcedStyle.paddingRight = enforcedStyle.paddingRight || '44px';
    const mergedStyle = { ...(forwardedProps.style || {}), ...enforcedStyle };
    if (Object.keys(mergedStyle).length) forwardedProps.style = mergedStyle;

    return (
      <input
        type={type}
        className={cn(
          "flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground leading-none ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          iconPadding,
          className,
        )}
        ref={ref}
        {...forwardedProps}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
