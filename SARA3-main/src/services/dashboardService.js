export async function getAdminDashboardData() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // ¡Agregamos la URL de Railway aquí!
  const response = await fetch("https://sara2backend-production.up.railway.app/api/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
        data.message || "No fue posible cargar el dashboard administrativo.",
    );
  }

  return data;
}