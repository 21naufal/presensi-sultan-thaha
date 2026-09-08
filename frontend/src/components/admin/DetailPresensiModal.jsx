import React from "react";
import MapPreview from "./MapPreview";

// import icon dari components (reusable, tidak dibuat ulang)
import { PhotoIcon } from "../icons/SystemIcons";

const DetailPresensiModal = ({ data, onClose }) => {
  if (!data) return null;

  // Helper untuk render foto masuk
  const renderFotoMasuk = () => {
    if (data.fotoMasuk) {
      return (
        <img
          src={data.fotoMasuk}
          alt={`Foto Masuk - ${data.nama}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=0984E3&color=fff&size=200`;
          }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Belum presensi masuk</p>
        </div>
      </div>
    );
  };

  // Helper untuk render foto pulang
  const renderFotoPulang = () => {
    if (data.fotoKeluar) {
      return (
        <img
          src={data.fotoKeluar}
          alt={`Foto Pulang - ${data.nama}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama)}&background=0984E3&color=fff&size=200`;
          }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Belum presensi pulang</p>
        </div>
      </div>
    );
  };

  const hasLocation = data.latitude && data.longitude;
  const sudahPresensi = data.jamMasuk && data.jamMasuk !== "-";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] shadow-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="p-5">
          {/* header */}
          <div className="text-left pb-2">
            <h2 className="font-bold text-gray-800 text-sm">
              Detail Presensi Pegawai
            </h2>
          </div>

          {/* info pegawai */}
          <div className="mb-4 text-xs font-medium">
            <div className="flex">
              <span className="text-gray-800 w-25">Nama</span>
              <span className="text-gray-800 font-semibold">: {data.nama}</span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Unit</span>
              <span className="text-gray-800 font-semibold">: {data.unit}</span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Tanggal</span>
              <span className="text-gray-800 font-semibold">
                : {data.tanggal}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Jadwal Shift</span>
              <span className="text-gray-800 font-semibold">
                : {data.waktuShift}{" "}
                {data.namaShift !== "-" && `(${data.namaShift})`}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Jam Masuk</span>
              <span className="text-gray-800 font-semibold">
                : {data.jamMasuk}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Jam Pulang</span>
              <span className="text-gray-800 font-semibold">
                : {data.jamPulang}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-800 w-25">Status | Ket</span>
              <span className="text-gray-800 font-semibold">
                : {data.statusDisplay}
              </span>
            </div>
          </div>

          {/* FOTO PRESENSI - 2 KOLOM (MASUK & PULANG) */}
          {sudahPresensi && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <p className="text-xs font-medium text-gray-800 text-center">
                  Foto Presensi Masuk
                </p>
                <p className="text-xs font-medium text-gray-800 text-center">
                  Foto Presensi Pulang
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Foto Masuk */}
                <div className="w-full h-40 mx-auto overflow-hidden shadow-md border border-gray-200">
                  {renderFotoMasuk()}
                </div>

                {/* Foto Pulang */}
                <div className="w-full h-40 mx-auto overflow-hidden shadow-md border border-gray-200">
                  {renderFotoPulang()}
                </div>
              </div>
            </div>
          )}

          {/* LOKASI DENGAN PETA ASLI */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-800 mb-3">
              Lokasi Presensi
            </p>

            {hasLocation ? (
              <div className="overflow-hidden mb-3 h-40">
                <MapPreview
                  latitude={data.latitude}
                  longitude={data.longitude}
                  onLocationChange={null}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded p-4 text-center">
                <p className="text-xs text-gray-500">
                  Lokasi tidak tersedia
                  {!sudahPresensi && " (pegawai belum presensi)"}
                </p>
              </div>
            )}
          </div>

          {/* button tutup */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2 text-xs bg-[#0984E3] text-white font-semibold rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPresensiModal;
