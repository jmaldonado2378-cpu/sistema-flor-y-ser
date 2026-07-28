import { createIcons, icons } from 'lucide';
import JsBarcode from 'jsbarcode';

window.lucide = {
  createIcons: (opts) => {
    try {
      createIcons({
        icons,
        ...(opts || {})
      });
    } catch (err) {
      console.warn('Lucide icon warning:', err);
    }
  }
};

window.JsBarcode = JsBarcode;
