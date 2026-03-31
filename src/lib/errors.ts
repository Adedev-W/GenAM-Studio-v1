export type ErrorCode =
  | "API_KEY_NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface AppError {
  code: ErrorCode;
  title: string;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function parseApiError(status: number, body?: any): AppError {
  const msg = body?.error || body?.message || "";

  switch (status) {
    case 401:
      return {
        code: "UNAUTHORIZED",
        title: "Sesi Berakhir",
        message: "Sesi kamu telah berakhir. Silakan login ulang untuk melanjutkan.",
        action: { label: "Login Ulang", href: "/login" },
      };
    case 403:
      return {
        code: "FORBIDDEN",
        title: "Akses Ditolak",
        message: "Kamu tidak memiliki izin untuk mengakses resource ini.",
      };
    case 404:
      return {
        code: "NOT_FOUND",
        title: "Tidak Ditemukan",
        message: msg || "Resource yang diminta tidak ditemukan.",
      };
    case 503:
      if (body?.code === "API_KEY_NOT_CONFIGURED" || msg.toLowerCase().includes("not configured")) {
        return {
          code: "API_KEY_NOT_CONFIGURED",
          title: "API Key Belum Dikonfigurasi",
          message: "API key belum diatur. Konfigurasi API key terlebih dahulu untuk menggunakan fitur AI.",
          action: { label: "Atur API Key", href: "/settings" },
        };
      }
      return {
        code: "SERVICE_UNAVAILABLE",
        title: "Layanan Tidak Tersedia",
        message: "Layanan sedang tidak tersedia. Coba lagi dalam beberapa saat.",
      };
    case 400:
      if (msg.toLowerCase().includes("not configured")) {
        return {
          code: "API_KEY_NOT_CONFIGURED",
          title: "API Key Belum Dikonfigurasi",
          message: "API key belum diatur. Konfigurasi API key terlebih dahulu untuk menggunakan fitur AI.",
          action: { label: "Atur API Key", href: "/settings" },
        };
      }
      return {
        code: "VALIDATION_ERROR",
        title: "Data Tidak Valid",
        message: msg || "Data yang dikirim tidak valid. Periksa kembali input kamu.",
      };
    default:
      if (status >= 500) {
        return {
          code: "SERVER_ERROR",
          title: "Kesalahan Server",
          message: msg || "Terjadi kesalahan pada server. Coba lagi nanti.",
        };
      }
      return {
        code: "UNKNOWN",
        title: "Terjadi Kesalahan",
        message: msg || "Terjadi kesalahan yang tidak diketahui.",
      };
  }
}

export function parseNetworkError(): AppError {
  return {
    code: "NETWORK_ERROR",
    title: "Koneksi Gagal",
    message: "Tidak dapat terhubung ke server. Periksa koneksi internet kamu dan coba lagi.",
  };
}
