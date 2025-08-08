import logoUrl from "../assets/logo-neuroscope.svg";

export default function LoadingScreen() {
  return (
    <div className="loading-screen flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 via-purple-200 to-pink-200 animate-gradient-x relative overflow-hidden">
      {/* Blur Background FX */}
      <div className="fx-wrap pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="fx-blur fx-a"></span>
        <span className="fx-blur fx-b"></span>
        <span className="fx-blur fx-c"></span>
      </div>

      {/* Logo */}
      <img
        src={logoUrl}
        alt="Neuroscope Logo"
        className="w-16 h-16 mb-4 animate-pulse"
        aria-hidden="true"
      />

      {/* Lade-Text */}
      <p className="text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text animate-fade-in">
        Neuroscope lädt...
      </p>
    </div>
  );
}
