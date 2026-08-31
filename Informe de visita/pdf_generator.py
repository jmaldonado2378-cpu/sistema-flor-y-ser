"""
pdf_generator.py
Motor de compilación de HTML/CSS a PDF para Informes Técnicos de Molinería y Panificación.
Soporta esquema Pydantic InformeVisitaTecnicaSchema.
"""

import os
import base64
from io import BytesIO
from PIL import Image
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

from models.data_models import InformeVisitaTecnicaSchema
from engine.rheology_engine import RheologyEngine


def process_image_to_b64(image_input, max_size=(600, 450)) -> str:
    """Preprocesa y redimensiona automáticamente una imagen recibida (bytes, PIL o ruta) a Base64 PNG."""
    if not image_input:
        return ""
    try:
        if isinstance(image_input, str):
            if image_input.startswith("data:image"):
                return image_input
            if os.path.exists(image_input):
                img = Image.open(image_input)
            else:
                return ""
        elif isinstance(image_input, BytesIO):
            image_input.seek(0)
            img = Image.open(image_input)
        elif hasattr(image_input, "read"):
            img = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            return ""

        img = img.convert("RGB")
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        buf = BytesIO()
        img.save(buf, format="PNG", quality=85)
        buf.seek(0)
        return "data:image/png;base64," + base64.b64encode(buf.read()).decode("utf-8")
    except Exception as e:
        print(f"[WARN] Error al procesar imagen: {e}")
        return ""


class PDFReportGenerator:
    def __init__(self, template_dir: str = "templates"):
        self.template_dir = os.path.abspath(template_dir)
        self.env = Environment(loader=FileSystemLoader(self.template_dir))

    def render_pdf_bytes(self, report_data: InformeVisitaTecnicaSchema) -> bytes:
        """
        Renderiza el informe y devuelve un buffer en bytes del PDF (Ideal para st.download_button).
        """
        engine = RheologyEngine(report_data)
        compliance = engine.evaluate_compliance()
        
        alveogram_b64 = engine.render_alveogram_chart_base64()
        farinogram_b64 = engine.render_farinogram_chart_base64()

        css_path = os.path.join(self.template_dir, "styles.css")
        css_content = ""
        if os.path.exists(css_path):
            with open(css_path, "r", encoding="utf-8") as f:
                css_content = f.read()

        template = self.env.get_template("report_template.html")

        rendered_html = template.render(
            report=report_data,
            compliance=compliance,
            alveogram_img=alveogram_b64,
            farinogram_img=farinogram_b64,
            css_content=css_content
        )

        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            src=BytesIO(rendered_html.encode("utf-8")),
            dest=pdf_buffer,
            encoding="utf-8"
        )

        if pisa_status.err:
            raise RuntimeError(f"Error en compilación PDF: {pisa_status.err}")

        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()

    def generate_pdf(self, report_data: InformeVisitaTecnicaSchema, output_pdf_path: str) -> bool:
        """
        Compila el informe y lo guarda en disco en output_pdf_path.
        """
        try:
            pdf_bytes = self.render_pdf_bytes(report_data)
            output_dir = os.path.dirname(os.path.abspath(output_pdf_path))
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)

            with open(output_pdf_path, "wb") as f:
                f.write(pdf_bytes)

            return True
        except Exception as e:
            print(f"[EXCEPCION] Error al generar PDF en disco: {e}")
            import traceback
            traceback.print_exc()
            return False
