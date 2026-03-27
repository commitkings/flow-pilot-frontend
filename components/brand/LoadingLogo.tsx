import { Logo } from "@/components/brand/Logo";

export function LoadingLogo() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Logo
        variant="full"
        size="md"
        color="darkblue"
        className="sm:hidden animate-[pulse-scale_1.4s_ease-in-out_infinite]"
      />
      <Logo
        variant="full"
        size="lg"
        color="darkblue"
        className="hidden sm:block animate-[pulse-scale_1.4s_ease-in-out_infinite]"
      />
    </div>
  );
}
