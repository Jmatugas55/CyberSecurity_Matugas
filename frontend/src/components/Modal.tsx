import { CheckCircle, XCircle } from "lucide-react"

interface Props {
  open: boolean
  type: "success" | "error"
  message: string
  onClose: () => void
}

export default function Modal({ open, type, message, onClose }: Props) {

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

      <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-xl text-center">

        <div className="flex justify-center mb-4">

          {type === "success" ? (
            <CheckCircle className="text-green-500 w-14 h-14" />
          ) : (
            <XCircle className="text-red-500 w-14 h-14" />
          )}

        </div>

        <h2 className="text-xl font-semibold mb-2">
          {type === "success" ? "Success" : "Error"}
        </h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          OK
        </button>

      </div>

    </div>
  )
}