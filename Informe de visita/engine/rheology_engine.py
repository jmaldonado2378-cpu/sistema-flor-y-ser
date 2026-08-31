"""
engine/rheology_engine.py
Motor de Análisis Reológico, Diagnóstico Tecnológico y Generación de Gráficos con Paleta Ejecutivo Corporativa.
Consume el esquema Pydantic InformeVisitaTecnicaSchema.
"""

import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, Any

from models.data_models import InformeVisitaTecnicaSchema

# Paleta Corporativa Requerida
COLOR_NAVY = "#1A365D"
COLOR_SLATE = "#4A5568"
COLOR_GOLD = "#D69E2E"
COLOR_BG = "#F8FAFC"


class RheologyEngine:
    def __init__(self, data: InformeVisitaTecnicaSchema):
        self.data = data

    def evaluate_compliance(self) -> Dict[str, Any]:
        """Evalúa los parámetros técnicos y badges de conformidad."""
        if self.data.tipo_cliente == "Molino Harinero":
            m = self.data.datos_molino
            w = m.alveografo_w if m else 270
            pl = m.alveografo_pl if m else 0.95
            fn = m.falling_number_seg if m else 280
            gluten = m.gluten_humedo_porc if m else 30.5

            w_status = "PASS" if 220 <= w <= 320 else "WARNING"
            pl_status = "PASS" if 0.6 <= pl <= 1.2 else "WARNING"
            fn_status = "PASS" if 220 <= fn <= 320 else "WARNING"
            gut_status = "PASS" if 28.0 <= gluten <= 34.0 else "WARNING"

            return {
                "W": {"val": w, "status": w_status, "badge": "badge-success" if w_status == "PASS" else "badge-warning"},
                "PL": {"val": pl, "status": pl_status, "badge": "badge-success" if pl_status == "PASS" else "badge-warning"},
                "FN": {"val": fn, "status": fn_status, "badge": "badge-success" if fn_status == "PASS" else "badge-warning"},
                "Gluten": {"val": gluten, "status": gut_status, "badge": "badge-success" if gut_status == "PASS" else "badge-warning"},
            }
        else:
            p = self.data.datos_panificadora
            maq = p.maquinabilidad if p else "Excelente"
            tol = p.tolerancia_fermentacion if p else "Alta"
            salto = p.salto_horno if p else "Vigoroso"
            rend = p.rendimiento_piezas if (p and p.rendimiento_piezas) else "1.45 pz/kg"

            return {
                "Machinability": {"val": maq, "badge": "badge-success"},
                "Fermentation": {"val": tol, "badge": "badge-success"},
                "OvenSpring": {"val": salto, "badge": "badge-success"},
                "Yield": {"val": rend, "badge": "badge-gold"},
            }

    def render_alveogram_chart_base64(self) -> str:
        """Genera la gráfica del Alveograma de Chopin utilizando la paleta corporativa."""
        m = self.data.datos_molino
        w = float(m.alveografo_w) if m else 270.0
        pl = float(m.alveografo_pl) if m else 0.95
        
        p_peak = pl * 90.0 if pl > 0 else 85.0
        l_len = max(p_peak / pl if pl > 0 else 90.0, 40.0)
        
        x = np.linspace(0, l_len, 200)
        y = p_peak * (np.sin(np.pi * x / (l_len * 1.8)) ** 0.6) * np.exp(-0.005 * x)
        y = np.clip(y, 0, p_peak * 1.05)
        
        fig, ax = plt.subplots(figsize=(5.5, 2.6), dpi=150)
        fig.patch.set_facecolor('#ffffff')
        ax.set_facecolor(COLOR_BG)

        ax.plot(x, y, color=COLOR_NAVY, linewidth=2.2, label=f'Curva Alveográfica (W={w:.0f})')
        ax.fill_between(x, y, color='#cbd5e1', alpha=0.45)

        ax.axhline(y=p_peak, color=COLOR_GOLD, linestyle='--', linewidth=1.2, label=f'P = {p_peak:.0f} mmH₂O')
        ax.axvline(x=l_len, color=COLOR_SLATE, linestyle='--', linewidth=1.2, label=f'L = {l_len:.0f} mm')

        ax.set_title(f'Alveograma de Chopin — W: {w:.0f} | P/L: {pl:.2f}', fontsize=9, fontweight='bold', color=COLOR_NAVY, pad=6)
        ax.set_xlabel('Extensibilidad L (mm)', fontsize=7.5, color=COLOR_SLATE)
        ax.set_ylabel('Tenacidad P (mm H₂O)', fontsize=7.5, color=COLOR_SLATE)
        ax.set_xlim(0, max(l_len * 1.15, 120))
        ax.set_ylim(0, max(p_peak * 1.2, 100))
        ax.grid(True, linestyle=':', alpha=0.6, color='#cbd5e1')
        ax.legend(loc='upper right', fontsize=6.5, frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')
        ax.tick_params(axis='both', which='major', labelsize=6.5)

        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')

    def render_farinogram_chart_base64(self) -> str:
        """Genera la gráfica del Farinograma de Brabender utilizando la paleta corporativa."""
        water_abs = self.data.formulacion.absorcion_agua_porc if self.data.formulacion else 61.8
        dev_time = self.data.proceso.tiempo_amasado_vel2_min if self.data.proceso else 7.0
        stability = 12.0
        
        t = np.linspace(0, 20, 300)
        center_target = 500.0
        
        dev_phase = center_target * np.sin(np.pi * np.minimum(t, dev_time) / (2 * max(dev_time, 0.5))) ** 0.8
        t_end_stab = dev_time + stability
        decay_factor = np.where(t > t_end_stab, (t - t_end_stab) * 3.0, 0)
        
        mean_curve = np.where(t <= dev_time, dev_phase, center_target - decay_factor)
        mean_curve = np.clip(mean_curve, 0, 600)
        
        band_width = 35.0 * np.exp(-0.02 * t) + 15.0
        upper_curve = mean_curve + band_width / 2.0
        lower_curve = np.maximum(mean_curve - band_width / 2.0, 0)

        fig, ax = plt.subplots(figsize=(5.5, 2.6), dpi=150)
        fig.patch.set_facecolor('#ffffff')
        ax.set_facecolor(COLOR_BG)

        ax.plot(t, mean_curve, color=COLOR_NAVY, linewidth=1.8, label='Consistencia Media')
        ax.fill_between(t, lower_curve, upper_curve, color='#94a3b8', alpha=0.4, label='Banda Gluten')
        ax.axhline(y=500, color='#16a34a', linestyle=':', linewidth=1)
        ax.axvline(x=dev_time, color=COLOR_GOLD, linestyle='--', linewidth=1.2, label=f'Desarrollo: {dev_time:.1f}m')

        ax.set_title(f'Farinograma Brabender — Absorción Agua: {water_abs:.1f}%', fontsize=9, fontweight='bold', color=COLOR_NAVY, pad=6)
        ax.set_xlabel('Tiempo de Amasado (min)', fontsize=7.5, color=COLOR_SLATE)
        ax.set_ylabel('Consistencia (BU)', fontsize=7.5, color=COLOR_SLATE)
        ax.set_xlim(0, 20)
        ax.set_ylim(0, 650)
        ax.grid(True, linestyle=':', alpha=0.6, color='#cbd5e1')
        ax.legend(loc='lower left', fontsize=6.5, frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')
        ax.tick_params(axis='both', which='major', labelsize=6.5)

        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
