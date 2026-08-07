export async function getAdminDashboardData() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const response = await fetch("/api/dashboard/summary", {
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