"""
models/data_models.py
Definición de Esquema Pydantic Estricto (InformeVisitaTecnicaSchema) para Gemini 3.6 y Antigravity.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class Participantes(BaseModel):
    cliente: List[str] = Field(default_factory=lambda: ["Ing. Carlos Mendoza (Jefe de Planta)"], description="Nombres y cargos del personal de la empresa visitada")
    asesor_tecnico: List[str] = Field(default_factory=lambda: ["Ing. Juan Manuel Maldonado (Asesor Técnico)"], description="Nombres y cargos del equipo técnico/molinero")


class ParametrosTermicos(BaseModel):
    temp_agua_c: float = Field(default=8.0, description="Temperatura del agua en ºC")
    temp_harina_c: float = Field(default=20.0, description="Temperatura de la harina en ºC")
    temp_ambiente_c: float = Field(default=22.0, description="Temperatura ambiente en ºC")
    temp_masa_final_c: float = Field(default=24.5, description="Temperatura de la masa al finalizar amasado en ºC")


class FormulacionEnsayada(BaseModel):
    harina_base_nombre: str = Field(default="Harina 0000 Panificable Superior", description="Tipo de harina base utilizada")
    absorcion_agua_porc: float = Field(default=61.8, description="Porcentaje de absorción de agua sobre base harina")
    sal_porc: float = Field(default=2.0, description="Porcentaje de sal sobre base harina")
    levadura_fresca_porc: float = Field(default=3.0, description="Porcentaje de levadura fresca")
    aditivos_enzimas: List[str] = Field(
        default_factory=lambda: [
            "Alfa A 100.000 skb: 15 ppm",
            "Almidón pregelatinizado Buffalo: 1.5%",
            "Propionato de Calcio: 0.35%",
            "Granozyme AFH: 25 ppm",
            "L-Cisteína: 10 ppm"
        ],
        description="Lista de mejoradores y enzimas con sus dosis"
    )


class ProcesoMecanico(BaseModel):
    tiempo_amasado_vel1_min: float = Field(default=3.0, description="Tiempo de amasado en velocidad lenta (min)")
    tiempo_amasado_vel2_min: float = Field(default=7.0, description="Tiempo de amasado en velocidad rápida (min)")
    tiempo_descanso_min: Optional[float] = Field(default=10.0, description="Tiempo de reposo de masa en mesa (min)")
    tiempo_fermentacion_min: float = Field(default=120.0, description="Tiempo total de fermentación (min)")
    temp_fermentacion_c: Optional[float] = Field(default=28.0, description="Temperatura de cámara de fermentación (ºC)")
    humedad_relativa_porc: Optional[float] = Field(default=75.0, description="Humedad relativa en cámara (%)")
    horneado_temp_c: float = Field(default=220.0, description="Temperatura de cocción en horno (ºC)")
    horneado_tiempo_min: float = Field(default=25.0, description="Tiempo de horneado (min)")
    vapor_segundos: Optional[int] = Field(default=5, description="Inyección de vapor en horno (segundos)")


class ReologiaMolino(BaseModel):
    alveografo_w: int = Field(default=270, description="Fuerza panadera W (x10^-4 J)")
    alveografo_pl: float = Field(default=0.95, description="Relación tenacidad/extensibilidad P/L")
    falling_number_seg: int = Field(default=280, description="Índice de caída Hagberg (segundos)")
    gluten_humedo_porc: float = Field(default=30.5, description="Porcentaje de gluten húmedo")
    gluten_index: Optional[int] = Field(default=88, description="Índice de gluten (0-100)")
    cenizas_porc: Optional[float] = Field(default=0.62, description="Contenido de cenizas sobre base seca (%)")


class DesempenoPanificadora(BaseModel):
    maquinabilidad: str = Field(default="Excelente (Sin adhesividad en rodillos)", description="Comportamiento en formadora/rodillos")
    tolerancia_fermentacion: str = Field(default="Alta (Soporta sobrefermentación >30 min)", description="Retención de gas y estabilidad")
    salto_horno: str = Field(default="Vigoroso (Apertura amplia simétrica)", description="Desarrollo de volumen y apertura de corte")
    rendimiento_piezas: Optional[str] = Field(default="1.45 pz/kg harina", description="Rendimiento obtenido por bolsa o batch")


class RegistroFotoFase(BaseModel):
    fase: Literal["Amasado", "Crudo_Fermentado", "Horneado_Miga"]
    observacion_tecnica: str = Field(description="Diagnóstico visual de la etapa")
    imagen_base64_o_url: Optional[str] = Field(default=None, description="Payload de la imagen codificada o URL")


class CompromisoAccion(BaseModel):
    accion: str = Field(description="Tarea o validación técnica acordada")
    responsable: str = Field(description="Nombre y entidad responsable (Cliente o Asesor)")
    fecha_limite: str = Field(description="Fecha límite de ejecución (YYYY-MM-DD)")
    criterio_exito: str = Field(description="Parámetro o entregable de validación")


class InformeVisitaTecnicaSchema(BaseModel):
    tipo_cliente: Literal["Molino Harinero", "Panificadora Industrial"] = Field(default="Molino Harinero")
    empresa_cliente: str = Field(default="Empresa Cliente S.A.", description="Razón social de la empresa cliente")
    planta_ubicacion: str = Field(default="Planta Central", description="Planta visitada y ubicación geográfica")
    fecha_visita: str = Field(default="2026-08-28", description="Fecha de la visita (YYYY-MM-DD)")
    codigo_ensayo: str = Field(default="ENS-2026-089", description="Identificador único del ensayo según Planilla")
    participantes: Participantes = Field(default_factory=Participantes)
    resumen_ejecutivo: str = Field(
        default=(
            "Se realizó la evaluación técnica post-visita en planta para optimizar la respuesta del gluten "
            "y mejorar la absorción de agua en líneas continuas. Los resultados demuestran excelente estabilidad "
            "y respuesta positiva a los aditivos enzimáticos formulados."
        ),
        description="Síntesis del diagnóstico técnico y conclusiones principales"
    )
    temperaturas: ParametrosTermicos = Field(default_factory=ParametrosTermicos)
    formulacion: FormulacionEnsayada = Field(default_factory=FormulacionEnsayada)
    proceso: ProcesoMecanico = Field(default_factory=ProcesoMecanico)
    datos_molino: Optional[ReologiaMolino] = Field(default_factory=ReologiaMolino, description="Completar si tipo_cliente == 'Molino Harinero'")
    datos_panificadora: Optional[DesempenoPanificadora] = Field(default_factory=DesempenoPanificadora, description="Completar si tipo_cliente == 'Panificadora Industrial'")
    registro_fotografico: List[RegistroFotoFase] = Field(default_factory=list, description="Tríptico de control visual de las 3 fases")
    plan_de_accion: List[CompromisoAccion] = Field(default_factory=list, description="Matriz de compromisos y próximos pasos")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InformeVisitaTecnicaSchema":
        return cls.model_validate(data)
