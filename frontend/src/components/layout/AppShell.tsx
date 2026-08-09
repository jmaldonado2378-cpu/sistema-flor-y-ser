import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import {
  DashboardPage,
  CustomersPage,
  SalesPage,
  StockPage,
  SuppliersPage,
  ReceiptsPage,
  FractioningPage,
  OrdersKanbanPage,
  CheckingAccountsPage,
  AccountsPayablePage,
  ExpensesPage,
  PricingPage,
  TasksKanbanPage,
  LabelsPage,
  SettingsPage,
  ArticleFamiliesPage,
} from '../../pages';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tab-dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'tab-dashboard': return <DashboardPage onTabChange={setActiveTab} />;
      case 'tab-crm': return <CustomersPage onTabChange={setActiveTab} />;
      case 'tab-sales': return <SalesPage onTabChange={setActiveTab} />;
      case 'tab-stock': return <StockPage onTabChange={setActiveTab} />;
      case 'tab-receipts': return <ReceiptsPage onTabChange={setActiveTab} />;
      case 'tab-fractional': return <FractioningPage onTabChange={setActiveTab} />;
      case 'tab-orders': return <OrdersKanbanPage onTabChange={setActiveTab} />;
      case 'tab-suppliers': return <SuppliersPage onTabChange={setActiveTab} />;
      case 'tab-cc-clients': return <CheckingAccountsPage onTabChange={setActiveTab} />;
      case 'tab-cc-suppliers': return <AccountsPayablePage onTabChange={setActiveTab} />;
      case 'tab-expenses': return <ExpensesPage onTabChange={setActiveTab} />;
      case 'tab-pricing': return <PricingPage onTabChange={setActiveTab} />;
      case 'tab-tasks': return <TasksKanbanPage onTabChange={setActiveTab} />;
      case 'tab-labels': return <LabelsPage onTabChange={setActiveTab} />;
      case 'tab-settings': return <SettingsPage onTabChange={setActiveTab} />;
      case 'tab-families': return <ArticleFamiliesPage onTabChange={setActiveTab} />;
      default: return <DashboardPage onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        collapsed={collapsed} 
        onToggleCollapse={() => setCollapsed(!collapsed)} 
      />
      <div className="main-content">
        <TopBar userName="María Clara" userAvatar="MC" />
        <main className="content-scrollable">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
