import { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import ModuleHeader from "../../components/admin/modules/ModuleHeader";
import ModuleToolbar from "../../components/admin/modules/ModuleToolbar";
import AdminModal from "../../components/admin/modules/AdminModal";
import ConfirmDialog from "../../components/admin/modules/ConfirmDialog";
import ModuleStatus from "../../components/admin/modules/ModuleStatus";
import EmptyState from "../../components/admin/modules/EmptyState";
import CalendarView from "../../components/admin/modules/CalendarView";
import "./AdminModules.css";

const emptyForm = {
  cubicle_id: "",
  user_id: "",
  reservation_date: "",
  start_time: "",
  end_time: "",
  purpose: "Estudio académico",
  number_of_people: 1,
};

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState("calendar");

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await apiFetch("https://sara2backend-production.up.railway.app/api/reservations");
        if (response.ok) {
          const data = await response.json();
          setReservations(data.reservations ?? data.reservaciones ?? []);
        } else {
          setReservations([]);
        }
      } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        setReservations([]);
      }
    };
    fetchReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const query = search.trim().toLowerCase();
      const roomStr = item.room?.toLowerCase() || "";
      const userStr = item.user?.toLowerCase() || "";
      const statusStr = item.status?.toLowerCase() || "";

      const matchesSearch = roomStr.includes(query) || userStr.includes(query);
      const matchesStatus = status === "all" || statusStr === status;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveReservation = async (event) => {
    event.preventDefault();
    try {
      // Estructura exacta que espera el DTO ReservationCreate de FastAPI
      const payload = {
        cubicle_id: Number(form.cubicle_id),
        user_id: form.user_id ? Number(form.user_id) : null,
        reservation_date: form.reservation_date,
        start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
        end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
        purpose: form.purpose,
        number_of_people: Number(form.number_of_people),
      };

      const response = await apiFetch("https://sara2backend-production.up.railway.app/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Recargamos la lista de reservas para ver reflejado el cambio
        const updatedRes = await apiFetch("https://sara2backend-production.up.railway.app/api/reservations");
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setReservations(data.reservations ?? []);
        }
        alert("Reserva creada correctamente.");
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`No se pudo guardar la reserva: ${errData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al guardar reserva:", error);
      alert("Error de conexión al intentar guardar la reserva.");
    } finally {
      setForm(emptyForm);
      setIsFormOpen(false);
    }
  };

  const confirmCancellation = async () => {
    if (!reservationToCancel) return;

    try {
      const response = await apiFetch(
          `https://sara2backend-production.up.railway.app/api/reservations/${reservationToCancel.id}/cancel`,
          { method: "PATCH" }
      );

      if (response.ok) {
        setReservations((current) =>
            current.map((item) =>
                item.id === reservationToCancel.id ? { ...item, status: "Cancelado", statusCode: "cancelled" } : item
            )
        );
      } else {
        alert("No se pudo cancelar la reserva en la base de datos.");
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
    } finally {
      setReservationToCancel(null);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await apiFetch("https://sara2backend-production.up.railway.app/api/reportes/reservations/excel");
      if (!response.ok) throw new Error("Error al descargar el archivo");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Reporte_Reservas_SARA.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Hubo un problema con la descarga: ", error);
      alert("No se pudo descargar el reporte de Excel.");
    }
  };

  return (
      <section className="module-page">
        <ModuleHeader
            eyebrow="Espacios"
            title="Reservas de cubículos"
            description="Crea, consulta y cancela reservaciones del Learning Commons."
            actionLabel="Nueva reserva"
            onAction={() => setIsFormOpen(true)}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className={viewMode === "calendar" ? "module-primary-button" : "module-link-button"} onClick={() => setViewMode("calendar")}>Vista Calendario</button>
            <button type="button" className={viewMode === "table" ? "module-primary-button" : "module-link-button"} onClick={() => setViewMode("table")}>Vista Tabla</button>
          </div>
          <div>
            <button type="button" className="module-primary-button" style={{ backgroundColor: "#107c41", borderColor: "#107c41" }} onClick={handleDownloadExcel}>📊 Descargar Reporte (Excel)</button>
          </div>
        </div>

        {viewMode === "calendar" ? (
            <div className="module-card">
              <CalendarView
                  onDateClick={(fechaSeleccionada) => {
                    setForm({ ...emptyForm, reservation_date: fechaSeleccionada });
                    setIsFormOpen(true);
                  }}
              />
            </div>
        ) : (
            <div className="module-card">
              <ModuleToolbar
                  search={search}
                  onSearch={setSearch}
                  searchPlaceholder="Buscar cubículo o usuario"
                  filter={status}
                  onFilter={setStatus}
                  filterOptions={[
                    { value: "confirmed", label: "Reservados" },
                    { value: "active", label: "Ocupados" },
                    { value: "cancelled", label: "Cancelados" },
                    { value: "pending", label: "Pendientes" },
                  ]}
              />
              {filteredReservations.length > 0 ? (
                  <div className="module-table-wrapper">
                    <table className="module-table">
                      <thead>
                      <tr><th>Cubículo</th><th>Usuario</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Acciones</th></tr>
                      </thead>
                      <tbody>
                      {filteredReservations.map((item) => (
                          <tr key={item.id}>
                            <td>{item.room}</td><td>{item.user}</td><td>{item.date}</td><td>{item.time}</td><td><ModuleStatus value={item.status} /></td>
                            <td>
                              <button type="button" className="module-link-button" disabled={item.statusCode === "cancelled" || item.statusCode === "completed"} onClick={() => setReservationToCancel(item)}>Cancelar</button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  <EmptyState message="No hay reservaciones con esos criterios." />
              )}
            </div>
        )}

        <AdminModal title="Nueva reserva" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <form className="module-form" onSubmit={saveReservation}>
            <label>
              Cubículo
              <select name="cubicle_id" value={form.cubicle_id} onChange={handleChange} required>
                <option value="">Selecciona un cubículo</option>
                <option value="1">África</option>
                <option value="2">América</option>
                <option value="3">Oceanía</option>
                <option value="4">Asia</option>
              </select>
            </label>
            <label>ID de Usuario (Opcional si eres admin, o déjalo vacío) <input name="user_id" type="number" value={form.user_id} onChange={handleChange} placeholder="Ej. 5" /></label>
            <label>Fecha <input name="reservation_date" type="date" value={form.reservation_date} onChange={handleChange} required /></label>
            <div className="module-form-grid">
              <label>Hora inicial <input name="start_time" type="time" value={form.start_time} onChange={handleChange} required /></label>
              <label>Hora final <input name="end_time" type="time" value={form.end_time} onChange={handleChange} required /></label>
            </div>
            <label>Propósito <input name="purpose" value={form.purpose} onChange={handleChange} required /></label>
            <label>Número de personas <input name="number_of_people" type="number" min="1" max="10" value={form.number_of_people} onChange={handleChange} required /></label>
            <div className="module-form-actions">
              <button type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button type="submit" className="module-primary-button">Guardar reserva</button>
            </div>
          </form>
        </AdminModal>

        <ConfirmDialog
            isOpen={Boolean(reservationToCancel)}
            title="Cancelar reservación"
            message={`¿Deseas cancelar la reservación de ${reservationToCancel?.room ?? ""}?`}
            confirmLabel="Cancelar reservación"
            onConfirm={confirmCancellation}
            onClose={() => setReservationToCancel(null)}
        />
      </section>
  );
}

export default Reservations;