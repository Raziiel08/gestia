export const INFORME = {
  entidad: "Precooperativa Gestia · Mantenimiento escolar",
  titulo: "Informe de seguimiento del servicio de mantenimiento",

  proposito:
    "Comunicar el desempeño del servicio de mantenimiento durante el período seleccionado y aportar evidencia para las decisiones de la dirección y del equipo técnico.",

  destinatarios:
    "Dirección del establecimiento, referente de la precooperativa, equipo técnico y docentes responsables del seguimiento.",

  frecuencia:
    "Mensual. Se emite al cierre de cada mes y puede regenerarse en cualquier momento con los datos acumulados.",

  consulta:
    "Pueden consultarlo desde el sistema el administrador y los técnicos. La dirección recibe el PDF del período; los estudiantes y docentes solo ven sus propios reportes.",

  objetivo:
    "Sostener la proporción de reportes resueltos por encima de la meta y reducir el tiempo de resolución, priorizando los problemas urgentes y las ubicaciones con mayor acumulación.",

  fuenteDatos:
    "Base de datos del sistema Gestia (Supabase): tablas reportes, historial_estados, ubicaciones, categorias y perfiles. El período se calcula sobre la fecha de creación de cada reporte; los tiempos se miden con la fecha de resolución registrada automáticamente.",

  metodologia: [
    "El período incluye los reportes creados entre la primera y la última fecha del mes elegido.",
    "El porcentaje de resolución se calcula sobre los reportes no cancelados, porque un reporte cancelado no representa demanda real.",
    "El tiempo de resolución se mide en días corridos entre la creación y el cierre; se informa el promedio y la mediana, que no se deforma con casos extremos.",
    "El cumplimiento de plazos compara cada resolución con el plazo de su prioridad (urgente 2 días, normal 7, baja 15).",
  ],

  interpretacionPorDefecto: {
    resumen:
      "Durante {periodo} se registraron {total} reportes y se resolvieron {resueltos}, lo que representa un {pctResueltos} % de los reportes válidos. El {pctEnPlazo} % de las resoluciones se completó dentro del plazo previsto para su prioridad y el tiempo promedio de resolución fue de {tiempoPromedio} días (mediana {mediana} días). Al cierre del período quedaron {backlog} reportes abiertos y {vencidos} superaron su plazo.",
    metas: [
      "La proporción de reportes resueltos alcanzó el {pctResueltos} % y el cumplimiento de plazos el {pctEnPlazo} %.",
      "El tiempo promedio de resolución fue de {tiempoPromedio} días.",
    ],
    dificultades: [
      "Los reportes urgentes concentran la mayor presión sobre el equipo técnico y son los que más afectan el cumplimiento de plazos.",
      "Los trabajos que dependen de materiales o de un proveedor externo no pueden cerrarse dentro del período.",
    ],
    patrones: [
      "El tipo de problema más frecuente fue {categoriaTop}, con el {categoriaTopPct} % de los reportes del período.",
      "La ubicación con más reportes fue {ubicacionTop}, con {ubicacionTopTotal} registros.",
    ],
    pendientes: [
      "No se puede afirmar que la demanda haya aumentado o disminuido sin comparar al menos tres períodos consecutivos.",
      "El sistema todavía no registra costos de reparación, por lo que no es posible evaluar la eficiencia económica del servicio.",
      "Sin fotos del estado inicial y final no se puede verificar la calidad de la reparación, solo su cierre administrativo.",
    ],
    acciones: [
      {
        titulo: "Priorizar los reportes urgentes al inicio de cada semana",
        fundamento:
          "El indicador de cumplimiento de plazos es el más bajo del período y los urgentes son los que más lo afectan. Revisar la lista de pendientes urgentes el lunes permite reservar recursos antes de que venzan.",
        responsable: "Técnico de guardia y coordinación de la precooperativa",
        plazo: "A partir del próximo período",
      },
      {
        titulo: "Revisar el stock mínimo de insumos de los tipos de problema más frecuentes",
        fundamento:
          "{categoriaTop} concentra la mayor cantidad de reportes. Tener los insumos disponibles evita interrupciones por compras y reduce el tiempo de resolución.",
        responsable: "Administración y referente de la precooperativa",
        plazo: "Dentro de los 30 días",
      },
    ],
  },

  interpretaciones: {
    "2026-11": {
      resumen:
        "En {periodo} se registraron {total} reportes y se resolvieron {resueltos} ({pctResueltos} % de los válidos). El {pctEnPlazo} % de las resoluciones se completó en plazo, con un promedio de {tiempoPromedio} días (mediana {mediana} días). Quedaron {backlog} reportes abiertos y {vencidos} ya superaron el plazo de su prioridad.",
      metas: [
        "La meta de resolución (80 %) se cumplió: {pctResueltos} % de los reportes no cancelados quedó resuelto.",
        "La meta de plazo (90 %) todavía no se alcanza: {pctEnPlazo} % de las resoluciones se completó a tiempo.",
      ],
      dificultades: [
        "Los reportes urgentes de electricidad se resolvieron por encima de las 48 horas previstas.",
        "Un reporte quedó detenido a la espera de un repuesto, lo que impidió cerrarlo dentro del período.",
      ],
      patrones: [
        "La mayor demanda se concentró en {categoriaTop} ({categoriaTopPct} % del total).",
        "{ubicacionTop} fue la ubicación con más reportes ({ubicacionTopTotal}), lo que sugiere revisar ese espacio con más frecuencia.",
        "Los reportes cargados en la segunda quincena tardaron menos en resolverse que los de la primera.",
      ],
      pendientes: [
        "Con un solo mes no se puede afirmar una tendencia: hay que comparar con octubre y diciembre.",
        "No hay datos de costos ni de horas de trabajo, así que no se puede medir la eficiencia del servicio.",
        "La calidad de la reparación no se evalúa: el sistema registra el cierre, no la conformidad del usuario.",
      ],
      acciones: [
        {
          titulo: "Bloque semanal fijo para urgentes",
          fundamento:
            "El incumplimiento se concentra en los urgentes. Reservar un bloque semanal evita que los trabajos programados desplacen las urgencias.",
          responsable: "Equipo técnico",
          plazo: "Desde la primera semana del próximo mes",
        },
        {
          titulo: "Control de stock de insumos de electricidad y plomería",
          fundamento:
            "Son las dos categorías con más reportes y las que generaron esperas por materiales. Un stock mínimo acorta el tiempo de resolución.",
          responsable: "Administración de la precooperativa",
          plazo: "Dentro de los 30 días",
        },
        {
          titulo: "Encuesta breve al cerrar el reporte",
          fundamento:
            "Permite medir conformidad y no solo el cierre administrativo, cubriendo una de las limitaciones actuales del sistema.",
          responsable: "Coordinación",
          plazo: "Próximo período",
        },
      ],
    },
  },
};
