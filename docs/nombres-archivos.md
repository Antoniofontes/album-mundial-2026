# Convención de nombres para las fotos del álbum vacío

> El nombre del archivo no afecta cómo el sistema asocia la imagen a un slot
> (eso lo hacés vos al subir, eligiendo el slot correcto). Pero te conviene
> tenerlos prolijos para no marearte y poder ir batcheando.

## Cómo se identifica cada cromo

Las figuritas no se numeran de 1 a 994: usan el **código impreso** en cada
sticker. Hay 4 familias:

| Familia                          | Código     | Cantidad | Ejemplos                  |
|----------------------------------|------------|---------:|---------------------------|
| Portada                          | `00`       | 1        | `00`                      |
| FIFA World Cup specials (FWC)    | `FWC1`–`FWC19` | 19   | `FWC3`, `FWC12`           |
| Coca-Cola                        | `CC1`–`CC14`   | 14   | `CC1`, `CC8`              |
| Selecciones (48 × 20)            | `<CODE>1`–`<CODE>20` | 960 | `ARG1`, `MEX13`, `COL20` |
| **Total**                        |            | **994**  |                           |

### Cómo se reparten los 20 cromos de cada selección en 2 hojas

- **Hoja 1** = `<CODE>1` … `<CODE>10` → escudo (`<CODE>1`) + 9 jugadores.
- **Hoja 2** = `<CODE>11` … `<CODE>20` → 9 jugadores + foto grupal (`<CODE>13`).

Ejemplo Argentina: hoja 1 = `ARG1`–`ARG10`, hoja 2 = `ARG11`–`ARG20`.

## Convención de archivos sugerida

```
<código>-h<1|2>.jpg
```

Ejemplos:

- `MEX-h1.jpg` → México hoja 1 (`MEX1`–`MEX10`)
- `MEX-h2.jpg` → México hoja 2 (`MEX11`–`MEX20`)
- `ARG-h1.jpg` → Argentina hoja 1 (`ARG1`–`ARG10`)
- `ARG-h2.jpg` → Argentina hoja 2 (`ARG11`–`ARG20`)

Para las secciones globales:

- `00.jpg` → portada (cromo `00`)
- `fwc.jpg` → FIFA World Cup specials (`FWC1`–`FWC19`)
- `cocacola.jpg` → Coca-Cola (`CC1`–`CC14`)

Para hojas custom (vos elegís el nombre):

- `custom-mascotas.jpg`
- `custom-copa-y-pelota.jpg`
- `custom-paises-sede.jpg`
- `custom-campeones-mundo.jpg`

## Mapa de equipos → códigos

| #  | Código | Equipo                | Grupo | Hoja 1     | Hoja 2     |
|---:|--------|-----------------------|-------|-----------|-----------|
| 1  | MEX | México                  | A | `MEX1`–`MEX10`   | `MEX11`–`MEX20`   |
| 2  | RSA | Sudáfrica               | A | `RSA1`–`RSA10`   | `RSA11`–`RSA20`   |
| 3  | KOR | Corea del Sur           | A | `KOR1`–`KOR10`   | `KOR11`–`KOR20`   |
| 4  | CZE | República Checa         | A | `CZE1`–`CZE10`   | `CZE11`–`CZE20`   |
| 5  | CAN | Canadá                  | B | `CAN1`–`CAN10`   | `CAN11`–`CAN20`   |
| 6  | BIH | Bosnia y Herzegovina    | B | `BIH1`–`BIH10`   | `BIH11`–`BIH20`   |
| 7  | QAT | Catar                   | B | `QAT1`–`QAT10`   | `QAT11`–`QAT20`   |
| 8  | SUI | Suiza                   | B | `SUI1`–`SUI10`   | `SUI11`–`SUI20`   |
| 9  | BRA | Brasil                  | C | `BRA1`–`BRA10`   | `BRA11`–`BRA20`   |
| 10 | MAR | Marruecos               | C | `MAR1`–`MAR10`   | `MAR11`–`MAR20`   |
| 11 | HAI | Haití                   | C | `HAI1`–`HAI10`   | `HAI11`–`HAI20`   |
| 12 | SCO | Escocia                 | C | `SCO1`–`SCO10`   | `SCO11`–`SCO20`   |
| 13 | USA | Estados Unidos          | D | `USA1`–`USA10`   | `USA11`–`USA20`   |
| 14 | PAR | Paraguay                | D | `PAR1`–`PAR10`   | `PAR11`–`PAR20`   |
| 15 | AUS | Australia               | D | `AUS1`–`AUS10`   | `AUS11`–`AUS20`   |
| 16 | TUR | Turquía                 | D | `TUR1`–`TUR10`   | `TUR11`–`TUR20`   |
| 17 | GER | Alemania                | E | `GER1`–`GER10`   | `GER11`–`GER20`   |
| 18 | CUW | Curazao                 | E | `CUW1`–`CUW10`   | `CUW11`–`CUW20`   |
| 19 | CIV | Costa de Marfil         | E | `CIV1`–`CIV10`   | `CIV11`–`CIV20`   |
| 20 | ECU | Ecuador                 | E | `ECU1`–`ECU10`   | `ECU11`–`ECU20`   |
| 21 | NED | Países Bajos            | F | `NED1`–`NED10`   | `NED11`–`NED20`   |
| 22 | JPN | Japón                   | F | `JPN1`–`JPN10`   | `JPN11`–`JPN20`   |
| 23 | SWE | Suecia                  | F | `SWE1`–`SWE10`   | `SWE11`–`SWE20`   |
| 24 | TUN | Túnez                   | F | `TUN1`–`TUN10`   | `TUN11`–`TUN20`   |
| 25 | BEL | Bélgica                 | G | `BEL1`–`BEL10`   | `BEL11`–`BEL20`   |
| 26 | EGY | Egipto                  | G | `EGY1`–`EGY10`   | `EGY11`–`EGY20`   |
| 27 | IRN | Irán                    | G | `IRN1`–`IRN10`   | `IRN11`–`IRN20`   |
| 28 | NZL | Nueva Zelanda           | G | `NZL1`–`NZL10`   | `NZL11`–`NZL20`   |
| 29 | ESP | España                  | H | `ESP1`–`ESP10`   | `ESP11`–`ESP20`   |
| 30 | CPV | Cabo Verde              | H | `CPV1`–`CPV10`   | `CPV11`–`CPV20`   |
| 31 | KSA | Arabia Saudita          | H | `KSA1`–`KSA10`   | `KSA11`–`KSA20`   |
| 32 | URU | Uruguay                 | H | `URU1`–`URU10`   | `URU11`–`URU20`   |
| 33 | FRA | Francia                 | I | `FRA1`–`FRA10`   | `FRA11`–`FRA20`   |
| 34 | SEN | Senegal                 | I | `SEN1`–`SEN10`   | `SEN11`–`SEN20`   |
| 35 | IRQ | Irak                    | I | `IRQ1`–`IRQ10`   | `IRQ11`–`IRQ20`   |
| 36 | NOR | Noruega                 | I | `NOR1`–`NOR10`   | `NOR11`–`NOR20`   |
| 37 | ARG | Argentina               | J | `ARG1`–`ARG10`   | `ARG11`–`ARG20`   |
| 38 | ALG | Argelia                 | J | `ALG1`–`ALG10`   | `ALG11`–`ALG20`   |
| 39 | AUT | Austria                 | J | `AUT1`–`AUT10`   | `AUT11`–`AUT20`   |
| 40 | JOR | Jordania                | J | `JOR1`–`JOR10`   | `JOR11`–`JOR20`   |
| 41 | POR | Portugal                | K | `POR1`–`POR10`   | `POR11`–`POR20`   |
| 42 | COD | RD del Congo            | K | `COD1`–`COD10`   | `COD11`–`COD20`   |
| 43 | UZB | Uzbekistán              | K | `UZB1`–`UZB10`   | `UZB11`–`UZB20`   |
| 44 | COL | Colombia                | K | `COL1`–`COL10`   | `COL11`–`COL20`   |
| 45 | ENG | Inglaterra              | L | `ENG1`–`ENG10`   | `ENG11`–`ENG20`   |
| 46 | CRO | Croacia                 | L | `CRO1`–`CRO10`   | `CRO11`–`CRO20`   |
| 47 | GHA | Ghana                   | L | `GHA1`–`GHA10`   | `GHA11`–`GHA20`   |
| 48 | PAN | Panamá                  | L | `PAN1`–`PAN10`   | `PAN11`–`PAN20`   |

### Secciones globales

| Nombre archivo  | Códigos               | Cantidad |
|-----------------|-----------------------|---------:|
| `00.jpg`        | `00`                  | 1        |
| `fwc.jpg`       | `FWC1`–`FWC19`        | 19       |
| `cocacola.jpg`  | `CC1`–`CC14`          | 14       |

> Nota: dentro de cada selección los cromos `<CODE>1` y `<CODE>13` son
> "premium" (escudo y foto grupal). El resto son jugadores.

## Hojas custom (vos las creás)

Cualquier hoja del álbum que no encaje con los presets (por ejemplo si la
sección "FWC" en tu álbum está repartida en varias páginas, o si querés
separar mascotas / copa y pelota / sedes / campeones del mundo) la creás
desde `/scan/referencias` → **Hojas custom** → *Nueva*.

Le ponés:

- **Nombre** (ej. "Mascotas", "Países sede").
- **Códigos** que aparecen en esa página: aceptamos rangos y comas.
  Ejemplos válidos: `FWC1-FWC8`, `CC1, CC2, CC7`, `ARG13`.
- **Foto** del álbum vacío para esa página.

Después aparecerá como contexto disponible en `/scan` para que la AI
solo busque esos códigos en tu foto.

## Tip: ¿cómo numero las cosas que no sé?

Si todavía no identificaste exactamente qué cromos van en cada página
especial:

1. Creá una hoja custom genérica que abarque todo el rango (por ejemplo
   `FWC1-FWC19`) y subí la foto del álbum vacío de toda esa sección.
2. Cuando vayas pegando, vas viendo qué código es cada uno y, si querés,
   refinás creando hojas custom más específicas (ej. "Mascotas" con
   `FWC4, FWC5, FWC6`).
