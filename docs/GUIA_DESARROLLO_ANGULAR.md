# Guía de desarrollo Angular para Turnero

Esta guía explica cómo aprender Angular agregando funcionalidades a esta aplicación real de gestión de turnos. Está pensada para programadores junior: primero describe cómo está organizado el proyecto y después propone un método de trabajo repetible.

La aplicación está construida con Angular 22, componentes standalone, Angular Material, formularios reactivos, señales (`signal`), RxJS y Vitest. Durante el desarrollo utiliza una API simulada en memoria; en producción se espera una API REST real.

## 1. Qué problema resuelve la aplicación

Turnero permite gestionar:

- usuarios y autenticación;
- clientes, profesionales y servicios;
- horarios semanales y bloqueos;
- reservas, reprogramaciones y cancelaciones;
- disponibilidad sin superponer turnos;
- estados e historial de los turnos.

Los roles actuales son `ADMIN`, `RECEPCIONISTA`, `PROFESIONAL` y `CLIENTE`. Los permisos se aplican mediante guards y la interfaz se organiza por funcionalidades.

## 2. Preparar el entorno

Requisitos:

- Node.js compatible con Angular 22;
- npm 11, indicado en `package.json`;
- Visual Studio Code recomendado;
- Git.

Instalar dependencias y arrancar el proyecto:

```bash
npm install
npm start
```

Abrir [http://localhost:4200](http://localhost:4200).

Comandos habituales:

```bash
npm run build   # compilación de producción
npm test        # pruebas unitarias con Vitest
npm run lint    # reglas de ESLint
```

En desarrollo, `src/environments/environment.development.ts` tiene `mockEnabled: true`. Esto hace que las peticiones a `/api` sean atendidas por `mockApiInterceptor` y no por un backend externo.

## 3. Cómo está organizado el código

La estructura sigue una separación por responsabilidad:

```text
src/app/
├── core/
│   ├── guards/         # autorización de rutas
│   ├── interceptors/   # token, errores y API mock
│   ├── mock/           # base de datos y datos iniciales en memoria
│   ├── models/         # interfaces, tipos, DTOs y constantes
│   ├── services/       # comunicación HTTP y lógica reutilizable
│   └── utils/          # funciones puras, por ejemplo fechas
├── features/           # pantallas agrupadas por caso de uso
├── layout/             # estructura común de la aplicación autenticada
└── shared/             # componentes reutilizables y páginas comunes
```

### `core`

Contiene piezas globales. Un servicio como `TurnosService` conoce los endpoints HTTP, pero no debería dibujar HTML. Un modelo como `Servicio` define el contrato de datos compartido por la página, el servicio y el mock.

### `features`

Cada carpeta representa una capacidad del negocio. Por ejemplo, `features/servicios` contiene la página de listado y su diálogo de alta/edición. Una página coordina la pantalla; no debe convertirse en una base de datos ni duplicar reglas de negocio.

### `shared`

Contiene elementos que pueden utilizarse desde varias funcionalidades, como el badge de estado o el diálogo de cancelación. Si un componente solo sirve para una pantalla, debe permanecer cerca de esa pantalla.

## 4. Ideas de Angular que aparecen en este proyecto

### Componentes standalone

No se utiliza un `NgModule` por funcionalidad. Cada componente declara sus dependencias en `imports`:

```ts
@Component({
  imports: [MatButtonModule, MatTableModule],
  templateUrl: './servicios.page.html',
  styleUrl: './servicios.page.scss',
})
export class ServiciosPage {}
```

Si la plantilla usa un componente, directiva o pipe y aparece un error como `is not a known element`, normalmente falta agregar el módulo o componente correspondiente en `imports`.

### Inyección con `inject`

Las dependencias se obtienen dentro de la clase:

```ts
private serviciosSvc = inject(ServiciosService);
private snackbar = inject(MatSnackBar);
```

Los servicios reutilizables se registran normalmente con `providedIn: 'root'`.

### Señales

Las señales representan estado reactivo local:

```ts
protected readonly servicios = signal<Servicio[]>([]);
protected readonly cargando = signal(true);

this.servicios.set(lista);
```

En la plantilla se leen invocándolas: `servicios()` y `cargando()`. Las expresiones de control modernas de Angular son `@if`, `@for` y `@switch`.

### Observables y `HttpClient`

Los métodos de los servicios retornan `Observable<T>`. Una página puede suscribirse explícitamente o convertir una operación puntual con `firstValueFrom`, como hace `ServiciosPage` al cargar el listado. La regla práctica es cancelar o evitar suscripciones manuales persistentes cuando el componente pueda destruirse; para cargas simples, `firstValueFrom` es suficiente.

### Formularios reactivos

Los formularios se crean en TypeScript, con validaciones explícitas, y se conectan a la plantilla con `formGroup` y `formControlName`. Antes de enviar:

1. verificar `form.invalid`;
2. normalizar textos con `trim()`;
3. construir un DTO;
4. mostrar estado de guardado;
5. informar éxito o error.

## 5. Recorrido de una petición

Cuando `ServiciosPage` carga datos ocurre lo siguiente:

```text
ServiciosPage
    ↓
ServiciosService.list()
    ↓
HttpClient GET /api/servicios
    ↓
authInterceptor agrega Authorization si existe token
    ↓
mockApiInterceptor intercepta en desarrollo
    ↓
MockDatabase.listServicios()
    ↓
Servicio[] vuelve a la página
```

La configuración está en [src/app/app.config.ts](src/app/app.config.ts). Allí se registran el router, `HttpClient`, Material, el adaptador de fechas, el modo zoneless y los interceptores.

El interceptor de errores transforma respuestas fallidas en mensajes que la UI puede mostrar. En una funcionalidad nueva conviene reutilizar `ApiErrorHandler.message(error)` en lugar de presentar el objeto de error directamente.

## 6. Método para agregar una funcionalidad

Antes de editar, escribir el caso de uso en una frase:

> Como recepcionista quiero consultar la agenda del día filtrando por profesional para encontrar turnos rápidamente.

Después seguir este orden.

### Paso 1: revisar el requisito y los permisos

Identificar:

- qué usuario puede usar la funcionalidad;
- qué datos necesita;
- qué validaciones de negocio existen;
- si es una nueva pantalla, un diálogo o un componente compartido;
- qué endpoint necesita.

Consultar `analisis-funcional.md` para mantener los nombres y las reglas del dominio.

### Paso 2: crear o actualizar el modelo

Los modelos se ubican en `src/app/core/models`. Usar interfaces para datos de API y tipos literales para valores cerrados:

```ts
export interface AgendaFiltro {
  fecha: string;
  profesionalId?: number;
}

export interface TurnoAgenda {
  id: number;
  codigo: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoTurno;
  clienteNombre: string;
  profesionalNombre: string;
  servicioNombre: string;
}
```

Después exportar el tipo desde `src/app/core/models/index.ts` para poder importarlo con `@app/core/models`.

No mezclar un DTO de creación con la respuesta completa si los campos son diferentes. Por ejemplo, `CreateServicioDto` no contiene `id`, `createdAt` ni `updatedAt`, porque esos datos los genera el servidor.

### Paso 3: agregar el método al servicio HTTP

El servicio encapsula la URL y los parámetros. Un ejemplo coherente con `TurnosService` sería:

```ts
listAgenda(filtro: AgendaFiltro): Observable<TurnoAgenda[]> {
  return this.http.get<TurnoAgenda[]>(`${this.apiUrl}/detalle`, {
    params: {
      fecha: filtro.fecha,
      ...(filtro.profesionalId ? { profesionalId: String(filtro.profesionalId) } : {}),
    },
  });
}
```

La página no debería construir URLs a mano ni conocer cómo se serializan los parámetros. Esa responsabilidad pertenece al servicio.

### Paso 4: hacer funcionar el mock

Mientras `mockEnabled` sea `true`, agregar el endpoint en `src/app/core/interceptors/mock-api.interceptor.ts`. La respuesta debe tener la misma forma que tendrá la API real.

Para el ejemplo de agenda, el interceptor ya ofrece `GET /api/turnos/detalle` y filtra por `fecha`, `profesionalId`, `servicioId`, `clienteId` y `estado`. Si el desarrollo necesita otro filtro, hay que actualizar el filtro del mock y probarlo.

Los datos iniciales viven en `src/app/core/mock/mock-db.ts`. Agregar un registro allí solo sirve para probar la aplicación: se pierde al recargar la página o reiniciar el proceso.

### Paso 5: crear la página standalone

Una página suele tener tres archivos:

```text
agenda/
├── agenda.page.ts
├── agenda.page.html
└── agenda.page.scss
```

Se puede generar con Angular CLI:

```bash
ng generate component features/agenda/agenda.page --type=page
```

Después adaptar el resultado al estilo del proyecto. Una página mínima debería incluir estado de carga, datos, errores y una acción de recarga:

```ts
export class AgendaPage {
  private turnosSvc = inject(TurnosService);
  private snackbar = inject(MatSnackBar);

  protected readonly turnos = signal<TurnoDetalle[]>([]);
  protected readonly cargando = signal(false);
  protected readonly fecha = signal(toDateKey(new Date()));

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const datos = await firstValueFrom(this.turnosSvc.listDetalle({ fecha: this.fecha() }));
      this.turnos.set(datos);
    } catch (error) {
      this.snackbar.open(ApiErrorHandler.message(error), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargando.set(false);
    }
  }
}
```

La plantilla debe ser declarativa: lee señales, muestra estados y dispara métodos. No debe contener validaciones complejas de disponibilidad.

### Paso 6: registrar la ruta

Las rutas se encuentran en `src/app/app.routes.ts`. Para una pantalla interna se usa carga diferida:

```ts
{
  path: 'agenda',
  canActivate: [roleGuard],
  data: { roles: [ROLES.ADMIN, ROLES.RECEPCIONISTA, ROLES.PROFESIONAL] },
  loadComponent: () => import('./features/agenda/agenda.page').then((m) => m.AgendaPage),
},
```

`authGuard` protege el acceso de usuarios no autenticados. `roleGuard` y `roleChildGuard` protegen por rol. Ocultar un botón no es seguridad: el permiso también debe validarse en el backend real.

Si la nueva pantalla debe aparecer en el menú, actualizar también [src/app/layout/shell.component.ts](src/app/layout/shell.component.ts) y su plantilla.

### Paso 7: agregar la navegación visual

Mantener las convenciones actuales:

- Angular Material para botones, tablas, campos, diálogos y mensajes;
- `MatSnackBar` para feedback breve;
- spinner mientras se espera una petición;
- estado vacío cuando no hay resultados;
- textos y etiquetas en español;
- diseño responsive;
- `aria-label` en botones que solo muestran un ícono.

### Paso 8: cubrir la lógica con pruebas

Las reglas puras deben probarse sin levantar el navegador. La disponibilidad es un buen ejemplo en `disponibilidad.util.spec.ts`: se prueban descanso, margen, bloqueos, turnos cancelados y duración del servicio.

Para una pantalla, probar al menos:

- que muestra los datos recibidos;
- que maneja lista vacía;
- que muestra un error de API;
- que envía los filtros esperados;
- que respeta el permiso del rol.

Para un servicio, probar URL, método, body y parámetros usando el cliente HTTP de testing cuando corresponda.

## 7. Ejemplo guiado: agregar una agenda diaria

Este ejercicio conecta los conceptos anteriores.

### Objetivo

Crear una pantalla `/agenda` que permita a administración y recepción consultar los turnos del día. Un profesional solo debe ver su propia agenda.

### Diseño del flujo

```text
Usuario autenticado
  → entra a /agenda
  → roleGuard comprueba el rol
  → AgendaPage carga la fecha actual
  → TurnosService.listDetalle({ fecha, profesionalId? })
  → GET /api/turnos/detalle
  → la página muestra TurnoDetalle[]
```

### Reglas importantes

1. Filtrar por `profesionalId` para usuarios `PROFESIONAL` usando el usuario autenticado.
2. No mostrar turnos cancelados si la pantalla se define como agenda operativa, o indicarlos claramente si se necesita auditoría.
3. Ordenar por `fechaHoraInicio`.
4. No calcular disponibilidad en la página: esa lógica pertenece a `disponibilidad.util.ts` y al backend.
5. Si la fecha cambia, volver a consultar y mostrar el estado de carga.

### Archivos esperados

```text
src/app/features/agenda/
├── agenda.page.ts
├── agenda.page.html
└── agenda.page.scss
```

No crear un servicio nuevo si `TurnosService` ya resuelve la consulta. Reutilizar `TurnoDetalle`, `ESTADOS_TURNO_COLOR` y componentes compartidos cuando sea posible.

### Checklist de implementación

- [ ] Definir el caso de uso y los roles.
- [ ] Confirmar si el modelo actual alcanza.
- [ ] Agregar o reutilizar el método de `TurnosService`.
- [ ] Confirmar que el mock responde al endpoint.
- [ ] Crear la página standalone.
- [ ] Implementar carga, error, vacío y resultados.
- [ ] Registrar la ruta lazy.
- [ ] Agregar la opción al menú si corresponde.
- [ ] Agregar pruebas.
- [ ] Ejecutar lint, tests y build.

## 8. Disponibilidad y reglas de negocio

La función `consultarDisponibilidad` combina profesionales, servicios, turnos, horarios y bloqueos. La página de reserva consume esa información, pero no debería duplicar sus reglas.

Al modificar una regla, revisar estos casos:

- el profesional está activo;
- el servicio está activo;
- el profesional presta el servicio;
- el turno entra completo antes del fin de jornada;
- el turno no cruza el descanso;
- el turno no cruza otro turno vigente;
- se respeta el margen entre turnos;
- un turno cancelado libera el horario;
- un bloqueo de agenda elimina los slots;
- la fecha no cambia por una conversión incorrecta de zona horaria.

La validación del frontend mejora la experiencia, pero la validación definitiva debe vivir también en el backend. Dos usuarios pueden reservar al mismo tiempo y el servidor debe impedir el solapamiento dentro de una transacción.

## 9. Fechas y zonas horarias

No manipular fechas con concatenaciones improvisadas. Usar las funciones de `src/app/core/utils/date-time.ts`, por ejemplo `toDateKey`, `parseIso` e `isoFromLocal`.

Reglas prácticas:

- para una fecha de calendario usar `YYYY-MM-DD`;
- para un instante usar una cadena ISO;
- al mostrar, convertir a la zona local del usuario;
- al enviar al backend, respetar el contrato acordado;
- probar horarios cercanos a medianoche y cambios de horario.

## 10. Errores frecuentes de principiantes

### La plantilla no reconoce un componente

Agregar el módulo o componente a `imports` del componente standalone.

### La ruta devuelve pantalla 404

Revisar el `path`, el import dinámico y que la ruta esté antes del comodín `**`.

### La petición no llega al mock

Comprobar método HTTP, path, `environment.mockEnabled` y la forma en que el interceptor separa los segmentos después de `/api`.

### La lista no se actualiza

Actualizar la señal con `.set()` o recargar los datos después de crear, editar o cambiar estado. Evitar modificar un array local sin notificar el cambio.

### Se muestra `[object Object]` como error

Usar `ApiErrorHandler.message(error)` y mostrar un mensaje entendible.

### El botón está oculto, pero la acción sigue disponible

La UI no reemplaza la autorización. Agregar guard en frontend y autorización en backend.

### El mock funciona, pero producción falla

El mock no es persistencia ni garantía de contrato. Comparar request y response con la API real, revisar `environment.production.ts` y agregar pruebas de integración cuando exista backend.

## 11. Buenas prácticas del proyecto

- Usar alias `@app/*` y `@env/*` en lugar de rutas relativas largas.
- Mantener nombres de dominio en español cuando ya existen en el modelo.
- Preferir interfaces y tipos explícitos antes que `any`.
- Mantener las páginas enfocadas en presentación y coordinación.
- Poner reglas reutilizables y puras en `core/services` o `core/utils`.
- Reutilizar Material y componentes de `shared`.
- Mostrar siempre carga, error y estado vacío.
- No duplicar reglas entre página, mock y backend sin documentar el motivo.
- No guardar contraseñas reales en el frontend: las credenciales del mock son solo datos de desarrollo.
- Escribir una prueba junto con cada regla de negocio nueva.

## 12. Flujo de trabajo recomendado

Para cada desarrollo:

1. Crear una rama con un nombre descriptivo, por ejemplo `feature/agenda-diaria`.
2. Leer el requisito y ubicar una funcionalidad parecida.
3. Implementar de afuera hacia adentro: modelo, servicio, mock, página, ruta y menú.
4. Ejecutar una comprobación corta después de cada parte.
5. Probar manualmente con más de un rol.
6. Ejecutar `npm run lint`, `npm test` y `npm run build`.
7. Revisar que no se hayan agregado archivos generados ni datos sensibles.
8. Describir en el pull request qué cambió, cómo probarlo y qué queda pendiente del backend.

## 13. Recursos para seguir aprendiendo

- [Documentación oficial de Angular](https://angular.dev/)
- [Angular CLI](https://angular.dev/tools/cli)
- [Componentes standalone](https://angular.dev/guide/components)
- [Signals](https://angular.dev/guide/signals)
- [Router](https://angular.dev/guide/routing)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [RxJS](https://rxjs.dev/)
- [Angular Material](https://material.angular.dev/)

La mejor práctica para aprender en este repositorio es elegir una historia de usuario pequeña, seguir el recorrido completo hasta la API mock y terminar con una prueba automatizada. Así se aprende Angular junto con arquitectura, HTTP, formularios, autorización y reglas de negocio.