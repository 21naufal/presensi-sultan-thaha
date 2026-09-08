import { useState, useRef, useEffect } from "react";

// import icon
import { CloseIcon } from "../../components/icons/SystemIcons";

const ModalVerifikasiOTP = ({
  isOpen,
  onClose,
  onSubmit,
  email,
  loading,
  error: externalError,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  // sembunyikan tampilan email
  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    const maskedUsername = username[0] + "***" + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  };

  // auto focus ke input pertama saat modal terbuka
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  // reset error dan OTP saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setOtp(["", "", "", "", "", ""]);
      setShake(false);
    }
  }, [isOpen]);

  // handle error dari parent
  useEffect(() => {
    if (externalError) {
      setError(externalError);
      setShake(true);
      // hentikan animasi shake setelah 500ms
      setTimeout(() => setShake(false), 500);
      // auto clear error setelah 5 detik
      setTimeout(() => setError(""), 5000);
    }
  }, [externalError]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    // hanya terima angka
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // clear error saat user mulai mengetik
    if (error) {
      setError("");
      setShake(false);
    }

    // auto focus ke input berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // backspace fokus ke input sebelumnya
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });

    setOtp(newOtp);

    // clear error
    if (error) {
      setError("");
      setShake(false);
    }

    // focus ke input terakhir yang terisi
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const kodeOTP = otp.join("");

    if (kodeOTP.length !== 6) {
      setError("Kode OTP harus 6 digit");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    onSubmit(kodeOTP);
  };

  // fungsi untuk resend OTP
  const handleResendOTP = () => {
    // Clear OTP
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setShake(false);
    // focus ke input pertama
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="bg-white border-1 border-gray-100 shadow-2xl rounded-xl max-w-md w-full p-6 relative">
        {/* tombol close */}
        <button onClick={onClose} className="absolute top-5 right-5">
          <CloseIcon />
        </button>

        {/* header */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            Verifikasi Kode OTP
          </h2>
          <p className="text-sm text-gray-800 mt-1">
            Masukan kode OTP yang telah kami kirimkan ke{" "}
            <strong>{maskEmail(email)}</strong> untuk mereset kata sandi lama
            anda
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* input OTP 6 digit */}
          <div>
            <label className="block text-sm font-medium mb-3">Kode OTP</label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`w-12 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:border-[#0984E3] disabled:bg-gray-100 transition-all ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs text-center mt-2 ${
                error ? "text-red-500" : "text-gray-500"
              }`}
            >
              {error || "Masukkan 6 digit kode yang dikirim ke email Anda"}
            </p>
          </div>

          {/* tombol verifikasi */}
          <button
            type="submit"
            disabled={loading || otp.some((d) => d === "")}
            className="w-full bg-[#0984E3] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Memverifikasi...</span>
              </>
            ) : (
              "Verifikasi Kode OTP"
            )}
          </button>

          {/* tombol kirim ulang OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm text-[#0984E3] hover:underline font-medium disabled:opacity-50"
            >
              Kirim ulang kode OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalVerifikasiOTP;
