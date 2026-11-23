
type AddButtonProps = {
  children: React.ReactNode
  onClick: () => void
}

export default function AddButton({ children, onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mb-6 cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
    >
      {children}
    </button>
  )
}
