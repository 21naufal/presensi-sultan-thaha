import { useNavigate } from "react-router-dom";

const ModalSukses = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleKembali = () => {
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="bg-white border-1 border-gray-100 shadow-2xl rounded-xl max-w-md w-full p-6 relative">
        {/* Icon sukses */}
        <div className="flex items-center justify-center mb-1">
          <img
            src="/assets/icons/sukses.svg"
            alt="sukses"
            className="w-40 h-40"
          />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Kata sandi berhasil diubah!
        </h2>
        <p className="text-sm text-center mb-6">
          Silakan Masuk dengan kata sandi baru
        </p>

        {/* Tombol kembali */}
        <button
          onClick={handleKembali}
          className="w-full bg-[#0984E3] text-white py-3 rounded-lg font-semibold hover:bg-[#076ab6] transition-colors"
        >
          Kembali ke Halaman Masuk
        </button>
      </div>
    </div>
  );
};

export default ModalSukses;
