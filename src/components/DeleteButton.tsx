'use client';

interface Props {
  label: string;
  confirmMessage: string;
  className?: string;
}

export default function DeleteButton({ label, confirmMessage, className }: Props) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <button type="submit" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
