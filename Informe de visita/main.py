"""
main.py
Punto de Entrada CLI para el Sistema de Emisión Automatizada de Informes Técnicos.
"""

import os
import sys
import json
import argparse

from models.data_models import TechnicalReportData
from pdf_generator import PDFReportGenerator


def main():
    parser = argparse.ArgumentParser(description="Generador Automatizado de Informes Técnicos de Panificación y Molinería")
    parser.add_argument("--sample", type=str, default="sample_data.json", help="Ruta al archivo JSON con los datos de la muestra")
    parser.add_argument("--output", type=str, default="informe_tecnico_panificacion.pdf", help="Ruta de salida para el PDF generado")
    
    args = parser.parse_args()

    sample_path = os.path.abspath(args.sample)
    output_path = os.path.abspath(args.output)

    print("=========================================================================")
    print(" SISTEMA DE EMISIÓN DE INFORMES TÉCNICOS DE PANIFICACIÓN Y MOLINERÍA")
    print("=========================================================================")
    print(f"[*] Cargando datos desde: {sample_path}")

    if not os.path.exists(sample_path):
        print(f"[ERROR] El archivo de datos no existe: {sample_path}")
        sys.exit(1)

    try:
        with open(sample_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        report_data = TechnicalReportData.from_dict(raw_data)
        generator = PDFReportGenerator(template_dir="templates")

        print(f"[*] Procesando curvas reológicas y generando PDF...")
        success = generator.generate_pdf(report_data, output_path)

        if success:
            print(f"[✔] Proceso finalizado con éxito. PDF creado en:")
            print(f"    -> {output_path}")
        else:
            print("[✘] Error durante la compilación del informe PDF.")
            sys.exit(1)

    except Exception as e:
        print(f"[EXCEPCIÓN CRÍTICA] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
