import { useMemo, useState, useEffect } from "react";
import ModuleHeader from "../../components/admin/modules/ModuleHeader";
import ModuleToolbar from "../../components/admin/modules/ModuleToolbar";
import AdminModal from "../../components/admin/modules/AdminModal";
import ModuleStatus from "../../components/admin/modules/ModuleStatus";
import EmptyState from "../../components/admin/modules/EmptyState";
import "./AdminModules.css";

// 1. Estado inicial adaptado a los nombres de la base de datos
const emptyForm = {
    user_id: "",
    material_id: "",
    loan_date: "",
    due_date: ""
};

function Loans() {
    const [loans, setLoans] = useState([]);
    // 2. Nuevo estado para guardar las opciones de los <select>
    const [catalogs, setCatalogs] = useState({ users: [], materials: [] });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 3. Función para recargar la tabla de préstamos
    const fetchLoans = async () => {
        try {
            const response = await fetch("https://sara2backend-production.up.railway.app/api/prestamos/historial", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (response.ok) {
                const data = await response.json();
                setLoans(data.prestamos || []);
            } else {
                setLoans([]);
            }
        } catch (error) {
            console.error("Error al conectar con la base de datos:", error);
            setLoans([]);
        }
    };

    useEffect(() => {
        fetchLoans();

        // 4. Petición para cargar los catálogos y llenar los <select>
        const fetchCatalogs = async () => {
            try {
                const response = await fetch("https://sara2backend-production.up.railway.app/api/prestamos/catalogos", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // NOTA: Ajusta "usuarios" y "materiales" si tu API los manda con otro nombre
                    setCatalogs({
                        users: data.usuarios || [],
                        materials: data.materiales || []
                    });
                }
            } catch (error) {
                console.error("Error al cargar los catálogos:", error);
            }
        };

        fetchCatalogs();
    }, [token]);

    const filteredLoans = useMemo(() => {
        return loans.filter((item) => {
            const query = search.trim().toLowerCase();
            // Compatibilidad por si el backend manda 'user' o 'user_name'
            const userName = item.user || item.user_name || "";
            const resourceName = item.resource || item.title || "";
            const resourceCode = item.code || item.resource_code || "";

            const matchesSearch = userName.toLowerCase().includes(query) ||
                resourceName.toLowerCase().includes(query) ||
                resourceCode.toLowerCase().includes(query);

            const matchesStatus = status === "all" || item.status.toLowerCase() === status;
            return matchesSearch && matchesStatus;
        });
    }, [loans, search, status]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const saveLoan = async (event) => {
        event.preventDefault();
        try {
            // 5. Convertimos los IDs a números antes de mandarlos
            const payload = {
                user_id: parseInt(form.user_id, 10),
                material_id: parseInt(form.material_id, 10),
                loan_date: form.loan_date,
                due_date: form.due_date
            };

            const response = await fetch("https://sara2backend-production.up.railway.app/api/prestamos/registrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Si sale bien, recargamos la tabla entera para traer los nombres cruzados
                await fetchLoans();
            } else {
                console.error("No se pudo registrar el préstamo en la base de datos");
            }
        } catch (error) {
            console.error("Error al registrar préstamo:", error);
        } finally {
            setForm(emptyForm);
            setIsFormOpen(false);
        }
    };

    const returnLoan = async (id) => {
        try {
            const response = await fetch(`https://sara2backend-production.up.railway.app/api/prestamos/devolver/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                setLoans((current) => current.map((item) => item.id === id ? { ...item, status: "Devuelto" } : item));
            } else {
                console.error("No se pudo actualizar la devolución en la base de datos");
            }
        } catch (error) {
            console.error("Error al devolver préstamo:", error);
        }
    };

    const renewLoan = async (id) => {
        try {
            const response = await fetch(`https://sara2backend-production.up.railway.app/api/prestamos/renovar/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                setLoans((current) => current.map((item) => item.id === id ? { ...item, status: "Renovado" } : item));
            } else {
                console.error("No se pudo renovar el préstamo en la base de datos");
            }
        } catch (error) {
            console.error("Error al renovar préstamo:", error);
        }
    };

    return (
        <section className="module-page">
            <ModuleHeader
                eyebrow="Biblioteca"
                title="Préstamos literarios"
                description="Administra préstamos, devoluciones y fechas de vencimiento."
                actionLabel="Registrar préstamo"
                onAction={() => setIsFormOpen(true)}
            />

            <div className="module-card">
                <ModuleToolbar
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder="Buscar usuario, recurso o código"
                    filter={status}
                    onFilter={setStatus}
                    filterOptions={[
                        { value: "activo", label: "Activos" },
                        { value: "vencido", label: "Vencidos" },
                        { value: "renovado", label: "Renovados" },
                        { value: "devuelto", label: "Devueltos" },
                    ]}
                />

                {filteredLoans.length > 0 ? (
                    <div className="module-table-wrapper">
                        <table className="module-table">
                            <thead>
                            <tr><th>Usuario</th><th>Recurso</th><th>Código</th><th>Préstamo</th><th>Fecha límite</th><th>Estado</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                            {filteredLoans.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.user || item.user_name}</td>
                                    <td>{item.resource || item.title}</td>
                                    <td>{item.code || item.resource_code}</td>
                                    <td>{item.start || item.loan_date}</td>
                                    <td>{item.due || item.due_date}</td>
                                    <td><ModuleStatus value={item.status} /></td>
                                    <td>
                                        <div className="module-table-actions">
                                            <button type="button" className="module-link-button" disabled={item.status === "Devuelto" || item.status === "returned"} onClick={() => renewLoan(item.id)}>Renovar</button>
                                            <button type="button" className="module-link-button" disabled={item.status === "Devuelto" || item.status === "returned"} onClick={() => returnLoan(item.id)}>Devolver</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No hay préstamos registrados en la base de datos." />
                )}
            </div>

            <AdminModal title="Registrar préstamo" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
                <form className="module-form" onSubmit={saveLoan}>

                    <label>Usuario
                        <select name="user_id" value={form.user_id} onChange={handleChange} required>
                            <option value="" disabled>Selecciona un usuario...</option>
                            {catalogs.users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || u.name} ({u.enrollment || u.email})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>Recurso
                        <select name="material_id" value={form.material_id} onChange={handleChange} required>
                            <option value="" disabled>Selecciona un recurso...</option>
                            {catalogs.materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.title || m.resource} ({m.resource_code || m.code})
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="module-form-grid">
                        <label>Fecha de préstamo <input name="loan_date" type="date" value={form.loan_date} onChange={handleChange} required /></label>
                        <label>Fecha límite <input name="due_date" type="date" value={form.due_date} onChange={handleChange} required /></label>
                    </div>

                    <div className="module-form-actions">
                        <button type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                        <button type="submit" className="module-primary-button">Guardar préstamo</button>
                    </div>
                </form>
            </AdminModal>
        </section>
    );
}

export default Loans;