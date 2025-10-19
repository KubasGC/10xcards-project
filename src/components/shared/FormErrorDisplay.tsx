interface FormErrorDisplayProps {
  error?: string;
  className?: string;
}

export function FormErrorDisplay({ error, className = "" }: FormErrorDisplayProps) {
  if (!error) return null;

  return <p className={`text-sm text-red-600 ${className}`}>{error}</p>;
}
