import { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import ModuleHeader from "../../components/admin/modules/ModuleHeader";
import ModuleToolbar from "../../components/admin/modules/ModuleToolbar";
import AdminModal from "../../components/admin/modules/AdminModal";
import ModuleStatus from "../../components/admin/modules/ModuleStatus";
import EmptyState from "../../components/admin/modules/EmptyState";
import "./AdminModules.css";

const emptyForm = { name: "", email: "", enrollment: "", role: "student", password: "" };

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Función para recargar los usuarios desde la API
  const fetchUsers = async () => {
    try {
      const response = await apiFetch("https://sara2backend-production.up.railway.app/api/usuarios");
      if (response.ok) {
        const data = await response.json();
        // ⚠️ CAMBIO CLAVE: Leer 'data.users'
        setUsers(data.users || data.usuarios || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error al conectar con la base de datos:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const nameStr = item.name?.toLowerCase() || "";
      const emailStr = item.email?.toLowerCase() || "";
      const enrollmentStr = item.enrollment?.toLowerCase() || "";
      const roleStr = item.roleCode?.toLowerCase() || item.role?.toLowerCase() || "";
      const statusStr = item.statusCode?.toLowerCase() || item.status?.toLowerCase() || "";

      const query = search.trim().toLowerCase();
      const matchesSearch = nameStr.includes(query) || emailStr.includes(query) || enrollmentStr.includes(query);
      const matchesRole = role === "all" || roleStr === role;
      const matchesStatus = status === "all" || statusStr === status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveUser = async (event) => {
    event.preventDefault();
    try {
      const newUser = { ...form };

      const response = await apiFetch("https://sara2backend-production.up.railway.app/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("Usuario creado correctamente");
        await fetchUsers(); // Recargamos para traer los datos limpios de BD
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "No se pudo crear el usuario"}`);
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
    } finally {
      setForm(emptyForm);
      setIsFormOpen(false);
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      // ⚠️ CAMBIO CLAVE: Enviar 'active' o 'inactive'
      const isCurrentlyActive = user.statusCode === "active" || user.status === "Activo";
      const newStatus = isCurrentlyActive ? "inactive" : "active";

      const response = await apiFetch(`https://sara2backend-production.up.railway.app/api/usuarios/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchUsers(); // Recargamos para reflejar el estado actual
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "No se pudo actualizar el estado"}`);
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  return (
      <section className="module-page">
        <ModuleHeader
            eyebrow="Cuentas"
            title="Usuarios"
            description="Administra cuentas, roles y estados de acceso al sistema."
            actionLabel="Nuevo usuario"
            onAction={() => setIsFormOpen(true)}
        />

        <div className="module-card">
          <ModuleToolbar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Buscar nombre, correo o matrícula"
              filter={role}
              onFilter={setRole}
              filterOptions={[
                { value: "student", label: "Estudiantes" },
                { value: "teacher", label: "Docentes" },
                { value: "librarian", label: "Bibliotecarios" },
                { value: "admin", label: "Administradores" },
              ]}
              secondaryFilter={status}
              onSecondaryFilter={setStatus}
              secondaryOptions={[
                { value: "active", label: "Activos" },
                { value: "inactive", label: "Inactivos" },
                { value: "blocked", label: "Bloqueados" },
              ]}
          />

          {filteredUsers.length > 0 ? (
              <div className="module-table-wrapper">
                <table className="module-table">
                  <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Matrícula</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                  {filteredUsers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td><td>{item.email}</td><td>{item.enrollment}</td><td>{item.role}</td>
                        <td><ModuleStatus value={item.statusCode || item.status} /></td>
                        <td>
                          <button type="button" className="module-link-button" onClick={() => toggleUserStatus(item.id)}>
                            {(item.statusCode === "active" || item.status === "Activo") ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <EmptyState message="No se encontraron usuarios en la base de datos." />
          )}
        </div>

        <AdminModal title="Nuevo usuario" isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
          <form className="module-form" onSubmit={saveUser}>
            <label>Nombre completo <input name="name" value={form.name} onChange={handleChange} required /></label>
            <label>Correo institucional <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="usuario@utr.edu.mx" required /></label>
            <div className="module-form-grid">
              <label>Matrícula <input name="enrollment" value={form.enrollment} onChange={handleChange} required /></label>
              <label>Contraseña <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Mínimo 8 caracteres" /></label>
            </div>
            <label>Rol
              <select name="role" value={form.role} onChange={handleChange} required>
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
                <option value="librarian">Bibliotecario</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <div className="module-form-actions">
              <button type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button type="submit" className="module-primary-button">Crear usuario</button>
            </div>
          </form>
        </AdminModal>
      </section>
  );
}

export default Users;