import React from "react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`toast fixed left-1/2 bottom-20 transform -translate-x-1/2 rounded-lg px-5 py-3 text-white font-medium ${
        toast.type === "success" ? "bg-green-600" : "bg-red-600"
      } shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      {toast.msg}
    </div>
  );
}
