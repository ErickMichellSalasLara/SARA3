import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from '@fullcalendar/core/locales/es';

function CalendarView({ onDateClick }) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCalendarData = async () => {
            try {
                setIsLoading(true);

                // 1. Petición a tu FastAPI para los Días Festivos
                const resHolidays = await apiFetch("https://sara2backend-production.up.railway.app/api/calendario/dias-festivos");
                const holidaysData = await resHolidays.json();

                const holidayEvents = (holidaysData.festivos || []).map((h) => ({
                    title: `CERRADO: ${h.motivo}`,
                    date: h.fecha,
                    display: "background",
                    backgroundColor: "#ca4345",
                }));

                // 2. Petición a tu FastAPI para los Eventos de Google Calendar
                const resEvents = await apiFetch("https://sara2backend-production.up.railway.app/api/calendario/eventos");
                const googleData = await resEvents.json();

                const googleEvents = (googleData.eventos || []).map((evt) => ({
                    id: evt.id,
                    title: evt.summary || "Reserva de Cubículo",
                    start: evt.start.dateTime || evt.start.date,
                    end: evt.end.dateTime || evt.end.date,
                    backgroundColor: "#2f54eb",
                }));

                // 3. Juntamos ambos arreglos
                setEvents([...holidayEvents, ...googleEvents]);
            } catch (error) {
                console.error("Error al cargar los datos del calendario:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCalendarData();
    }, []);

    if (isLoading) {
        return <div style={{ padding: "20px", color: "#666" }}>Cargando calendario de S.A.R.A...</div>;
    }

    return (
        <div style={{ padding: "20px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eaeaea" }}>
            <h2 style={{ color: "#333", marginBottom: "20px", fontSize: "1.5rem", fontWeight: "600" }}>Calendario de Reservas y Disponibilidad</h2>

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                locale={esLocale}
                events={events}
                height="75vh"
                dateClick={(info) => {
                    if (onDateClick) {
                        onDateClick(info.dateStr);
                    }
                }}
            />
        </div>
    );
}

export default CalendarView;