const PhotoUploadModal = ({ open, onClose, onGaleri, onKamera }) => {
  // jika modal tidak dibuka, jangan render apapun
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <h3 className="text-lg font-semibold text-center">Foto Profil</h3>
          <p className="text-xs text-gray-500 text-center mb-6">
            Format JPG/PNG, Maksimal 5 MB
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            {/* pilih dari galeri */}
            <button
              onClick={onGaleri}
              className="w-full py-3 bg-[#0984E3] text-white font-semibold rounded-xl"
            >
              Galeri
            </button>

            {/* ambil dari kamera */}
            <button
              onClick={onKamera}
              className="w-full py-3 bg-[#0984E3] text-white font-semibold rounded-xl"
            >
              Kamera
            </button>

            {/* batal */}
            <button
              onClick={onClose}
              className="w-full py-3 border-1 border-[#0984E3] text-[#0984E3] font-semibold rounded-xl"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
