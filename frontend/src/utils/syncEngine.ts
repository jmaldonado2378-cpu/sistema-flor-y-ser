/**
 * SyncEngine - Sincronización Automática de Datos Locales (localStorage) a MySQL
 * 
 * Permite que los datos cargados por usuarios (ej. Emilia o Juan Pablo) mientras el sistema
 * operó en modo local se suban e inserten automáticamente en MySQL al restablecerse la conexión.
 */

export async function syncLocalStorageToMySQL(): Promise<{ syncedCustomers: number; syncedOrders: number }> {
  let syncedCustomers = 0;
  let syncedOrders = 0;

  const token = localStorage.getItem('floryser_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    // 1. Verificación de salud de MySQL
    const statusRes = await fetch('/api/v1/system/db-status', { headers });
    if (!statusRes.ok) return { syncedCustomers, syncedOrders };
    
    const statusData = await statusRes.json();
    if (!statusData?.data?.connected) return { syncedCustomers, syncedOrders };

    // 2. Sincronizar Clientes locales
    const localCustStr = localStorage.getItem('floryser_customers_v2') || localStorage.getItem('customers');
    if (localCustStr) {
      try {
        const localCustomers: any[] = JSON.parse(localCustStr);
        if (Array.isArray(localCustomers) && localCustomers.length > 0) {
          // Obtener clientes de MySQL
          const apiCustRes = await fetch('/api/v1/customers', { headers });
          let dbCustomers: any[] = [];
          if (apiCustRes.ok) {
            const json = await apiCustRes.json();
            dbCustomers = json.data || json;
          }

          for (const cust of localCustomers) {
            if (!cust.name) continue;
            // Comprobar si ya existe en la BD por nombre o teléfono
            const exists = dbCustomers.some((dbc: any) => 
              dbc.name?.toLowerCase() === cust.name?.toLowerCase() ||
              (dbc.phone && cust.phone && dbc.phone === cust.phone)
            );

            if (!exists) {
              console.log(`🔄 Sincronizando cliente local "${cust.name}" hacia MySQL...`);
              const createRes = await fetch('/api/v1/customers', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  name: cust.name,
                  phone: cust.phone || '',
                  email: cust.email || '',
                  address: cust.address || '',
                  channelPreference: cust.channelPreference || 'WhatsApp',
                  customerSegment: cust.customerSegment || 'Frecuente',
                  dietaryProfiles: cust.dietaryProfiles || [],
                  notes: cust.notes || 'Sincronizado automáticamente desde almacenamiento local'
                })
              });
              if (createRes.ok) syncedCustomers++;
            }
          }
        }
      } catch (e) {
        console.error('Error al sincronizar clientes locales:', e);
      }
    }

    // 3. Sincronizar Ventas / Pedidos locales
    const localOrdersStr = localStorage.getItem('floryser_sales_orders');
    if (localOrdersStr) {
      try {
        const localOrders: any[] = JSON.parse(localOrdersStr);
        if (Array.isArray(localOrders) && localOrders.length > 0) {
          const apiOrdersRes = await fetch('/api/v1/sales/orders', { headers });
          let dbOrders: any[] = [];
          if (apiOrdersRes.ok) {
            const json = await apiOrdersRes.json();
            dbOrders = json.data || json;
          }

          for (const order of localOrders) {
            if (!order.items || order.items.length === 0) continue;
            const exists = dbOrders.some((dbo: any) => dbo.id === order.id || dbo.orderNumber === order.orderNumber);

            if (!exists) {
              console.log(`🔄 Sincronizando pedido local "${order.orderNumber || order.id}" hacia MySQL...`);
              const createRes = await fetch('/api/v1/sales/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  customerId: order.customerId,
                  salesChannel: order.salesChannel || 'LOCAL',
                  sellerId: order.sellerId || 'usr-seller-1',
                  sellerName: order.sellerName || 'Emilia Maldonado',
                  items: order.items,
                  subtotal: order.subtotal || 0,
                  total: order.total || 0,
                  paymentMethod: order.paymentMethod || 'EFECTIVO'
                })
              });
              if (createRes.ok) syncedOrders++;
            }
          }
        }
      } catch (e) {
        console.error('Error al sincronizar pedidos locales:', e);
      }
    }
  } catch (e) {
    console.error('Error en SyncEngine:', e);
  }

  return { syncedCustomers, syncedOrders };
}
