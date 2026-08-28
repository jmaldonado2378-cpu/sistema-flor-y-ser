import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Award, CheckCircle, Calendar, DollarSign, 
  Users, Filter, Printer, Download, ArrowUpRight, ArrowDownRight, 
  PieChart, BarChart2, Package, ShoppingBag, ShieldCheck, RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getPendingCommissions, 
  settleCommissions, 
  getCommissionSettlements, 
  getProfitabilityMonitor,
  getSellerCommissionRates,
  updateSellerCommissionRate,
  PendingCommissionsReport,
  CommissionSettlement,
  ProfitabilityReport,
  SellerChannelRate
} from '../api/commissions';

export const CommissionsAndProfitabilityPage: React.FC = () => {
  const { users, user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'settlements' | 'profitability' | 'settings'>('settlements');

  // Filtros de Comisiones
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pendingData, setPendingData] = useState<PendingCommissionsReport | null>(null);
  const [settlements, setSettlements] = useState<CommissionSettlement[]>([]);
  const [settling, setSettling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Monitor P&L
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityReport | null>(null);
  const [profitView, setProfitView] = useState<'product' | 'volume' | 'channel' | 'seller'>('product');
  const [loadingProfit, setLoadingProfit] = useState(false);

  // Configuración de Tarifas por Canal
  const [configUserId, setConfigUserId] = useState<string>(currentUser?.id || '');
  const [configRates, setConfigRates] = useState<SellerChannelRate[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Cargar comisiones pendientes
  const loadCommissionsData = async () => {
    try {
      const pending = await getPendingCommissions(selectedUserId || undefined);
      setPendingData(pending);
      const history = await getCommissionSettlements();
      setSettlements(history);
    } catch (e) {
      console.error('Error cargando comisiones:', e);
    }
  };

  // Cargar monitor P&L
  const loadProfitabilityData = async () => {
    setLoadingProfit(true);
    try {
      const data = await getProfitabilityMonitor();
      setProfitabilityData(data);
    } catch (e) {
      console.error('Error cargando P&L:', e);
    } finally {
      setLoadingProfit(false);
    }
  };

  // Cargar configuración de tarifas
  const loadConfigRates = async (userId: string) => {
    if (!userId) return;
    try {
      const rates = await getSellerCommissionRates(userId);
      setConfigRates(rates);
    } catch (e) {
      console.error('Error cargando tarifas:', e);
    }
  };

  useEffect(() => {
    loadCommissionsData();
    loadProfitabilityData();
  }, [selectedUserId]);

  useEffect(() => {
    if (configUserId) {
      loadConfigRates(configUserId);
    }
  }, [configUserId]);

  // Ejecutar liquidación
  const handleSettle = async () => {
    if (!pendingData || pendingData.orders.length === 0) return;
    setSettling(true);
    try {
      const targetUser = users.find(u => u.id === selectedUserId) || currentUser;
      const settlement = await settleCommissions({
        userId: targetUser?.id || 'usr-seller-1',
        userName: targetUser?.name || 'Vendedor',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        paymentMethod,
        notes: settlementNotes
      });

      setSuccessMessage(`✅ Liquidación completada exitosamente (${settlement.totalCommissionAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}). Gasto operativo registrado.`);
      setShowSettleModal(false);
      setSettlementNotes('');
      loadCommissionsData();
      loadProfitabilityData();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      alert(`Error al liquidar comisiones: ${e.message}`);
    } finally {
      setSettling(false);
    }
  };

  // Guardar porcentaje de comisión por canal
  const handleSaveRate = async (channel: string, pct: number) => {
    if (!configUserId) return;
    setSavingConfig(true);
    try {
      await updateSellerCommissionRate(configUserId, channel, pct);
      await loadConfigRates(configUserId);
    } catch (e) {
      alert('Error guardando tarifa');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Libre Caslon Text', serif", fontSize: '26px', color: '#18261E', margin: '0 0 4px 0', fontWeight: 700 }}>
            Comisiones de Venta & Monitor de Ganancias
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Gestión de liquidaciones por vendedor e inteligencia financiera P&L en tiempo real
          </p>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            color: '#334155',
            border: '1px solid #CBD5E1',
            padding: '10px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Printer size={16} /> Imprimir / PDF
        </button>
      </div>

      {/* Alerta de Éxito */}
      {successMessage && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
          {successMessage}
        </div>
      )}

      {/* Selector de Pestañas Principales */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('settlements')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'settlements' ? '#2E5339' : '#64748B',
            borderBottom: activeTab === 'settlements' ? '3px solid #2E5339' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Award size={18} /> Liquidación de Comisiones
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'profitability' ? '#2E5339' : '#64748B',
            borderBottom: activeTab === 'profitability' ? '3px solid #2E5339' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={18} /> Monitor de Ganancias (P&L Real-Time)
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'settings' ? '#2E5339' : '#64748B',
            borderBottom: activeTab === 'settings' ? '3px solid #2E5339' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <DollarSign size={18} /> Configuración de % por Canal
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: LIQUIDACIÓN DE COMISIONES */}
      {/* ========================================================================= */}
      {activeTab === 'settlements' && (
        <div>
          {/* Filtro por Vendedor */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Filter size={18} color="#64748B" />
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Filtrar por Vendedor / Usuario:</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
              >
                <option value="">Todos los Vendedores</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadCommissionsData}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
            >
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {/* Tarjetas KPI de Comisiones */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Ventas Totales Cobradas</span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '8px 0 0 0' }}>
                {(pendingData?.totalSalesAmount || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
              <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                Solo pedidos PAGADOS
              </span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Pedidos Pendientes de Liquidar</span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '8px 0 0 0' }}>
                {pendingData?.orders.length || 0} pedidos
              </h2>
              <span style={{ fontSize: '12px', color: '#0369A1', backgroundColor: '#F0F9FF', padding: '2px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                Devengados sin abonar
              </span>
            </div>

            <div style={{ backgroundColor: '#F0F7F2', padding: '20px', borderRadius: '16px', border: '1px solid #BBF7D0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Comisión Devengada a Pagar</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#2E5339', margin: '8px 0 0 0' }}>
                {(pendingData?.totalPendingCommission || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
              {pendingData && pendingData.orders.length > 0 && (
                <button
                  onClick={() => setShowSettleModal(true)}
                  style={{ marginTop: '12px', width: '100%', backgroundColor: '#2E5339', color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Award size={16} /> Liquidar y Pagar Comisión
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Ventas Devengadas Pendientes */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
              Ventas Cobradas Pendientes de Liquidación
            </h3>

            {pendingData && pendingData.orders.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '12px' }}>N° Pedido</th>
                    <th style={{ padding: '12px' }}>Fecha</th>
                    <th style={{ padding: '12px' }}>Vendedor</th>
                    <th style={{ padding: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px' }}>Canal</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Venta</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingData.orders.map(ord => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#2E5339' }}>{ord.orderNumber}</td>
                      <td style={{ padding: '12px', color: '#64748B' }}>{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{ord.sellerName}</td>
                      <td style={{ padding: '12px' }}>{ord.customerName}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '12px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '6px' }}>
                          {ord.channel}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        {ord.totalAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                        {ord.commissionAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0' }}>No hay ventas cobradas pendientes de liquidación en este período.</p>
            )}
          </div>

          {/* Historial de Liquidaciones Anteriores */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
              Historial de Liquidaciones Registradas
            </h3>

            {settlements.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '12px' }}>Fecha Liquidación</th>
                    <th style={{ padding: '12px' }}>Vendedor</th>
                    <th style={{ padding: '12px' }}>Período</th>
                    <th style={{ padding: '12px' }}>Pedidos</th>
                    <th style={{ padding: '12px' }}>Medio de Pago</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Ventas</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto Comisión Liquidada</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(st => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', color: '#64748B' }}>{new Date(st.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{st.userName}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{st.periodStart} al {st.periodEnd}</td>
                      <td style={{ padding: '12px' }}>{st.ordersCount} pedidos</td>
                      <td style={{ padding: '12px' }}>{st.paymentMethod}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{st.totalPaidSalesAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                        {st.totalCommissionAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0' }}>No se registraron liquidaciones previas.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: MONITOR DE GANANCIAS (P&L REAL-TIME) */}
      {/* ========================================================================= */}
      {activeTab === 'profitability' && profitabilityData && (
        <div>
          {/* Tarjetas KPI de Estado de Resultados (P&L) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Ingresos Brutos (Ventas)</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: '6px 0 0 0' }}>
                {profitabilityData.totalGrossRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Costo Directo (CMV / Insumos)</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#DC2626', margin: '6px 0 0 0' }}>
                -{profitabilityData.totalDirectCostsCMV.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Gastos Operativos Totales</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#D97706', margin: '6px 0 0 0' }}>
                -{profitabilityData.totalOperationalExpenses.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
            </div>

            <div style={{ backgroundColor: '#F0F7F2', padding: '20px', borderRadius: '16px', border: '2px solid #86EFAC' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>GANANCIA NETA REAL</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#2E5339', margin: '6px 0 0 0' }}>
                {profitabilityData.netProfit.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </h2>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', marginTop: '6px', display: 'inline-block' }}>
                Margen Neto: {profitabilityData.netMarginPercentage}%
              </span>
            </div>
          </div>

          {/* Sub-selector de Vista Multidimensional */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setProfitView('product')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: profitView === 'product' ? '#2E5339' : '#F1F5F9',
                color: profitView === 'product' ? '#FFFFFF' : '#334155',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Package size={16} /> Por Producto
            </button>

            <button
              onClick={() => setProfitView('volume')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: profitView === 'volume' ? '#2E5339' : '#F1F5F9',
                color: profitView === 'volume' ? '#FFFFFF' : '#334155',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <BarChart2 size={16} /> Por Volumen (Kg / Unidades)
            </button>

            <button
              onClick={() => setProfitView('channel')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: profitView === 'channel' ? '#2E5339' : '#F1F5F9',
                color: profitView === 'channel' ? '#FFFFFF' : '#334155',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <PieChart size={16} /> Por Canal de Venta
            </button>

            <button
              onClick={() => setProfitView('seller')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: profitView === 'seller' ? '#2E5339' : '#F1F5F9',
                color: profitView === 'seller' ? '#FFFFFF' : '#334155',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Users size={16} /> Por Vendedor
            </button>
          </div>

          {/* Tabla de Desglose según vista seleccionada */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            {profitView === 'product' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Rentabilidad y Margen Bruto por Producto</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px' }}>Producto</th>
                      <th style={{ padding: '12px' }}>Categoría</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Volumen Vendido</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ingresos Totales</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Costo Directo</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ganancia Bruta</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Margen %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.breakdownByProduct.map((prod, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{prod.productName}</td>
                        <td style={{ padding: '12px', color: '#64748B' }}>{prod.category}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{prod.quantitySoldKg} kg ({prod.quantitySoldUnits} un)</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{prod.totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#DC2626' }}>{prod.totalDirectCost.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>{prod.grossProfit.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{prod.marginPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {profitView === 'volume' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Rentabilidad por Volumen (Kg vs Unidades)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px' }}>Tipo de Unidad</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Volumen Total</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ingresos Brutos</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Costo Estimado</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ganancia Bruta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.breakdownByVolume.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{v.unitType}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{v.totalVolume}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{v.totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#DC2626' }}>{v.totalCost.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>{v.grossProfit.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {profitView === 'channel' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Comparativa de Rentabilidad Neta por Canal</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px' }}>Canal de Venta</th>
                      <th style={{ padding: '12px' }}>Pedidos</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ventas Brutas</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Comisión Vendedor</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ingreso Neto Canal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.breakdownByChannel.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{c.channelLabel}</td>
                        <td style={{ padding: '12px' }}>{c.ordersCount} pedidos</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{c.totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#D97706' }}>-{c.sellerCommissionsAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>{c.netRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {profitView === 'seller' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Desempeño Comercial y Comisiones por Vendedor</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px' }}>Vendedor</th>
                      <th style={{ padding: '12px' }}>Rol</th>
                      <th style={{ padding: '12px' }}>Pedidos</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Venta Total</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Ticket Promedio</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Comisión Devengada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.breakdownBySeller.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{s.sellerName}</td>
                        <td style={{ padding: '12px' }}><span style={{ fontSize: '12px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '6px' }}>{s.role}</span></td>
                        <td style={{ padding: '12px' }}>{s.totalOrders} pedidos</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{s.totalSalesAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{s.averageTicket.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>{s.earnedCommissionsAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CONFIGURACIÓN DE TARIFAS DE COMISIÓN POR CANAL */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
            Configuración de % de Comisión por Canal de Venta
          </h3>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
            Define qué porcentaje de comisión devenga cada usuario según el canal donde se originó la venta.
          </p>

          <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Seleccionar Usuario:</label>
            <select
              value={configUserId}
              onChange={e => setConfigUserId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { channel: 'LOCAL', label: 'Mostrador / Local Directo', defaultPct: 2.5 },
              { channel: 'WHATSAPP', label: 'Ventas por WhatsApp', defaultPct: 4.0 },
              { channel: 'ONLINE_STORE', label: 'Tienda Online Web', defaultPct: 5.0 },
              { channel: 'INSTAGRAM', label: 'Instagram / Redes', defaultPct: 4.5 }
            ].map(ch => {
              const currentRate = configRates.find(r => r.channel === ch.channel)?.commissionPercentage ?? ch.defaultPct;

              return (
                <div key={ch.channel} style={{ border: '1px solid #E2E8F0', padding: '18px', borderRadius: '12px', backgroundColor: '#F8FAFC' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1E293B' }}>{ch.label}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={currentRate}
                      onChange={e => handleSaveRate(ch.channel, parseFloat(e.target.value) || 0)}
                      style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px', fontWeight: 700 }}
                    />
                    <span style={{ fontWeight: 700, color: '#334155' }}>%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Liquidación */}
      {showSettleModal && pendingData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>Confirmar Liquidación de Comisiones</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
              Se liquidarán <strong>{pendingData.orders.length} pedidos pagados</strong> por un total devengado de:
            </p>

            <div style={{ backgroundColor: '#F0F7F2', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#2E5339' }}>
                {pendingData.totalPendingCommission.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Medio de Pago:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo de Caja</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Notas u Observaciones:</label>
              <textarea
                value={settlementNotes}
                onChange={e => setSettlementNotes(e.target.value)}
                placeholder="Ej: Pago de comisiones quincenales recibo N° 45"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', height: '70px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettleModal(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSettle}
                disabled={settling}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2E5339', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
              >
                {settling ? 'Procesando...' : 'Confirmar y Liquidar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
