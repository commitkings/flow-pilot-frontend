import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div className="space-y-1">
        <h1 className={cn(
          "text-xl tracking-tight text-foreground transition-all",
          "font-bold leading-tight",
          "md:text-2xl md:font-black md:leading-none"
        )}>
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground/80 leading-relaxed md:leading-normal">
            {description}
          </p>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}