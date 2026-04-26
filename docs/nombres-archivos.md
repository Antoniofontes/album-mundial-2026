# Convención de nombres para las fotos del álbum vacío

> El nombre del archivo no afecta cómo el sistema asocia la imagen a un slot
> (eso lo hacés vos al subir, eligiendo el slot correcto). Pero te conviene
> tenerlos prolijos para no marearte y poder ir batcheando.

## Reglas de oro

- Para cada equipo: **2 hojas** físicas. Hoja 1 trae el escudo + la foto
  grupal + 9 jugadores. Hoja 2 trae los otros 9 jugadores.
- Para Coca-Cola y Especiales: **1 hoja** cada uno (Coca-Cola en realidad
  ocupa 2 páginas pero las tratamos como una unidad).
- El resto de páginas (portada, mascotas, copa/pelota, países sede,
  campeones, etc.) son **hojas custom**: vos las creás en `/scan/referencias`.

## Convención sugerida

```
<código>-h<1|2>.jpg
```

Ejemplos:

- `MEX-h1.jpg` → México hoja 1
- `MEX-h2.jpg` → México hoja 2
- `ARG-h1.jpg` → Argentina hoja 1

Para las secciones generales:

- `cocacola.jpg`
- `especiales.jpg`

Para hojas custom (vos elegís el nombre):

- `custom-portada.jpg`
- `custom-copa-y-pelota.jpg`
- `custom-paises-sede.jpg`
- `custom-mascotas.jpg`
- `custom-campeones-mundo.jpg`

## Mapa completo de qué cromos van en cada hoja

| # | Código | Equipo | Grupo | Hoja 1 (cromos) | Hoja 2 (cromos) |
|---|--------|--------|-------|-----------------|-----------------|
| 1  | MEX | México              | A | 1–11    | 12–20   |
| 2  | RSA | Sudáfrica           | A | 21–31   | 32–40   |
| 3  | KOR | Corea del Sur       | A | 41–51   | 52–60   |
| 4  | CZE | República Checa     | A | 61–71   | 72–80   |
| 5  | CAN | Canadá              | B | 81–91   | 92–100  |
| 6  | BIH | Bosnia y Herzegovina| B | 101–111 | 112–120 |
| 7  | QAT | Catar               | B | 121–131 | 132–140 |
| 8  | SUI | Suiza               | B | 141–151 | 152–160 |
| 9  | BRA | Brasil              | C | 161–171 | 172–180 |
| 10 | MAR | Marruecos           | C | 181–191 | 192–200 |
| 11 | HAI | Haití               | C | 201–211 | 212–220 |
| 12 | SCO | Escocia             | C | 221–231 | 232–240 |
| 13 | USA | Estados Unidos      | D | 241–251 | 252–260 |
| 14 | PAR | Paraguay            | D | 261–271 | 272–280 |
| 15 | AUS | Australia           | D | 281–291 | 292–300 |
| 16 | TUR | Turquía             | D | 301–311 | 312–320 |
| 17 | GER | Alemania            | E | 321–331 | 332–340 |
| 18 | CUW | Curazao             | E | 341–351 | 352–360 |
| 19 | CIV | Costa de Marfil     | E | 361–371 | 372–380 |
| 20 | ECU | Ecuador             | E | 381–391 | 392–400 |
| 21 | NED | Países Bajos        | F | 401–411 | 412–420 |
| 22 | JPN | Japón               | F | 421–431 | 432–440 |
| 23 | SWE | Suecia              | F | 441–451 | 452–460 |
| 24 | TUN | Túnez               | F | 461–471 | 472–480 |
| 25 | BEL | Bélgica             | G | 481–491 | 492–500 |
| 26 | EGY | Egipto              | G | 501–511 | 512–520 |
| 27 | IRN | Irán                | G | 521–531 | 532–540 |
| 28 | NZL | Nueva Zelanda       | G | 541–551 | 552–560 |
| 29 | ESP | España              | H | 561–571 | 572–580 |
| 30 | CPV | Cabo Verde          | H | 581–591 | 592–600 |
| 31 | KSA | Arabia Saudita      | H | 601–611 | 612–620 |
| 32 | URU | Uruguay             | H | 621–631 | 632–640 |
| 33 | FRA | Francia             | I | 641–651 | 652–660 |
| 34 | SEN | Senegal             | I | 661–671 | 672–680 |
| 35 | IRQ | Irak                | I | 681–691 | 692–700 |
| 36 | NOR | Noruega             | I | 701–711 | 712–720 |
| 37 | ARG | Argentina           | J | 721–731 | 732–740 |
| 38 | ALG | Argelia             | J | 741–751 | 752–760 |
| 39 | AUT | Austria             | J | 761–771 | 772–780 |
| 40 | JOR | Jordania            | J | 781–791 | 792–800 |
| 41 | POR | Portugal            | K | 801–811 | 812–820 |
| 42 | COD | RD del Congo        | K | 821–831 | 832–840 |
| 43 | UZB | Uzbekistán          | K | 841–851 | 852–860 |
| 44 | COL | Colombia            | K | 861–871 | 872–880 |
| 45 | ENG | Inglaterra          | L | 881–891 | 892–900 |
| 46 | CRO | Croacia             | L | 901–911 | 912–920 |
| 47 | GHA | Ghana               | L | 921–931 | 932–940 |
| 48 | PAN | Panamá              | L | 941–951 | 952–960 |

### Secciones globales

| Nombre archivo  | Cromos    | Cantidad |
|-----------------|-----------|----------|
| `cocacola.jpg`  | 961–972   | 12       |
| `especiales.jpg`| 973–980   | 8        |

### Hojas custom (vos las creás)

Cualquier hoja del álbum que NO sea de equipo y NO sea Coca-Cola la tratamos
como custom. Ejemplos típicos:

- Portada / 00 / logos
- Mascotas (Maple, Zayu, Clutch)
- Trofeo y pelota oficial
- Mapa de países sede
- Calendario de partidos
- Campeones del Mundo (1930–2022)
- Páginas de récords / curiosidades

Para crear una: andá a `/scan/referencias` → "Hojas custom" → **Nueva**.
Le ponés nombre, los números (ej: `973-976` o `973, 974, 977`) y subís
la foto del álbum vacío.

## Tip: ¿cómo numero las cosas que no sé?

Si todavía no identificaste qué número (entre 973 y 980) corresponde a
cada figurita especial (mascota, copa, etc.), podés:

1. Crear una hoja custom genérica con todos: `973-980`, foto del álbum
   vacío de toda la sección de especiales.
2. Cuando empieces a pegar, vas viendo qué número es cada una y, si querés,
   refinás creando hojas custom más específicas (ej: "Mascotas" con `973, 974, 975`).
