type SideNavPage = "register" | "evaluate" | "registro";

interface SideNavProps {
  current: SideNavPage;
}

export default function SideNav({ current }: SideNavProps) {
  return (
    <nav className="side" aria-label="Menú principal">
      <h3 style={{ fontSize: "24px", padding: "0 16px 20px" }}>Calidad de Tilapia</h3>
      <a href="#/registro" aria-current={current === "registro" ? "page" : undefined}>Registrar usuario</a>
      <a href="#/register" aria-current={current === "register" ? "page" : undefined}>Registrar lote</a>
      <a href="#/evaluate" aria-current={current === "evaluate" ? "page" : undefined}>Evaluar lote</a>
      <a href="m-hu5.html">Lotes evaluados</a>
      <a href="m-hu2.html">Cerrar sesión</a>
    </nav>
  );
}
