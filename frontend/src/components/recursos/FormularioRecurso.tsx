import type {
  AlcanceRecursoCurso,
  CategoriaRecursoCurso,
  NuevoArchivoRecurso,
  NuevoEnlaceRecurso,
} from '../../types/recursos/recursos.types';

import SelectorCategoriaRecurso from './SelectorCategoriaRecurso';

export type FormularioRecursoValor = {
  titulo: string;
  descripcion: string;
  categoria: CategoriaRecursoCurso;
  alcance: AlcanceRecursoCurso;
  hitoId: number | null;
  visibleParaEstudiantes: boolean;
  archivos: NuevoArchivoRecurso[];
  enlaces: NuevoEnlaceRecurso[];
};

type Props = {
  valor: FormularioRecursoValor;
  hitos: Array<{ id: number; codigo: string; nombre: string }>;
  editando?: boolean;
  deshabilitado?: boolean;
  onChange: (valor: FormularioRecursoValor) => void;
  onAbrirCatalogoCategoria: () => void;
};

export default function FormularioRecurso({
  valor,
  hitos,
  deshabilitado = false,
  onChange,
  onAbrirCatalogoCategoria,
}: Props) {
  const actualizar = <K extends keyof FormularioRecursoValor>(
    campo: K,
    nuevoValor: FormularioRecursoValor[K],
  ) => onChange({ ...valor, [campo]: nuevoValor });

  return (
    <div className="form-recurso">
      <section className="form-recurso__bloque">
        <div className="form-recurso__grid">
          <label className="campo">
            <span>Título del recurso</span>
            <input
              value={valor.titulo}
              maxLength={180}
              disabled={deshabilitado}
              placeholder="Ej. Código Civil"
              onChange={(e) => actualizar('titulo', e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Descripción</span>
            <textarea
              value={valor.descripcion}
              maxLength={1500}
              disabled={deshabilitado}
              rows={3}
              placeholder="Describe brevemente este material."
              onChange={(e) => actualizar('descripcion', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="form-recurso__bloque">
        <SelectorCategoriaRecurso
          valor={valor.categoria}
          deshabilitado={deshabilitado}
          onCambiar={(categoria) => actualizar('categoria', categoria)}
          onAbrirCatalogo={onAbrirCatalogoCategoria}
        />
      </section>

      <section className="form-recurso__bloque">
        <div className="form-recurso__grid form-recurso__grid--2">
          <label className="campo">
            <span>Alcance</span>
            <select
              value={valor.alcance}
              disabled={deshabilitado}
              onChange={(e) => {
                const alcance = e.target.value as AlcanceRecursoCurso;
                onChange({
                  ...valor,
                  alcance,
                  hitoId: alcance === 'CURSO' ? null : valor.hitoId,
                });
              }}
            >
              <option value="CURSO">Todo el curso</option>
              <option value="HITO">Solo un hito</option>
            </select>
          </label>

          {valor.alcance === 'HITO' && (
            <label className="campo">
              <span>Hito</span>
              <select
                value={valor.hitoId ?? ''}
                disabled={deshabilitado}
                onChange={(e) => actualizar('hitoId', Number(e.target.value) || null)}
              >
                <option value="">Seleccionar hito</option>
                {hitos.map((hito) => (
                  <option key={hito.id} value={hito.id}>
                    {hito.codigo} · {hito.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="switch-row">
          <input
            type="checkbox"
            checked={valor.visibleParaEstudiantes}
            disabled={deshabilitado}
            onChange={(e) => actualizar('visibleParaEstudiantes', e.target.checked)}
          />
          <div>
            <strong>Visible para estudiantes</strong>
            <span>Si se desactiva, solo el docente podrá verlo.</span>
          </div>
        </label>
      </section>

      <div className="form-recurso__nota">
        Primero crea el recurso. Después podrás agregar uno o varios archivos y enlaces desde su contenido.
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .form-recurso { display:grid; gap:12px; }
  .form-recurso__bloque { display:grid; gap:11px; padding:14px; border:1px solid var(--app-border); border-radius:16px; background:var(--app-surface-alt); }
  .form-recurso__grid { display:grid; gap:10px; }
  .form-recurso__grid--2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .campo { display:grid; gap:6px; }
  .campo span { color:var(--app-text-secondary); font-size:10px; font-weight:850; }
  .campo input,.campo textarea,.campo select { width:100%; box-sizing:border-box; padding:10px 11px; border:1px solid var(--app-border-strong); border-radius:11px; outline:none; color:var(--app-text); background:var(--app-surface); font:inherit; font-size:11px; }
  .campo textarea { resize:vertical; }
  .switch-row { display:flex; align-items:flex-start; gap:9px; padding:10px; border:1px solid var(--app-border-soft); border-radius:12px; background:var(--app-surface); }
  .switch-row div { display:grid; gap:2px; }
  .switch-row strong { font-size:10.5px; }
  .switch-row span { color:var(--app-text-muted); font-size:9px; }
  .form-recurso__nota { padding:11px 13px; border:1px dashed var(--app-border-strong); border-radius:12px; color:var(--app-text-muted); background:var(--app-surface-alt); font-size:9.5px; line-height:1.45; }
  @media(max-width:700px){ .form-recurso__grid--2{grid-template-columns:1fr;} }
`;
