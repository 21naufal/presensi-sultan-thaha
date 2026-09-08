// import icon dari components (reusable, tidak dibuat ulang)
import { EditIcon, WarningIcon, DeleteIcon } from "../icons/SystemIcons";

const ModalConfirm = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "delete",
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "save":
        return (
          <div className="w-16 h-16 border-3 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <EditIcon className="w-8 h-8 text-blue-600" />
          </div>
        );
      case "cancel":
        return (
          <div className="w-16 h-16 border-3 border-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <WarningIcon className="w-8 h-8 text-yellow-500" />
          </div>
        );
      default: // hapus
        return (
          <div className="w-16 h-16 border-3 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <DeleteIcon className="w-8 h-8 text-red-600" />
          </div>
        );
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case "save":
        return {
          confirm: "bg-[#0984E3] hover:bg-[#0975c8] text-white",
          cancel:
            "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
        };
      case "cancel":
        return {
          confirm: "bg-yellow-500 hover:bg-yellow-600 text-white",
          cancel:
            "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
        };
      default:
        return {
          confirm: "bg-red-500 hover:bg-red-600 text-white",
          cancel:
            "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
        {getIcon()}
        <h3 className="text-base font-bold text-gray-800 text-center mb-2">
          {title}
        </h3>
        <p className="text-gray-700 font-medium text-center mb-6 text-sm">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors ${buttonColors.cancel}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors ${buttonColors.confirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
