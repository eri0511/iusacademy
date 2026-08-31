import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  AuthProvider,
} from '../auth/AuthContext';

import ProtectedRoute from '../auth/ProtectedRoute';

import {
  ConfiguracionProvider,
} from '../config/ConfiguracionContext';

import AdminLayout from '../layouts/AdminLayout';
import AulaCursoLayout from '../layouts/AulaCursoLayout';
import DocenteLayout from '../layouts/DocenteLayout';
import EstudianteLayout from '../layouts/EstudianteLayout';
import PublicLayout from '../layouts/PublicLayout';

import AdminInicio from '../pages/admin/Inicio';
import Cursos from '../pages/admin/Cursos';
import HitosAcademicos from '../pages/admin/HitosAcademicos';
import HistorialReportes from '../pages/admin/HistorialReportes';
import Materias from '../pages/admin/Materias';
import Usuarios from '../pages/admin/Usuarios';

import ActivarCuenta from '../pages/autenticacion/ActivarCuenta';
import Login from '../pages/autenticacion/Login';

import Configuracion from '../pages/configuracion/Configuracion';

import AulaCurso from '../pages/docente/curso/AulaCurso';
import CalificarForo from '../pages/docente/curso/CalificarForo';
import CalificacionesCurso from '../pages/docente/curso/CalificacionesCurso';
import DetalleGruposCurso from '../pages/docente/curso/DetalleGruposCurso';
import DetalleQuizDocente from '../pages/docente/curso/DetalleQuizDocente';
import DetalleTarea from '../pages/docente/curso/DetalleTarea';
import DetalleTemaForo from '../pages/docente/curso/DetalleTemaForo';
import EstudiantesCurso from '../pages/docente/curso/EstudiantesCurso';
import ForoCurso from '../pages/docente/curso/ForoCurso';
import GruposCurso from '../pages/docente/curso/GruposCurso';
import QuizzesCurso from '../pages/docente/curso/QuizzesCurso';
import RecursosCurso from '../pages/docente/curso/RecursosCurso';
import RevisarEntregaTarea from '../pages/docente/curso/RevisarEntregaTarea';
import TablonCurso from '../pages/docente/curso/TablonCurso';
import TareasCurso from '../pages/docente/curso/TareasCurso';

import DocenteInicio from '../pages/docente/Inicio';
import MisCursos from '../pages/docente/MisCursos';

import NotificacionesPage from '../pages/notificaciones/NotificacionesPage';

import EstudianteInicio from '../pages/estudiante/Inicio';

import CalificacionesCursoEstudiante from '../pages/estudiante/cursos/CalificacionesCursoEstudiante';
import DetalleForoEstudiante from '../pages/estudiante/cursos/DetalleForoEstudiante';
import DetalleQuizEstudiante from '../pages/estudiante/cursos/DetalleQuizEstudiante';
import DetalleTareaEstudiante from '../pages/estudiante/cursos/DetalleTareaEstudiante';
import ForoCursoEstudiante from '../pages/estudiante/cursos/ForoCursoEstudiante';
import MisCursosEstudiante from '../pages/estudiante/cursos/MisCursos';
import QuizzesCursoEstudiante from '../pages/estudiante/cursos/QuizzesCursoEstudiante';
import RecursosCursoEstudiante from '../pages/estudiante/cursos/RecursosCursoEstudiante';
import TablonCursoEstudiante from '../pages/estudiante/cursos/TablonCursoEstudiante';
import TareasCursoEstudiante from '../pages/estudiante/cursos/TareasCursoEstudiante';

import Perfil from '../pages/perfil/Perfil';

import Contacto from '../pages/public/Contacto';
import Home from '../pages/public/Home';
import Servicios from '../pages/public/Servicios';
import VerificarReporte from '../pages/public/VerificarReporte';

type PaginaProximamenteProps = {
  titulo: string;
  descripcion: string;
};

function PaginaProximamente({
  titulo,
  descripcion,
}: PaginaProximamenteProps) {
  return (
    <section
      style={{
        padding: '24px',
        border:
          '1px solid var(--app-border)',
        borderRadius: '20px',
        color: 'var(--app-text)',
        background:
          'var(--app-surface)',
        boxShadow:
          'var(--app-shadow-sm)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '20px',
        }}
      >
        {titulo}
      </h2>

      <p
        style={{
          marginBottom: 0,
          color:
            'var(--app-text-soft)',
        }}
      >
        {descripcion}
      </p>
    </section>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfiguracionProvider>
          <Routes>
            {/* =====================================================
                RUTAS PÚBLICAS
            ====================================================== */}

            <Route
              element={
                <PublicLayout />
              }
            >
              <Route
                index
                element={
                  <Home />
                }
              />

              <Route
                path="servicios"
                element={
                  <Servicios />
                }
              />

              <Route
                path="contacto"
                element={
                  <Contacto />
                }
              />

              <Route
                path="login"
                element={
                  <Login />
                }
              />
            </Route>

            <Route
              path="/activar-cuenta"
              element={
                <ActivarCuenta />
              }
            />

            <Route
              path="/verificar-reporte/:codigo"
              element={
                <VerificarReporte />
              }
            />

            {/* =====================================================
                ADMINISTRADOR
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute
                  rolesPermitidos={[
                    'ADMINISTRADOR',
                  ]}
                />
              }
            >
              <Route
                path="/admin"
                element={
                  <AdminLayout />
                }
              >
                <Route
                  index
                  element={
                    <AdminInicio />
                  }
                />

                <Route
                  path="usuarios"
                  element={
                    <Usuarios />
                  }
                />

                <Route
                  path="materias"
                  element={
                    <Materias />
                  }
                />

                <Route
                  path="cursos"
                  element={
                    <Cursos />
                  }
                />

                <Route
                  path="hitos"
                  element={
                    <HitosAcademicos />
                  }
                />

                <Route
                  path="reportes"
                  element={
                    <HistorialReportes />
                  }
                />

                <Route
                  path="perfil"
                  element={
                    <Perfil />
                  }
                />

                <Route
                  path="configuracion"
                  element={
                    <Configuracion />
                  }
                />
              </Route>
            </Route>

            {/* =====================================================
                DOCENTE
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute
                  rolesPermitidos={[
                    'DOCENTE',
                  ]}
                />
              }
            >
              <Route
                path="/docente"
                element={
                  <DocenteLayout />
                }
              >
                <Route
                  index
                  element={
                    <DocenteInicio />
                  }
                />

                <Route
                  path="cursos"
                  element={
                    <MisCursos />
                  }
                />

                <Route
                  path="cursos/:cursoId"
                  element={
                    <AulaCursoLayout
                      rolEsperado="DOCENTE"
                      rutaRegreso="/docente/cursos"
                    />
                  }
                >
                  <Route
                    index
                    element={
                      <AulaCurso />
                    }
                  />

                  <Route
                    path="tablon"
                    element={
                      <TablonCurso />
                    }
                  />

                  <Route
                    path="foro"
                    element={
                      <ForoCurso />
                    }
                  />

                  <Route
                    path="foro/:temaId"
                    element={
                      <DetalleTemaForo />
                    }
                  />

                  <Route
                    path="foro/:temaId/calificar"
                    element={
                      <CalificarForo />
                    }
                  />

                  <Route
                    path="estudiantes"
                    element={
                      <EstudiantesCurso />
                    }
                  />

                  <Route
                    path="tareas"
                    element={
                      <TareasCurso />
                    }
                  />

                  <Route
                    path="tareas/:tareaId"
                    element={
                      <DetalleTarea />
                    }
                  />

                  <Route
                    path="tareas/:tareaId/entregas/:entregaId"
                    element={
                      <RevisarEntregaTarea />
                    }
                  />

                  <Route
                    path="quizzes"
                    element={
                      <QuizzesCurso />
                    }
                  />

                  <Route
                    path="quizzes/:quizId"
                    element={
                      <DetalleQuizDocente />
                    }
                  />

                  <Route
                    path="calificaciones"
                    element={
                      <CalificacionesCurso />
                    }
                  />

                  <Route
                    path="grupos"
                    element={
                      <GruposCurso />
                    }
                  />

                  <Route
                    path="grupos/:conjuntoId"
                    element={
                      <DetalleGruposCurso />
                    }
                  />

                  <Route
                    path="recursos"
                    element={
                      <RecursosCurso />
                    }
                  />

                  <Route
                    path="estadisticas"
                    element={
                      <PaginaProximamente
                        titulo="Estadísticas"
                        descripcion="Aquí se mostrarán indicadores generales del curso."
                      />
                    }
                  />
                </Route>

                <Route
                  path="biblioteca"
                  element={
                    <PaginaProximamente
                      titulo="Biblioteca jurídica"
                      descripcion="Aquí administraremos documentos jurídicos generales de la plataforma."
                    />
                  }
                />

                <Route
                  path="calendario"
                  element={
                    <PaginaProximamente
                      titulo="Calendario docente"
                      descripcion="Aquí se mostrarán actividades y fechas importantes."
                    />
                  }
                />

                <Route
                  path="notificaciones"
                  element={
                    <NotificacionesPage
                      rolSeccion="DOCENTE"
                    />
                  }
                />

                <Route
                  path="perfil"
                  element={
                    <Perfil />
                  }
                />

                <Route
                  path="configuracion"
                  element={
                    <Configuracion />
                  }
                />
              </Route>
            </Route>

            {/* =====================================================
                ESTUDIANTE
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute
                  rolesPermitidos={[
                    'ESTUDIANTE',
                  ]}
                />
              }
            >
              <Route
                path="/estudiante"
                element={
                  <EstudianteLayout />
                }
              >
                <Route
                  index
                  element={
                    <EstudianteInicio />
                  }
                />

                <Route
                  path="cursos"
                  element={
                    <MisCursosEstudiante />
                  }
                />

                <Route
                  path="cursos/:cursoId"
                  element={
                    <AulaCursoLayout
                      rolEsperado="ESTUDIANTE"
                      rutaRegreso="/estudiante/cursos"
                    />
                  }
                >
                  <Route
                    index
                    element={
                      <PaginaProximamente
                        titulo="Inicio del aula"
                        descripcion="Aquí se mostrará el resumen del hito seleccionado y las actividades del estudiante."
                      />
                    }
                  />

                  <Route
                    path="tablon"
                    element={
                      <TablonCursoEstudiante />
                    }
                  />

                  <Route
                    path="foro"
                    element={
                      <ForoCursoEstudiante />
                    }
                  />

                  <Route
                    path="foro/:foroId"
                    element={
                      <DetalleForoEstudiante />
                    }
                  />

                  <Route
                    path="tareas"
                    element={
                      <TareasCursoEstudiante />
                    }
                  />

                  <Route
                    path="tareas/:tareaId"
                    element={
                      <DetalleTareaEstudiante />
                    }
                  />

                  <Route
                    path="quizzes"
                    element={
                      <QuizzesCursoEstudiante />
                    }
                  />

                  <Route
                    path="quizzes/:quizId"
                    element={
                      <DetalleQuizEstudiante />
                    }
                  />

                  <Route
                    path="calificaciones"
                    element={
                      <CalificacionesCursoEstudiante />
                    }
                  />

                  <Route
                    path="recursos"
                    element={
                      <RecursosCursoEstudiante />
                    }
                  />
                </Route>

                <Route
                  path="biblioteca"
                  element={
                    <PaginaProximamente
                      titulo="Biblioteca jurídica"
                      descripcion="Aquí el estudiante consultará contratos, demandas, memoriales y otros recursos."
                    />
                  }
                />

                <Route
                  path="calendario"
                  element={
                    <PaginaProximamente
                      titulo="Calendario"
                      descripcion="Aquí se mostrarán actividades, evaluaciones y fechas límite."
                    />
                  }
                />

                <Route
                  path="notificaciones"
                  element={
                    <NotificacionesPage
                      rolSeccion="ESTUDIANTE"
                    />
                  }
                />

                <Route
                  path="perfil"
                  element={
                    <Perfil />
                  }
                />

                <Route
                  path="configuracion"
                  element={
                    <Configuracion />
                  }
                />
              </Route>
            </Route>

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </ConfiguracionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
