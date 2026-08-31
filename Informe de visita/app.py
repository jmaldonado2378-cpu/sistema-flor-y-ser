"""
app.py
Aplicación Web Interactiva e Informe Técnico Ejecutivo en PDF para Molinería y Panificación.
Basado en InformeVisitaTecnicaSchema y Pydantic V2.
"""

import os
import sys
import streamlit as st
from PIL import Image

from models.data_models import (
    InformeVisitaTecnicaSchema, Participantes, ParametrosTermicos,
    FormulacionEnsayada, ProcesoMecanico, ReologiaMolino,
    DesempenoPanificadora, RegistroFotoFase, CompromisoAccion
)
from pdf_generator import PDFReportGenerator, process_image_to_b64


st.set_page_config(
    page_title="Informe Técnico de Visita",
    page_icon="🍞",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
    <style>
    .main-header {
        font-size: 24px;
        font-weight: bold;
        color: #1A365D;
        margin-bottom: 0px;
    }
    .sub-header {
        font-size: 14px;
        color: #D69E2E;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 20px;
    }
    </style>
""", unsafe_allow_html=True)


def main():
    st.markdown('<div class="main-header">ASISTENCIA TÉCNICA Y CONTROL DE CALIDAD</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Sistema de Captura de Ensayos y Generación de Informes PDF Ejecutivos</div>', unsafe_allow_html=True)

    # SIDEBAR
    st.sidebar.header("📋 Configuración del Ensayo")
    tipo_cliente = st.sidebar.selectbox(
        "Tipo de Cliente / Planta",
        ["Molino Harinero", "Panificadora Industrial"],
        index=0
    )
    st.sidebar.markdown("---")
    st.sidebar.info("💡 Complete los datos técnicos en las pestañas. El informe se compilará cumpliendo el esquema Pydantic oficial y la paleta de colores requerida.")

    # PESTAÑAS
    tab_meta, tab_recipe, tab_tech, tab_photos, tab_actions, tab_preview = st.tabs([
        "1. Metadatos & Visita",
        "2. Formulación & Proceso",
        "3. Módulo Técnico",
        "4. Tríptico Fotográfico",
        "5. Plan de Acción",
        "📄 Descargar PDF"
    ])

    # 1. METADATOS
    with tab_meta:
        st.subheader("1. Identificación de la Visita y Participantes")
        col1, col2 = st.columns(2)
        with col1:
            empresa_cliente = st.text_input("Empresa / Cliente", value="Panificadora Industrial San Juan S.A." if tipo_cliente == "Panificadora Industrial" else "Molino Harinero Central S.A.")
            planta_ubicacion = st.text_input("Planta Industrial y Ubicación", value="Planta Central - San Martín, B.A.")
            fecha_visita = st.date_input("Fecha de Visita").strftime("%Y-%m-%d")
        with col2:
            codigo_ensayo = st.text_input("Código de Ensayo", value="ENS-2026-089")
            participantes_cli = st.text_input("Participantes Cliente (separados por coma)", value="Ing. Carlos Mendoza (Jefe Planta), Lic. Sofía Paez (Calidad)")
            participantes_ase = st.text_input("Asesor Técnico (separados por coma)", value="Ing. Juan Manuel Maldonado (Asesor Técnico)")

        resumen_ejecutivo = st.text_area(
            "Resumen Ejecutivo & Diagnóstico General",
            value=(
                "Se realizó la evaluación técnica post-visita en planta para optimizar la respuesta del gluten "
                "y mejorar la absorción de agua en líneas continuas. Los resultados demuestran excelente estabilidad "
                "y respuesta positiva a los aditivos enzimáticos formulados."
            ),
            height=100
        )

        cli_list = [x.strip() for x in participantes_cli.split(",") if x.strip()]
        ase_list = [x.strip() for x in participantes_ase.split(",") if x.strip()]
        participantes_obj = Participantes(cliente=cli_list, asesor_tecnico=ase_list)

    # 2. FORMULACIÓN Y PROCESO
    with tab_recipe:
        st.subheader("2. Receta Base, Complejo Enzimático y Parámetros Térmicos/Mecánicos")
        col_r1, col_r2 = st.columns(2)
        
        with col_r1:
            st.markdown("##### 🍞 Formulación Base & Aditivos")
            harina_base_nombre = st.text_input("Harina Base Nombre", value="Harina 0000 Panificable Superior")
            absorcion_agua_porc = st.number_input("Absorción de Agua (%)", value=61.8, step=0.5)
            sal_porc = st.number_input("Sal (%)", value=2.0, step=0.1)
            levadura_fresca_porc = st.number_input("Levadura Fresca (%)", value=3.0, step=0.1)

            st.markdown("##### 🧪 Complejo de Aditivos y Enzimas (Dosis)")
            adit_text = st.text_area(
                "Aditivos (uno por línea)",
                value="Alfa A 100.000 skb: 15 ppm\nAlmidón pregelatinizado Buffalo: 1.5%\nPropionato de Calcio: 0.35%\nGranozyme AFH: 25 ppm\nL-Cisteína: 10 ppm",
                height=110
            )
            aditivos_list = [x.strip() for x in adit_text.split("\n") if x.strip()]

        with col_r2:
            st.markdown("##### 🌡️ Parámetros Térmicos (°C)")
            temp_agua_c = st.number_input("Tº Agua (°C)", value=8.0, step=0.5)
            temp_harina_c = st.number_input("Tº Harina (°C)", value=20.0, step=0.5)
            temp_ambiente_c = st.number_input("Tº Ambiente (°C)", value=22.0, step=0.5)
            temp_masa_final_c = st.number_input("Tº Masa Final (°C)", value=24.5, step=0.5)

            st.markdown("##### ⏱️ Tiempos Mecánicos & Horneado")
            tiempo_amasado_vel1_min = st.number_input("Amasado Vel. 1 (min)", value=3.0, step=0.5)
            tiempo_amasado_vel2_min = st.number_input("Amasado Vel. 2 (min)", value=7.0, step=0.5)
            tiempo_descanso_min = st.number_input("Reposo Mesa (min)", value=10.0, step=1.0)
            tiempo_fermentacion_min = st.number_input("Fermentación Total (min)", value=120.0, step=5.0)
            temp_fermentacion_c = st.number_input("Cámara Temp (°C)", value=28.0, step=1.0)
            humedad_relativa_porc = st.number_input("Cámara Humedad (%)", value=75.0, step=1.0)
            horneado_temp_c = st.number_input("Tº Horneado (°C)", value=220.0, step=5.0)
            horneado_tiempo_min = st.number_input("Tiempo Horneado (min)", value=25.0, step=1.0)
            vapor_segundos = st.number_input("Vapor Horno (seg)", value=5, step=1)

        temperaturas_obj = ParametrosTermicos(
            temp_agua_c=temp_agua_c, temp_harina_c=temp_harina_c,
            temp_ambiente_c=temp_ambiente_c, temp_masa_final_c=temp_masa_final_c
        )

        formulacion_obj = FormulacionEnsayada(
            harina_base_nombre=harina_base_nombre, absorcion_agua_porc=absorcion_agua_porc,
            sal_porc=sal_porc, levadura_fresca_porc=levadura_fresca_porc, aditivos_enzimas=aditivos_list
        )

        proceso_obj = ProcesoMecanico(
            tiempo_amasado_vel1_min=tiempo_amasado_vel1_min, tiempo_amasado_vel2_min=tiempo_amasado_vel2_min,
            tiempo_descanso_min=tiempo_descanso_min, tiempo_fermentacion_min=tiempo_fermentacion_min,
            temp_fermentacion_c=temp_fermentacion_c, humedad_relativa_porc=humedad_relativa_porc,
            horneado_temp_c=horneado_temp_c, horneado_tiempo_min=horneado_tiempo_min, vapor_segundos=int(vapor_segundos)
        )

    # 3. MÓDULO TÉCNICO CONDICIONAL
    with tab_tech:
        if tipo_cliente == "Molino Harinero":
            st.subheader("3. Módulo Técnico Especializado — Control de Laboratorio de Molino")
            col_m1, col_m2 = st.columns(2)
            with col_m1:
                alveografo_w = st.number_input("Alveógrafo Chopin W (10⁻⁴ J)", value=270, step=5)
                alveografo_pl = st.number_input("Alveógrafo Relación P/L", value=0.95, step=0.05)
                falling_number_seg = st.number_input("Falling Number Hagberg (seg)", value=280, step=5)
            with col_m2:
                gluten_humedo_porc = st.number_input("Gluten Húmedo (%)", value=30.5, step=0.5)
                gluten_index = st.number_input("Gluten Index (0-100)", value=88, step=1)
                cenizas_porc = st.number_input("Contenido de Cenizas (%)", value=0.62, step=0.01)

            datos_molino_obj = ReologiaMolino(
                alveografo_w=int(alveografo_w), alveografo_pl=alveografo_pl,
                falling_number_seg=int(falling_number_seg), gluten_humedo_porc=gluten_humedo_porc,
                gluten_index=int(gluten_index), cenizas_porc=cenizas_porc
            )
            datos_panificadora_obj = None
        else:
            st.subheader("3. Módulo Técnico Especializado — Variables Operativas de Panificadora")
            col_p1, col_p2 = st.columns(2)
            with col_p1:
                maquinabilidad = st.selectbox(
                    "Maquinabilidad en Rodillos / Formadora",
                    ["Excelente (Sin adhesividad)", "Buena (Poco desarrollo requerido)", "Regular (Masa tenaz)", "Deficiente (Masa pegajosa)"],
                    index=0
                )
                tolerancia_fermentacion = st.selectbox(
                    "Tolerancia en Fermentación",
                    ["Alta (Soporta sobrefermentación >30 min)", "Normal (Estándar de proceso)", "Sensible (Tendencia al colapso)"],
                    index=0
                )
            with col_p2:
                salto_horno = st.selectbox(
                    "Salto de Horno (Oven Spring)",
                    ["Vigoroso (Apertura amplia simétrica)", "Moderado (Corte regular)", "Pobre (Masa sin expansión)"],
                    index=0
                )
                rendimiento_piezas = st.text_input("Rendimiento de Piezas", value="1.45 pz/kg harina")

            datos_molino_obj = None
            datos_panificadora_obj = DesempenoPanificadora(
                maquinabilidad=maquinabilidad, tolerancia_fermentacion=tolerancia_fermentacion,
                salto_horno=salto_horno, rendimiento_piezas=rendimiento_piezas
            )

    # 4. TRÍPTICO FOTOGRÁFICO
    with tab_photos:
        st.subheader("4. Tríptico de Control Visual (3 Fases)")
        col_ph1, col_ph2, col_ph3 = st.columns(3)

        with col_ph1:
            st.markdown("#### Fase 1: Amasado")
            img_file_1 = st.file_uploader("Foto Amasado", type=["jpg", "png", "jpeg"], key="ph1")
            obs_1 = st.text_area("Observación Amasado", value="Desarrollo completo de gluten, membrana translúcida y lisa.", key="obs1")
            b64_1 = process_image_to_b64(img_file_1) if img_file_1 else None

        with col_ph2:
            st.markdown("#### Fase 2: Crudo / Fermentado")
            img_file_2 = st.file_uploader("Foto Crudo/Fermentado", type=["jpg", "png", "jpeg"], key="ph2")
            obs_2 = st.text_area("Observación Fermentación", value="Tensión superficial estable con retención óptima de gas.", key="obs2")
            b64_2 = process_image_to_b64(img_file_2) if img_file_2 else None

        with col_ph3:
            st.markdown("#### Fase 3: Horneado / Miga")
            img_file_3 = st.file_uploader("Foto Horneado/Miga", type=["jpg", "png", "jpeg"], key="ph3")
            obs_3 = st.text_area("Observación Miga", value="Alveolado pareja de paredes delgadas y miga suave elástica.", key="obs3")
            b64_3 = process_image_to_b64(img_file_3) if img_file_3 else None

        registro_foto_list = [
            RegistroFotoFase(fase="Amasado", observacion_tecnica=obs_1, imagen_base64_o_url=b64_1),
            RegistroFotoFase(fase="Crudo_Fermentado", observacion_tecnica=obs_2, imagen_base64_o_url=b64_2),
            RegistroFotoFase(fase="Horneado_Miga", observacion_tecnica=obs_3, imagen_base64_o_url=b64_3)
        ]

    # 5. PLAN DE ACCIÓN
    with tab_actions:
        st.subheader("5. Matriz de Plan de Acción & Compromisos")
        plan_accion_list = []
        default_actions = [
            ("Ajustar hidratación en +1.5% en amasadora continua", "Jefe de Planta / Operador", "2026-09-01", "Verificar absorción sin pegajosidad en cinta"),
            ("Incorporar 15 ppm de Alfa-Amilasa al complejo molinero", "Asesor Técnico / Molino", "2026-09-04", "Lograr Falling Number objetivo entre 250s y 270s"),
            ("Monitorear temperatura final de masa (≤ 25°C)", "Control de Calidad Planta", "2026-09-10", "Disminuir fluctuaciones de fermentación en turnos")
        ]

        for i in range(1, 4):
            st.markdown(f"##### Compromiso #{i}")
            col_a1, col_a2, col_a3, col_a4 = st.columns([3, 2, 2, 3])
            def_act, def_resp, def_date, def_crit = default_actions[i-1]

            with col_a1:
                act = st.text_input(f"Acción #{i}", value=def_act, key=f"act_{i}")
            with col_a2:
                resp = st.text_input(f"Responsable #{i}", value=def_resp, key=f"resp_{i}")
            with col_a3:
                deadline = st.text_input(f"Fecha Límite #{i}", value=def_date, key=f"date_{i}")
            with col_a4:
                crit = st.text_input(f"Criterio Éxito #{i}", value=def_crit, key=f"crit_{i}")

            plan_accion_list.append(CompromisoAccion(accion=act, responsable=resp, fecha_limite=deadline, criterio_exito=crit))

    # 6. PREVISUALIZACIÓN Y DESCARGA PDF
    with tab_preview:
        st.subheader("📄 Renderizar y Descargar PDF")

        report_data = InformeVisitaTecnicaSchema(
            tipo_cliente=tipo_cliente,
            empresa_cliente=empresa_cliente,
            planta_ubicacion=planta_ubicacion,
            fecha_visita=fecha_visita,
            codigo_ensayo=codigo_ensayo,
            participantes=participantes_obj,
            resumen_ejecutivo=resumen_ejecutivo,
            temperaturas=temperaturas_obj,
            formulacion=formulacion_obj,
            proceso=proceso_obj,
            datos_molino=datos_molino_obj,
            datos_panificadora=datos_panificadora_obj,
            registro_fotografico=registro_foto_list,
            plan_de_accion=plan_accion_list
        )

        if st.button("🚀 Renderizar Informe PDF Ejecutivo", type="primary"):
            try:
                generator = PDFReportGenerator(template_dir="templates")
                pdf_bytes = generator.render_pdf_bytes(report_data)
                
                st.success("✔ Informe PDF compilado con éxito. Descárguelo haciendo clic en el botón a continuación:")
                file_name = f"Informe_Tecnico_{tipo_cliente.replace(' ', '_')}_{codigo_ensayo}.pdf"
                st.download_button(
                    label="📥 Descargar Informe Técnico PDF",
                    data=pdf_bytes,
                    file_name=file_name,
                    mime="application/pdf",
                    use_container_width=True
                )
            except Exception as e:
                st.error(f"❌ Error al renderizar PDF: {e}")
                import traceback
                st.code(traceback.format_exc())


if __name__ == "__main__":
    main()
