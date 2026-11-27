
type AddButtonProps = {
  children: React.ReactNode
  onClick: () => void
}

export default function AddButton({ children, onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mb-6 cursor-pointer rounded-lg bg-primary px-4 py-2 text-background hover:opacity-80"
    >
      {children}
    </button>
  )
}
