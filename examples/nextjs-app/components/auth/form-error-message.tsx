import { Icons } from "@/components/icons";

type FormErrorMessageProps = {
  error?: string | null;
};

export function FormErrorMessage({ error }: FormErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-md flex items-center gap-3 text-sm shadow-sm animate-in fade-in-0 slide-in-from-top-1"
      role="alert"
    >
      <Icons.circleAlert className="size-4 shrink-0" />
      <p>{error}</p>
    </div>
  );
}
