import { useMemo, useState, useEffect } from "react";
import ModuleHeader from "../../components/admin/modules/ModuleHeader";
import ModuleToolbar from "../../components/admin/modules/ModuleToolbar";
import ModuleStatus from "../../components/admin/modules/ModuleStatus";
import EmptyState from "../../components/admin/modules/EmptyState";
import { apiFetch } from "../../utils/api";
import "./AdminModules.css";

function downloadCsv(rows) {
  const headers = [
    "Hora",
    "Usuario",
    "Matricula",
    "Movimiento",
    "Lector",
    "Estado",
  ];

  const lines = rows.map((item) => [
    item.time,
    item.name,
    item.enrollment,
    item.movement,
    item.reader,
    item.status,
  ]);

  const csv = [headers, ...lines]
      .map((row) =>
          row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "accesos-sara.csv";
  anchor.click();

  URL.revokeObjectURL(url);
}

function Accesses() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [movement, setMovement] = useState("all");

  // Nuevos estados para los datos reales
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    dentroAhora: 0,
    accesosHoy: 0,
    accesosDenegados: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de la API al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Hacemos ambas peticiones al mismo tiempo
        const [statsData, historyData] = await Promise.all([
          apiFetch("/api/accesos/estadisticas"),
          apiFetch("/api/accesos/historial")
        ]);

        setStats(statsData);
        setRecords(historyData.accesos || []);
      } catch (error) {
        console.error("Error al cargar los datos de accesos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const query = search.trim().toLowerCase();

      // Prevención por si la API devuelve campos nulos
      const itemName = item.name ? item.name.toLowerCase() : "";
      const itemEnrollment = item.enrollment ? item.enrollment.toLowerCase() : "";

      const matchesSearch =
          itemName.includes(query) || itemEnrollment.includes(query);

      const matchesStatus =
          status === "all" || (item.status && item.status.toLowerCase() === status);

      const matchesMovement =
          movement === "all" || (item.movement && item.movement.toLowerCase() === movement);

      return matchesSearch && matchesStatus && matchesMovement;
    });
  }, [search, status, movement, records]);

  return (
      <section className="module-page">
        <ModuleHeader
            eyebrow="Monitoreo"
            title="Control de accesos"
            description="Consulta entradas, salidas e intentos de acceso registrados por los lectores."
            actionLabel="Exportar CSV"
            onAction={() => downloadCsv(filteredRecords)}
        />

        <div className="module-summary-grid">
          <article>
            <span>Dentro ahora</span>
            <strong>{isLoading ? "-" : stats.dentroAhora}</strong>
            <small>Usuarios registrados</small>
          </article>

          <article>
            <span>Accesos hoy</span>
            <strong>{isLoading ? "-" : stats.accesosHoy}</strong>
            <small>Entradas y salidas</small>
          </article>

          <article>
            <span>Accesos denegados</span>
            <strong>{isLoading ? "-" : stats.accesosDenegados}</strong>
            <small>Requieren revisión</small>
          </article>
        </div>

        <div className="module-card">
          <ModuleToolbar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Buscar nombre o matrícula"
              filter={status}
              onFilter={setStatus}
              filterOptions={[
                { value: "permitido", label: "Permitidos" },
                { value: "denegado", label: "Denegados" },
              ]}
              secondaryFilter={movement}
              onSecondaryFilter={setMovement}
              secondaryOptions={[
                { value: "entrada", label: "Entradas" },
                { value: "salida", label: "Salidas" },
              ]}
          />

          {isLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                Cargando accesos...
              </div>
          ) : filteredRecords.length > 0 ? (
              <div className="module-table-wrapper">
                <table className="module-table">
                  <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Usuario</th>
                    <th>Matrícula</th>
                    <th>Movimiento</th>
                    <th>Lector</th>
                    <th>Estado</th>
                  </tr>
                  </thead>

                  <tbody>
                  {filteredRecords.map((item) => (
                      <tr key={item.id}>
                        <td>{item.time}</td>
                        <td>{item.name || "Desconocido"}</td>
                        <td>{item.enrollment || "N/A"}</td>
                        <td>{item.movement}</td>
                        <td>{item.reader}</td>
                        <td>
                          <ModuleStatus value={item.status} />
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <EmptyState message="No hay accesos que coincidan con los filtros." />
          )}
        </div>
      </section>
  );
}

export default Accesses;