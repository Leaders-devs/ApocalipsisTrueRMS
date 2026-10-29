<p align="center">
  <img src="poster.png" alt="Apocalipsis TrueRMS" width="100%">
</p>

<h1 align="center">Apocalipsis TrueRMS</h1>

<p align="center">
  Shooter cooperativo de zombies en pixel art · hasta 6 jugadores en la misma red · 25 rondas + Boss Rush + FINAL<br>
  Hecho por y para alumnos de Ingeniería en Computación — FACET · UNT
</p>

---

## La historia

Seis estudiantes llevan días encerrados en el laboratorio terminando el Proyecto Integrador. Cuando por fin salen, la facultad está llena de zombies violetas. Se arman con lo que tienen a mano (multímetros, cautines, fuentes de laboratorio) y tienen que aguantar 25 rondas con los profesores esperándolos cada 5… y después, lo que sea que esté haciendo temblar el piso.

## Cómo jugar

**Opción 1 — En el navegador (lo más fácil)**
Entrá a la página de GitHub Pages del repo, tocá **Crear sala** y pasale el **código de 4 dígitos** a tus compañeros para que entren con **Unirse a una sala**.

**Opción 2 — Servidor LAN (si la conexión por código falla en la red de la facu)**
Necesitás [Node.js](https://nodejs.org) en una sola PC:

```bash
node servidor-lan.js
```

La consola muestra una dirección tipo `http://192.168.x.x:8080`: los demás la abren en su navegador y entran con el código. No hace falta instalar nada más.

**Opción 3 — Solo**
Abrí `index.html` y elegí **Jugar solo**.

## Controles

| Tecla | Acción |
|---|---|
| `WASD` | Moverse |
| Mouse | Apuntar / disparar |
| `1` `2` `3` `4` | Melee · Arma 1 · Arma 2 · Granadas |
| `R` | Recargar |
| `E` (mantener) | Revivir compañero |
| `Q` | Súper (se carga haciendo daño) |
| `1` `2` `3` `4` en el FINAL | Quick Time Event: todos juntos |
| `B` | Abrir / cerrar la tienda entre rondas |
| `Esc` | Pausa |

## Personajes

| | Personaje | Súper |
|---|---|---|
| 🔴 | **Ulises** — Mago de Otra Tierra | Plano de obra: una cuadrilla de obreros pelea por él… mientras se toma el colectivo a Aguilares (15 s) |
| 🔵 | **Santi** — Presidente | Urna: los zombies hacen fila para votar a La Bachofen |
| 🔷 | **Facundo** — El Gran Flan | Flan gigante que atrae y explota (queda con 1 de vida) |
| 🟢 | **Lucas** — El Druida Tester | Bosque que cura y revive (echa raíces) |
| 🟠 | **Gabriel** — El Ratón Motorizado | Estampida de motoqueros que arrastra a los zombies hasta el borde del mapa (le cuesta puntos) |
| ⚪ | **Koro** — El Bebé Programador | Breakpoint: congela la horda (después corrige TPs) |

## Qué tiene

- **25 rondas** con hordas crecientes y eventos aleatorios (apagón, recursantes, gusanos…).
- **5 profesores jefe** en orden aleatorio cada partida, con presentación y ataques propios; cualquiera puede salir **reforzado**. Los acompañan ayudantes de cátedra.
- **Ronda bonus: Boss Rush** — los cinco profesores llegan de a uno, por tiempo: hay que bajarlos antes de que se junten.
- **Nivel FINAL** — un jefe gigante que rompe el mapa desde los bordes hasta dejar solo el patio de la fuente, y se remata con un **Quick Time Event cooperativo**.
- **Tienda entre rondas** (15 s): armas temáticas, mejoras, niveles de arma, **combinaciones** y granadas.
- **Revivir** compañeros durante la ronda o en los primeros 10 s de la siguiente.
- **Partida guardada** automática al terminar cada ronda (y exportable).
- Intro, cinemáticas de jefes y un final que no te esperás.

## Archivos

```
index.html         el juego completo (un solo archivo, sin dependencias)
servidor-lan.js    servidor opcional para jugar por red local
poster.png         este póster
```

## Publicarlo en GitHub Pages

1. Subí `index.html`, `servidor-lan.js`, `poster.png` y este `README.md` al repo.
2. **Settings → Pages → Source:** `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. En un par de minutos queda en `https://<tu-usuario>.github.io/<repo>/`.

> La conexión por código usa WebRTC (PeerJS). Si en alguna red no conecta, usá el servidor LAN.

---

<p align="center"><sub>Proyecto de fans, sin fines de lucro. Ningún profesor fue lastimado en la realización de este juego.</sub></p>
