"""
test_generator.py
Suite de Verificación Automatizada para InformeVisitaTecnicaSchema.
"""

import os
import sys
from io import BytesIO
from PIL import Image, ImageDraw
from pypdf import PdfReader

from models.data_models import (
    InformeVisitaTecnicaSchema, Participantes, ParametrosTermicos,
    FormulacionEnsayada, ProcesoMecanico, ReologiaMolino,
    DesempenoPanificadora, RegistroFotoFase, CompromisoAccion
)
from pdf_generator import PDFReportGenerator, process_image_to_b64


def create_sample_photo(title: str, text: str) -> str:
    """Crea una imagen de prueba temporal y devuelve su cadena Base64."""
    img = Image.new("RGB", (400, 300), color=(240, 225, 200))
    draw = ImageDraw.Draw(img)
    draw.rectangle([30, 30, 370, 270], fill=(180, 110, 50), outline=(26, 54, 93), width=3)
    draw.text((80, 130), f"{title}\n{text}", fill=(255, 255, 255))
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return process_image_to_b64(buf)


def run_tests():
    print("=========================================================================")
    print(" AUTOMATED VERIFICATION SUITE — INFORME VISITA TECNICA SCHEMA")
    print("=========================================================================")
    
    test_pdf_molino = os.path.abspath("test_report_molino.pdf")
    test_pdf_panificadora = os.path.abspath("test_report_panificadora.pdf")

    generator = PDFReportGenerator(template_dir="templates")

    triptych = [
        RegistroFotoFase(fase="Amasado", observacion_tecnica="Desarrollo completo de la red de gluten.", imagen_base64_o_url=create_sample_photo("FASE 1", "Amasado")),
        RegistroFotoFase(fase="Crudo_Fermentado", observacion_tecnica="Buena retención de gas CO2 sin colapso.", imagen_base64_o_url=create_sample_photo("FASE 2", "Fermentacion")),
        RegistroFotoFase(fase="Horneado_Miga", observacion_tecnica="Alveolado uniforme y miga elástica.", imagen_base64_o_url=create_sample_photo("FASE 3", "Miga"))
    ]

    actions = [
        CompromisoAccion(accion="Ajustar hidratación en +1.5%", responsable="Jefe de Planta", fecha_limite="2026-09-01", criterio_exito="Sin pegajosidad en cinta"),
        CompromisoAccion(accion="Adicionar 15 ppm Alfa-Amilasa", responsable="Asesor Técnico", fecha_limite="2026-09-04", criterio_exito="Falling Number entre 250s y 270s"),
        CompromisoAccion(accion="Controlar T final masa <=25°C", responsable="Control Calidad", fecha_limite="2026-09-10", criterio_exito="Fermentación estable en turnos")
    ]

    # -------------------------------------------------------------------------
    # TEST 1: Generación para Molino Harinero
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Generando informe para 'Molino Harinero'...")
    data_molino = InformeVisitaTecnicaSchema(
        tipo_cliente="Molino Harinero",
        empresa_cliente="Molino Harinero Central S.A.",
        datos_molino=ReologiaMolino(alveografo_w=280, alveografo_pl=0.90, falling_number_seg=275),
        datos_panificadora=None,
        registro_fotografico=triptych,
        plan_de_accion=actions
    )

    success_m = generator.generate_pdf(data_molino, test_pdf_molino)
    assert success_m, "Falla en informe de Molino"
    assert os.path.exists(test_pdf_molino), "PDF Molino no creado"
    size_m = os.path.getsize(test_pdf_molino) / 1024.0
    print(f"  -> PDF Molino creado exitosamente: {size_m:.2f} KB")
    assert size_m > 15, "PDF demasiado pequeño"
    print("  -> TEST 1 PASÓ: Informe de Molino compilado.")

    # -------------------------------------------------------------------------
    # TEST 2: Generación para Panificadora Industrial
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Generando informe para 'Panificadora Industrial'...")
    data_pan = InformeVisitaTecnicaSchema(
        tipo_cliente="Panificadora Industrial",
        empresa_cliente="Panificadora San Juan S.A.",
        datos_molino=None,
        datos_panificadora=DesempenoPanificadora(),
        registro_fotografico=triptych,
        plan_de_accion=actions
    )

    success_p = generator.generate_pdf(data_pan, test_pdf_panificadora)
    assert success_p, "Falla en informe de Panificadora"
    assert os.path.exists(test_pdf_panificadora), "PDF Panificadora no creado"
    size_p = os.path.getsize(test_pdf_panificadora) / 1024.0
    print(f"  -> PDF Panificadora creado exitosamente: {size_p:.2f} KB")
    assert size_p > 15, "PDF demasiado pequeño"
    print("  -> TEST 2 PASÓ: Informe de Panificadora compilado.")

    # -------------------------------------------------------------------------
    # TEST 3: Verificación de Estructura de Páginas con PyPDF
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Validando paginación y estructura PDF...")
    reader_m = PdfReader(test_pdf_molino)
    reader_p = PdfReader(test_pdf_panificadora)
    
    print(f"  -> Páginas Molino: {len(reader_m.pages)}")
    print(f"  -> Páginas Panificadora: {len(reader_p.pages)}")
    
    assert len(reader_m.pages) >= 2, "Se esperaban al menos 2 páginas para Molino"
    assert len(reader_p.pages) >= 2, "Se esperaban al menos 2 páginas para Panificadora"
    print("  -> TEST 3 PASÓ: Estructura de páginas correcta.")

    print("\n=========================================================================")
    print(" ALL VERIFICATION TESTS PASSED SUCCESSFULLY! SOFTWARE IS FULLY READY.")
    print("=========================================================================")


if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[TEST FAILURE] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
